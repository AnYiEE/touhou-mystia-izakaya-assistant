import { type Transaction } from 'kysely';

import type { TAuthenticatedSessionIdentity } from '@/features/account/server/persistence/contracts';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { lockActiveUserSessionInTransaction } from '@/features/account/server/persistence/repositories/sessions';

import type {
	TDatabase,
	TSsoGrantEventNew,
	TSsoTicket,
	TUser,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import {
	listActiveSsoClientSecretHashesInTransaction,
	parseSsoClient,
	verifyAndTouchSsoClientSecretInTransaction,
} from './clients';
import { createSsoTicketToken, hashSsoTicket, verifyPkce } from './crypto';
import { getSsoUserStatusError } from './grants';
import {
	checkSsoClientEnabled,
	checkSsoClientId,
	checkSsoClientSecret,
	checkSsoCodeChallenge,
	checkSsoCodeVerifier,
	checkSsoRedirectUriFormat,
	checkSsoTicketFormat,
} from './validation';

export const SSO_TICKET_BYTE_LENGTH = 32;
export const SSO_TICKET_TTL_MS = 60 * 1000;

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const TICKET_TABLE_NAME = TABLE_NAME_MAP.ssoTicket;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const GRANT_EVENT_TABLE_NAME = TABLE_NAME_MAP.ssoGrantEvent;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

export type TSsoTicketValidationUserError = 'user-deleted' | 'user-disabled';

export interface ISsoTicketValidationResult {
	ticket: TSsoTicket;
	user: TUser | null;
	user_error: TSsoTicketValidationUserError | null;
}

export type TSsoTicketWithClientSecretValidationResult =
	| { status: 'client-disabled' }
	| { status: 'invalid-client' }
	| { status: 'invalid-ticket' }
	| { status: 'validated'; validation: ISsoTicketValidationResult };

export async function createSsoTicket(
	clientId: string,
	userId: string,
	redirectUri: string,
	codeChallenge: string,
	session: TAuthenticatedSessionIdentity,
	writeAuditLog?: (trx: Transaction<TDatabase>, now: number) => Promise<void>
) {
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoRedirectUriFormat(redirectUri) ||
		!checkSsoCodeChallenge(codeChallenge)
	) {
		throw new Error('invalid-object-structure');
	}

	const db = await getAccountDatabase();
	const now = Date.now();
	const ticket = createSsoTicketToken(SSO_TICKET_BYTE_LENGTH);
	const ticketHash = hashSsoTicket(ticket);

	const didCreate = await db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return false;
		}
		await trx
			.insertInto(TICKET_TABLE_NAME)
			.values({
				client_id: clientId,
				code_challenge: codeChallenge,
				created_at: now,
				expires_at: now + SSO_TICKET_TTL_MS,
				redirect_uri: redirectUri,
				ticket_hash: ticketHash,
				used_at: null,
				user_id: userId,
			})
			.execute();

		await writeAuditLog?.(trx, now);
		return true;
	});

	return didCreate
		? { status: 'ok' as const, ticket }
		: { status: 'unauthorized' as const };
}

async function validateSsoTicketInTransaction(
	trx: Transaction<TDatabase>,
	clientId: string,
	ticket: string,
	codeVerifier: string,
	now: number
): Promise<ISsoTicketValidationResult | null> {
	const ticketHash = hashSsoTicket(ticket);
	const record =
		(await trx
			.selectFrom(TICKET_TABLE_NAME)
			.selectAll()
			.where('ticket_hash', '=', ticketHash)
			.executeTakeFirst()) ?? null;
	if (record === null) {
		return null;
	}
	if (
		record.client_id !== clientId ||
		record.used_at !== null ||
		record.revoked_at !== null ||
		record.expires_at <= now ||
		!verifyPkce(record.code_challenge, codeVerifier)
	) {
		return null;
	}

	const result = await trx
		.updateTable(TICKET_TABLE_NAME)
		.set({ used_at: now })
		.where('ticket_hash', '=', ticketHash)
		.where('client_id', '=', clientId)
		.where('used_at', 'is', null)
		.where('revoked_at', 'is', null)
		.where('expires_at', '>', now)
		.executeTakeFirst();
	if (result.numUpdatedRows !== 1n) {
		return null;
	}

	const user =
		(await trx
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', record.user_id)
			.executeTakeFirst()) ?? null;
	if (user === null) {
		return { ticket: record, user, user_error: 'user-deleted' };
	}

	const userError = getSsoUserStatusError(user);
	if (userError !== null) {
		return { ticket: record, user, user_error: userError };
	}

	const existingGrant = await trx
		.selectFrom(GRANT_TABLE_NAME)
		.select('client_id')
		.where('client_id', '=', clientId)
		.where('user_id', '=', user.id)
		.executeTakeFirst();

	await trx
		.insertInto(GRANT_TABLE_NAME)
		.values({
			client_id: clientId,
			created_at: now,
			updated_at: now,
			user_id: user.id,
		})
		.onConflict((oc) =>
			oc
				.columns(['client_id', 'user_id'])
				.doUpdateSet({ updated_at: now })
		)
		.execute();

	await trx
		.insertInto(GRANT_EVENT_TABLE_NAME)
		.values({
			actor_id: clientId,
			actor_type: 'client',
			client_id: clientId,
			created_at: now,
			event:
				existingGrant === undefined
					? 'grant_created'
					: 'grant_refreshed',
			reason: null,
			user_id: user.id,
		} satisfies TSsoGrantEventNew)
		.execute();

	return { ticket: record, user, user_error: null };
}

export async function validateSsoTicket(
	clientId: string,
	ticket: string,
	codeVerifier: string
): Promise<ISsoTicketValidationResult | null> {
	if (
		!checkSsoClientId(clientId) ||
		!checkSsoTicketFormat(ticket) ||
		!checkSsoCodeVerifier(codeVerifier)
	) {
		return null;
	}

	const db = await getAccountDatabase();
	const now = Date.now();

	return db
		.transaction()
		.execute((trx) =>
			validateSsoTicketInTransaction(
				trx,
				clientId,
				ticket,
				codeVerifier,
				now
			)
		);
}

export async function validateSsoTicketWithClientSecret(
	clientId: string,
	clientSecret: string,
	ticket: string,
	codeVerifier: string
): Promise<TSsoTicketWithClientSecretValidationResult> {
	if (!checkSsoClientId(clientId) || !checkSsoClientSecret(clientSecret)) {
		return { status: 'invalid-client' };
	}
	if (!checkSsoTicketFormat(ticket) || !checkSsoCodeVerifier(codeVerifier)) {
		return { status: 'invalid-ticket' };
	}

	const db = await getAccountDatabase();
	const now = Date.now();

	return db.transaction().execute(async (trx) => {
		const record =
			(await trx
				.selectFrom(CLIENT_TABLE_NAME)
				.selectAll()
				.where('id', '=', clientId)
				.where('deleted_at', 'is', null)
				.executeTakeFirst()) ?? null;
		if (record === null) {
			return { status: 'invalid-client' };
		}

		const client = parseSsoClient(
			record,
			await listActiveSsoClientSecretHashesInTransaction(trx, record.id)
		);
		const isSecretValid = await verifyAndTouchSsoClientSecretInTransaction(
			trx,
			client,
			clientSecret,
			now
		);
		if (!isSecretValid) {
			return { status: 'invalid-client' };
		}
		if (!checkSsoClientEnabled(client)) {
			return { status: 'client-disabled' };
		}

		const validation = await validateSsoTicketInTransaction(
			trx,
			clientId,
			ticket,
			codeVerifier,
			now
		);

		return validation === null
			? { status: 'invalid-ticket' }
			: { status: 'validated', validation };
	});
}

export async function deleteExpiredSsoTickets(expiredAt = Date.now()) {
	const db = await getAccountDatabase();

	return db.transaction().execute(async (trx) => {
		const result = await trx
			.deleteFrom(TICKET_TABLE_NAME)
			.where('expires_at', '<=', expiredAt)
			.executeTakeFirst();

		return Number(result.numDeletedRows);
	});
}
