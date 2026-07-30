import { type Transaction } from 'kysely';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import type { TAuthenticatedSessionIdentity } from '@/features/account/server/persistence/contracts';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { lockActiveUserSessionInTransaction } from '@/features/account/server/persistence/repositories/sessions';

import type {
	TDatabase,
	TSsoClient,
	TUser,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

const CLIENT_TABLE_NAME = TABLE_NAME_MAP.ssoClient;
const GRANT_TABLE_NAME = TABLE_NAME_MAP.ssoUserClientGrant;
const USER_TABLE_NAME = TABLE_NAME_MAP.user;

export function getSsoUserStatusError(user: TUser) {
	if (user.status === USER_STATUS_MAP.disabled) {
		return 'user-disabled';
	}
	if (user.status === USER_STATUS_MAP.deleted) {
		return 'user-deleted';
	}

	return null;
}

export async function hasSsoUserClientGrant(
	clientId: TSsoClient['id'],
	userId: TUser['id']
) {
	const db = await getAccountDatabase();
	const record = await db
		.selectFrom(GRANT_TABLE_NAME)
		.select('client_id')
		.where('client_id', '=', clientId)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return record !== undefined;
}

export function createSsoUserClientGrant(
	record: Awaited<
		ReturnType<typeof listSsoUserClientGrantsForUserInTransaction>
	>[number]
) {
	return {
		client: { id: record.client_id, name: record.client_name },
		created_at: record.created_at,
		updated_at: record.updated_at,
	};
}

export async function listSsoUserClientGrantsForUser(userId: TUser['id']) {
	const db = await getAccountDatabase();
	const records = await db
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${GRANT_TABLE_NAME}.created_at`,
			`${GRANT_TABLE_NAME}.updated_at`,
		])
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
		.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
		.execute();

	return records.map(createSsoUserClientGrant);
}

export async function listSsoUserClientGrantsForUserInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id']
) {
	return trx
		.selectFrom(GRANT_TABLE_NAME)
		.innerJoin(
			CLIENT_TABLE_NAME,
			`${GRANT_TABLE_NAME}.client_id`,
			`${CLIENT_TABLE_NAME}.id`
		)
		.select([
			`${CLIENT_TABLE_NAME}.id as client_id`,
			`${CLIENT_TABLE_NAME}.name as client_name`,
			`${GRANT_TABLE_NAME}.created_at`,
			`${GRANT_TABLE_NAME}.updated_at`,
		])
		.where(`${GRANT_TABLE_NAME}.user_id`, '=', userId)
		.orderBy(`${GRANT_TABLE_NAME}.updated_at`, 'desc')
		.orderBy(`${CLIENT_TABLE_NAME}.id`, 'asc')
		.execute();
}

export async function listSsoUserClientGrantsForActiveUserSession(
	userId: TUser['id'],
	session: TAuthenticatedSessionIdentity
) {
	const db = await getAccountDatabase();

	const result = await db.transaction().execute(async (trx) => {
		if (!(await lockActiveUserSessionInTransaction(trx, userId, session))) {
			return { status: 'unauthorized' as const };
		}

		return {
			records: await listSsoUserClientGrantsForUserInTransaction(
				trx,
				userId
			),
			status: 'ok' as const,
		};
	});
	if (result.status === 'unauthorized') {
		return result;
	}

	return {
		grants: result.records.map(createSsoUserClientGrant),
		status: 'ok' as const,
	};
}

export async function getSsoUserById(userId: TUser['id']) {
	const db = await getAccountDatabase();

	return (
		(await db
			.selectFrom(USER_TABLE_NAME)
			.selectAll()
			.where('id', '=', userId)
			.executeTakeFirst()) ?? null
	);
}
