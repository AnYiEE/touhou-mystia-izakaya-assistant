import { type Transaction } from 'kysely';

import type { TDatabase, TUser } from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

export async function deleteCredentialsByUserIdInTransaction(
	trx: Transaction<TDatabase>,
	userId: TUser['id']
) {
	const result = await trx
		.deleteFrom(TABLE_NAME_MAP.userWebauthnCredential)
		.where('user_id', '=', userId)
		.executeTakeFirst();

	return Number(result.numDeletedRows);
}
