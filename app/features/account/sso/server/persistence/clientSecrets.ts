import { type Transaction } from 'kysely';
import { createHash } from 'node:crypto';

import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { createSsoClientSecret } from '@/features/account/sso/server/crypto';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TSsoClient,
	TSsoClientSecret,
	TSsoClientSecretNew,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { canAddNonNegativeSafeIntegers } from '@/shared/utilities/numbers/check';

import { enqueueSsoClientCallbackInTransaction } from './callbackQueue';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;

const CLIENT_SECRET_TABLE_NAME = TABLE_NAME_MAP.ssoClientSecret;

export type TSsoClientSecretMutationError =
	| 'client-disabled'
	| 'last-active-secret'
	| 'sso-client-not-found'
	| 'sso-client-secret-invalid-state'
	| 'sso-client-secret-not-found';

export type TSsoClientSecretMutationResult =
	| { error: TSsoClientSecretMutationError; status: 'error' }
	| { secret: TSsoClientSecret; status: 'ok' };

export type TSsoClientSecretCreateResult =
	| { error: TSsoClientSecretMutationError; status: 'error' }
	| { client_secret: string; secret: TSsoClientSecret; status: 'ok' };

export interface ISsoClientSecretUpdateInput {
	disabled?: boolean;
	label?: string | null;
}

function serializeStringArray(value: string[]) {
	return JSON.stringify(value);
}

function createSsoClientSecretRecord(
	clientId: TSsoClient['id'],
	secretHash: string,
	position: number,
	now: number,
	options: { createdByAdmin?: string | null; label?: string | null } = {}
) {
	return {
		client_id: clientId,
		created_at: now,
		created_by_admin: options.createdByAdmin ?? null,
		disabled_at: null,
		id: createHash('sha256')
			.update(`${clientId}:${secretHash}`)
			.digest('hex')
			.slice(0, 32),
		label:
			options.label ??
			(position === 0 ? 'Primary secret' : `Secret #${position + 1}`),
		last_used_at: null,
		position,
		revoked_at: null,
		secret_hash: secretHash,
	} satisfies TSsoClientSecretNew;
}

export async function syncSsoClientSecretRecords(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	secretHashes: string[],
	now: number
) {
	if (secretHashes.length === 0) {
		return;
	}

	await trx
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ revoked_at: now })
		.where('client_id', '=', clientId)
		.where('revoked_at', 'is', null)
		.where('secret_hash', 'not in', secretHashes)
		.execute();

	await trx
		.insertInto(CLIENT_SECRET_TABLE_NAME)
		.values(
			secretHashes.map((secretHash, index) =>
				createSsoClientSecretRecord(clientId, secretHash, index, now)
			)
		)
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'secret_hash'])
				.doUpdateSet((eb) => ({
					disabled_at: null,
					position: eb.ref('excluded.position'),
					revoked_at: null,
				}))
		)
		.execute();
}

async function listActiveSsoClientSecretHashesInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const records = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select('secret_hash')
		.where('client_id', '=', clientId)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();

	return records.map((record) => record.secret_hash);
}

async function syncSsoClientLegacySecretHashesInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	now: number
) {
	const secretHashes = await listActiveSsoClientSecretHashesInTransaction(
		trx,
		clientId
	);

	await trx
		.updateTable(CLIENT_TABLE_NAME)
		.set({
			secret_hashes: serializeStringArray(secretHashes),
			updated_at: now,
		})
		.where('id', '=', clientId)
		.execute();

	return secretHashes;
}

async function countActiveSsoClientSecretsInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const record = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select((eb) => eb.fn.countAll<number>().as('total_count'))
		.where('client_id', '=', clientId)
		.where('disabled_at', 'is', null)
		.where('revoked_at', 'is', null)
		.executeTakeFirstOrThrow();

	return normalizeDatabaseCount(
		record.total_count,
		'invalid-sso-grant-count'
	);
}

async function readSsoClientSecretInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id']
) {
	return (
		(await trx
			.selectFrom(CLIENT_SECRET_TABLE_NAME)
			.selectAll()
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.executeTakeFirst()) ?? null
	);
}

async function readMutableSsoClientErrorInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
): Promise<TSsoClientSecretMutationError | null> {
	const client = await trx
		.selectFrom(CLIENT_TABLE_NAME)
		.select('disabled_at')
		.where('id', '=', clientId)
		.where('deleted_at', 'is', null)
		.executeTakeFirst();

	if (client === undefined) {
		return 'sso-client-not-found';
	}
	if (client.disabled_at !== null) {
		return 'client-disabled';
	}

	return null;
}

async function getNextSsoClientSecretPositionInTransaction(
	trx: Transaction<TDatabase>,
	clientId: TSsoClient['id']
) {
	const record = await trx
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.select('position')
		.where('client_id', '=', clientId)
		.orderBy('position', 'desc')
		.limit(1)
		.executeTakeFirst();

	if (record === undefined) {
		return 0;
	}

	return canAddNonNegativeSafeIntegers(record.position, 2)
		? record.position + 1
		: null;
}

export async function listSsoClientSecrets(clientId: TSsoClient['id']) {
	const db = await getAccountDatabase();

	return db
		.selectFrom(CLIENT_SECRET_TABLE_NAME)
		.selectAll()
		.where('client_id', '=', clientId)
		.orderBy('position', 'asc')
		.orderBy('created_at', 'asc')
		.orderBy('id', 'asc')
		.execute();
}

export async function createSsoClientSecretForClient(
	clientId: TSsoClient['id'],
	input: { createdByAdmin?: string | null; label?: string | null } = {},
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		result: Extract<TSsoClientSecretCreateResult, { status: 'ok' }>
	) => Promise<void>
): Promise<TSsoClientSecretCreateResult> {
	const db = await getAccountDatabase();
	const now = Date.now();
	const secret = createSsoClientSecret();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const position = await getNextSsoClientSecretPositionInTransaction(
			trx,
			clientId
		);
		if (position === null) {
			return {
				error: 'sso-client-secret-invalid-state',
				status: 'error',
			};
		}
		const record = createSsoClientSecretRecord(
			clientId,
			secret.secret_hash,
			position,
			now,
			input
		);
		const createdSecret = await trx
			.insertInto(CLIENT_SECRET_TABLE_NAME)
			.values(record)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		await enqueueSsoClientCallbackInTransaction(
			trx,
			clientId,
			'secret_rotated',
			now,
			{ action: 'created', secret_id: createdSecret.id }
		);

		const result = {
			client_secret: secret.client_secret,
			secret: createdSecret,
			status: 'ok' as const,
		};
		await writeAuditLog?.(trx, now, result);

		return result;
	});
}

export async function renameSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	label: string | null
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const secret = await db
		.updateTable(CLIENT_SECRET_TABLE_NAME)
		.set({ label })
		.where('client_id', '=', clientId)
		.where('id', '=', secretId)
		.returningAll()
		.executeTakeFirst();

	return secret === undefined
		? { error: 'sso-client-secret-not-found', status: 'error' }
		: { secret, status: 'ok' };
}

export async function setSsoClientSecretDisabled(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	disabled: boolean
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (disabled && currentSecret.disabled_at === null) {
			const activeCount = await countActiveSsoClientSecretsInTransaction(
				trx,
				clientId
			);
			if (activeCount <= 1) {
				return { error: 'last-active-secret', status: 'error' };
			}
		}

		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({
				disabled_at: disabled
					? (currentSecret.disabled_at ?? now)
					: null,
			})
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		if (
			(disabled && currentSecret.disabled_at === null) ||
			(!disabled && currentSecret.disabled_at !== null)
		) {
			await enqueueSsoClientCallbackInTransaction(
				trx,
				clientId,
				'secret_rotated',
				now,
				{
					action: disabled ? 'disabled' : 'enabled',
					secret_id: secret.id,
				}
			);
		}

		return { secret, status: 'ok' };
	});
}

export async function updateSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	input: ISsoClientSecretUpdateInput,
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		secret: TSsoClientSecret
	) => Promise<void>
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (
			input.disabled === true &&
			currentSecret.disabled_at === null &&
			(await countActiveSsoClientSecretsInTransaction(trx, clientId)) <= 1
		) {
			return { error: 'last-active-secret', status: 'error' };
		}

		const nextDisabledAt =
			input.disabled === undefined
				? currentSecret.disabled_at
				: input.disabled
					? (currentSecret.disabled_at ?? now)
					: null;
		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({
				...(input.label === undefined ? {} : { label: input.label }),
				disabled_at: nextDisabledAt,
			})
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		if (
			input.disabled !== undefined &&
			currentSecret.disabled_at !== nextDisabledAt
		) {
			await enqueueSsoClientCallbackInTransaction(
				trx,
				clientId,
				'secret_rotated',
				now,
				{
					action: input.disabled ? 'disabled' : 'enabled',
					secret_id: secret.id,
				}
			);
		}

		await writeAuditLog?.(trx, now, secret);

		return { secret, status: 'ok' };
	});
}

export async function revokeSsoClientSecret(
	clientId: TSsoClient['id'],
	secretId: TSsoClientSecret['id'],
	writeAuditLog?: (
		trx: Transaction<TDatabase>,
		now: number,
		secret: TSsoClientSecret
	) => Promise<void>
): Promise<TSsoClientSecretMutationResult> {
	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const clientError = await readMutableSsoClientErrorInTransaction(
			trx,
			clientId
		);
		if (clientError !== null) {
			return { error: clientError, status: 'error' };
		}

		const currentSecret = await readSsoClientSecretInTransaction(
			trx,
			clientId,
			secretId
		);
		if (currentSecret?.revoked_at !== null) {
			return { error: 'sso-client-secret-not-found', status: 'error' };
		}

		if (currentSecret.disabled_at === null) {
			const activeCount = await countActiveSsoClientSecretsInTransaction(
				trx,
				clientId
			);
			if (activeCount <= 1) {
				return { error: 'last-active-secret', status: 'error' };
			}
		}

		const secret = await trx
			.updateTable(CLIENT_SECRET_TABLE_NAME)
			.set({ revoked_at: now })
			.where('client_id', '=', clientId)
			.where('id', '=', secretId)
			.where('revoked_at', 'is', null)
			.returningAll()
			.executeTakeFirstOrThrow();

		await syncSsoClientLegacySecretHashesInTransaction(trx, clientId, now);
		await enqueueSsoClientCallbackInTransaction(
			trx,
			clientId,
			'secret_rotated',
			now,
			{ action: 'revoked', secret_id: secret.id }
		);

		await writeAuditLog?.(trx, now, secret);

		return { secret, status: 'ok' };
	});
}
