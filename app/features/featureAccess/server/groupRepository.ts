import { type Transaction } from 'kysely';
import { randomUUID } from 'node:crypto';

import { type TFeatureModuleKey } from '@/domain/featureAccess/contracts';

import { normalizeDatabaseCount } from '@/infrastructure/database/queryValues';
import type {
	TDatabase,
	TFeatureAccessGroup,
	TFeatureAccessGroupNew,
} from '@/infrastructure/database/schema';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

export interface IUpsertFeatureAccessGroupInput {
	createdByAdmin: string | null;
	description: string;
	id?: string;
	name: string;
	now?: number;
}

export function normalizeFeatureAccessGroupName(name: string) {
	return name.normalize('NFKC').trim().toLowerCase();
}

function createGroupRecord({
	createdByAdmin,
	description,
	id = randomUUID(),
	name,
	now = Date.now(),
}: IUpsertFeatureAccessGroupInput): TFeatureAccessGroupNew {
	const normalizedName = name.trim();
	return {
		created_at: now,
		created_by_admin: createdByAdmin,
		description: description.trim(),
		id,
		name: normalizedName,
		name_normalized: normalizeFeatureAccessGroupName(normalizedName),
		updated_at: now,
	};
}

export function listFeatureAccessGroupsInTransaction(
	trx: Transaction<TDatabase>
) {
	return trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroup)
		.selectAll()
		.orderBy('updated_at', 'desc')
		.orderBy('id', 'desc')
		.execute();
}

export function getFeatureAccessGroupInTransaction(
	trx: Transaction<TDatabase>,
	id: string
) {
	return trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroup)
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
}

export function findFeatureAccessGroupByNameNormalizedInTransaction(
	trx: Transaction<TDatabase>,
	name: string
) {
	return trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroup)
		.select('id')
		.where('name_normalized', '=', normalizeFeatureAccessGroupName(name))
		.executeTakeFirst();
}

export async function listFeatureAccessGroupSummariesInTransaction(
	trx: Transaction<TDatabase>
) {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroup)
		.selectAll()
		.select((eb) => [
			eb
				.selectFrom(TABLE_NAME_MAP.featureAccessGroupModule)
				.select((subquery) =>
					subquery.fn.countAll<number>().as('count')
				)
				.whereRef(
					`${TABLE_NAME_MAP.featureAccessGroupModule}.group_id`,
					'=',
					`${TABLE_NAME_MAP.featureAccessGroup}.id`
				)
				.as('module_count'),
			eb
				.selectFrom(TABLE_NAME_MAP.featureAccessGroupMember)
				.select((subquery) =>
					subquery.fn.countAll<number>().as('count')
				)
				.whereRef(
					`${TABLE_NAME_MAP.featureAccessGroupMember}.group_id`,
					'=',
					`${TABLE_NAME_MAP.featureAccessGroup}.id`
				)
				.as('member_count'),
		])
		.orderBy('updated_at', 'desc')
		.orderBy('id', 'desc')
		.execute();

	return records.map((record) => ({
		...record,
		member_count: normalizeDatabaseCount(
			record.member_count ?? -1,
			'invalid-feature-access-group-member-count'
		),
		module_count: normalizeDatabaseCount(
			record.module_count ?? -1,
			'invalid-feature-access-group-module-count'
		),
	}));
}

export async function upsertFeatureAccessGroupInTransaction(
	trx: Transaction<TDatabase>,
	input: IUpsertFeatureAccessGroupInput
): Promise<TFeatureAccessGroup> {
	if (input.id === undefined) {
		return trx
			.insertInto(TABLE_NAME_MAP.featureAccessGroup)
			.values(createGroupRecord(input))
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	const name = input.name.trim();
	const record = await trx
		.updateTable(TABLE_NAME_MAP.featureAccessGroup)
		.set({
			description: input.description.trim(),
			name,
			name_normalized: normalizeFeatureAccessGroupName(name),
			updated_at: input.now ?? Date.now(),
		})
		.where('id', '=', input.id)
		.returningAll()
		.executeTakeFirst();
	if (record === undefined) {
		throw new Error('feature-access-group-not-found');
	}
	return record;
}

export async function deleteFeatureAccessGroupInTransaction(
	trx: Transaction<TDatabase>,
	id: string
) {
	const result = await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroup)
		.where('id', '=', id)
		.executeTakeFirst();
	return Number(result.numDeletedRows);
}

export async function listFeatureAccessGroupModulesInTransaction(
	trx: Transaction<TDatabase>,
	groupId: string
): Promise<TFeatureModuleKey[]> {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroupModule)
		.select('module_key')
		.where('group_id', '=', groupId)
		.orderBy('module_key')
		.execute();
	return records.map(
		({ module_key: moduleKey }) => moduleKey as TFeatureModuleKey
	);
}

export async function replaceFeatureAccessGroupModulesInTransaction(
	trx: Transaction<TDatabase>,
	groupId: string,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroupModule)
		.where('group_id', '=', groupId)
		.execute();
	const uniqueModuleKeys = [...new Set(moduleKeys)];
	if (uniqueModuleKeys.length === 0) {
		return;
	}
	await trx
		.insertInto(TABLE_NAME_MAP.featureAccessGroupModule)
		.values(
			uniqueModuleKeys.map((moduleKey) => ({
				group_id: groupId,
				module_key: moduleKey,
			}))
		)
		.execute();
}

export async function listFeatureAccessGroupMemberIdsInTransaction(
	trx: Transaction<TDatabase>,
	groupId: string
) {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.select('user_id')
		.where('group_id', '=', groupId)
		.orderBy('user_id')
		.execute();
	return records.map(({ user_id: userId }) => userId);
}

export async function listExistingUserIdsInTransaction(
	trx: Transaction<TDatabase>,
	userIds: ReadonlyArray<string>
) {
	if (userIds.length === 0) {
		return [];
	}

	const records = await trx
		.selectFrom(TABLE_NAME_MAP.user)
		.select('id')
		.where('id', 'in', [...new Set(userIds)])
		.where('status', '!=', 'deleted')
		.execute();
	return records.map(({ id }) => id);
}

export async function listExistingFeatureAccessGroupIdsInTransaction(
	trx: Transaction<TDatabase>,
	groupIds: ReadonlyArray<string>
) {
	if (groupIds.length === 0) {
		return [];
	}

	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroup)
		.select('id')
		.where('id', 'in', [...new Set(groupIds)])
		.execute();
	return records.map(({ id }) => id);
}

export async function replaceFeatureAccessGroupMembersInTransaction(
	trx: Transaction<TDatabase>,
	groupId: string,
	userIds: ReadonlyArray<string>,
	createdByAdmin: string | null,
	now = Date.now()
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.where('group_id', '=', groupId)
		.execute();
	const uniqueUserIds = [...new Set(userIds)];
	if (uniqueUserIds.length === 0) {
		return;
	}
	await trx
		.insertInto(TABLE_NAME_MAP.featureAccessGroupMember)
		.values(
			uniqueUserIds.map((userId) => ({
				created_at: now,
				created_by_admin: createdByAdmin,
				group_id: groupId,
				user_id: userId,
			}))
		)
		.execute();
}

export async function listFeatureAccessGroupMembershipsForUserInTransaction(
	trx: Transaction<TDatabase>,
	userId: string
) {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.select('group_id')
		.where('user_id', '=', userId)
		.orderBy('group_id')
		.execute();
	return records.map(({ group_id: groupId }) => groupId);
}

export async function replaceFeatureAccessGroupMembershipsForUserInTransaction(
	trx: Transaction<TDatabase>,
	userId: string,
	groupIds: ReadonlyArray<string>,
	createdByAdmin: string | null,
	now = Date.now()
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.where('user_id', '=', userId)
		.execute();
	const uniqueGroupIds = [...new Set(groupIds)];
	if (uniqueGroupIds.length === 0) {
		return;
	}
	await trx
		.insertInto(TABLE_NAME_MAP.featureAccessGroupMember)
		.values(
			uniqueGroupIds.map((groupId) => ({
				created_at: now,
				created_by_admin: createdByAdmin,
				group_id: groupId,
				user_id: userId,
			}))
		)
		.execute();
}

export async function deleteFeatureAccessGroupMembersByUserIdInTransaction(
	trx: Transaction<TDatabase>,
	userId: string
) {
	await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.where('user_id', '=', userId)
		.execute();
}

export async function listFeatureAccessGroupModuleGrantsForUserInTransaction(
	trx: Transaction<TDatabase>,
	userId: string
) {
	const records = await trx
		.selectFrom(TABLE_NAME_MAP.featureAccessGroupMember)
		.innerJoin(
			TABLE_NAME_MAP.featureAccessGroupModule,
			`${TABLE_NAME_MAP.featureAccessGroupModule}.group_id`,
			`${TABLE_NAME_MAP.featureAccessGroupMember}.group_id`
		)
		.select([
			`${TABLE_NAME_MAP.featureAccessGroupMember}.group_id`,
			`${TABLE_NAME_MAP.featureAccessGroupModule}.module_key`,
		])
		.where(
			`${TABLE_NAME_MAP.featureAccessGroupMember}.user_id`,
			'=',
			userId
		)
		.orderBy(`${TABLE_NAME_MAP.featureAccessGroupModule}.module_key`)
		.orderBy(`${TABLE_NAME_MAP.featureAccessGroupMember}.group_id`)
		.execute();
	const result = new Map<TFeatureModuleKey, string[]>();
	for (const record of records) {
		const moduleKey = record.module_key as TFeatureModuleKey;
		const groupIds = result.get(moduleKey) ?? [];
		groupIds.push(record.group_id);
		result.set(moduleKey, groupIds);
	}
	return result;
}

export async function deleteFeatureAccessGroupsModulesByKeysInTransaction(
	trx: Transaction<TDatabase>,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	if (moduleKeys.length === 0) {
		return;
	}
	await trx
		.deleteFrom(TABLE_NAME_MAP.featureAccessGroupModule)
		.where('module_key', 'in', [...moduleKeys])
		.execute();
}
