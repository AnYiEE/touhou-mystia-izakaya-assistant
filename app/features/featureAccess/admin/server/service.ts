import { type Transaction } from 'kysely';
import { type NextRequest } from 'next/server';

import {
	type TFeatureAccessLevel,
	type TFeatureAccessOverrideEffect,
	type TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import {
	ACCOUNT_AUDIT_ACTION_MAP,
	createAccountAdminAuditLogInput,
	writeAccountAuditLogInTransaction,
} from '@/features/account/server/audit/service';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { type IListUsersOptions } from '@/features/account/server/persistence/repositories/users';
import { createAccountUserProfile } from '@/features/account/server/presentation/user';
import {
	FEATURE_ACCESS_GROUP_DESCRIPTION_MAX_LENGTH as GROUP_DESCRIPTION_MAX_LENGTH,
	FEATURE_ACCESS_GROUP_NAME_MAX_LENGTH as GROUP_NAME_MAX_LENGTH,
	type IAdminFeatureAccessGroupBody,
	type IAdminFeatureAccessGroupDetailData,
	type IAdminFeatureAccessGroupListData,
	type IAdminFeatureAccessGroupRecord,
	type IAdminFeatureAccessUserData,
	type IAdminFeatureAccessUserUpdateBody,
	type IAdminFeatureModuleListData,
	type IAdminFeatureModulePolicyUpdateBody,
} from '@/features/featureAccess/contracts';
import { evaluateFeatureAccessForUserInTransaction } from '@/features/featureAccess/server/accessService';
import {
	deleteFeatureAccessGroupInTransaction,
	findFeatureAccessGroupByNameNormalizedInTransaction,
	getFeatureAccessGroupInTransaction,
	listExistingFeatureAccessGroupIdsInTransaction,
	listExistingUserIdsInTransaction,
	listFeatureAccessGroupMemberIdsInTransaction,
	listFeatureAccessGroupMembershipsForUserInTransaction,
	listFeatureAccessGroupModulesInTransaction,
	listFeatureAccessGroupSummariesInTransaction,
	replaceFeatureAccessGroupMembersInTransaction,
	replaceFeatureAccessGroupMembershipsForUserInTransaction,
	replaceFeatureAccessGroupModulesInTransaction,
	upsertFeatureAccessGroupInTransaction,
} from '@/features/featureAccess/server/groupRepository';
import {
	listFeatureModulePoliciesInTransaction,
	upsertFeatureModulePolicyInTransaction,
} from '@/features/featureAccess/server/modulePolicyRepository';
import {
	listFeatureModuleDefinitionsInTransaction,
	resolveFeatureModuleDefinitionInTransaction,
} from '@/features/featureAccess/server/moduleRegistryService';
import {
	listUserFeatureAccessOverridesInTransaction,
	replaceUserFeatureAccessOverridesInTransaction,
} from '@/features/featureAccess/server/userAccessOverrideRepository';

import type { TDatabase } from '@/infrastructure/database/schema';
import { checkSqlitePrimaryKeyOrUniqueConstraintError } from '@/infrastructure/database/sqlite/constraintErrors';
import { TABLE_NAME_MAP } from '@/infrastructure/database/tableNames';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

export type TFeatureAccessAdminError =
	| 'feature-access-group-invalid'
	| 'feature-access-group-name-conflict'
	| 'feature-access-group-not-found'
	| 'feature-access-module-invalid'
	| 'feature-access-user-invalid'
	| 'feature-access-user-not-found';

export type TFeatureAccessAdminResult<TData> =
	| { data: TData; status: 'ok' }
	| { error: TFeatureAccessAdminError; status: 'error' };

function createAdminAuditInput({
	action,
	adminId,
	metadata,
	request,
	targetId,
	targetType,
}: {
	action:
		| typeof ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupCreated
		| typeof ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupDeleted
		| typeof ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupUpdated
		| typeof ACCOUNT_AUDIT_ACTION_MAP.adminFeaturePolicyUpdated
		| typeof ACCOUNT_AUDIT_ACTION_MAP.adminUserFeatureAccessUpdated;
	adminId: string;
	metadata: Record<string, unknown>;
	request: NextRequest;
	targetId: string;
	targetType: string;
}) {
	return createAccountAdminAuditLogInput({
		action,
		adminId,
		metadata,
		request,
		targetId,
		targetType,
	});
}

function checkUniqueStringArray(values: ReadonlyArray<string>) {
	return new Set(values).size === values.length;
}

function checkGroupInput(input: IAdminFeatureAccessGroupBody) {
	const name = input.name.trim();
	const description = input.description.trim();
	return (
		name.length > 0 &&
		name.length <= GROUP_NAME_MAX_LENGTH &&
		description.length <= GROUP_DESCRIPTION_MAX_LENGTH &&
		checkUniqueStringArray(input.module_keys) &&
		checkUniqueStringArray(input.user_ids)
	);
}

async function checkModuleKeysInTransaction(
	trx: Transaction<TDatabase>,
	moduleKeys: ReadonlyArray<TFeatureModuleKey>
) {
	for (const moduleKey of moduleKeys) {
		const definition = await resolveFeatureModuleDefinitionInTransaction(
			trx,
			moduleKey
		);
		if (definition === null) {
			return false;
		}
	}
	return true;
}

async function readUsersInTransaction(
	trx: Transaction<TDatabase>,
	userIds: ReadonlyArray<string>
) {
	if (userIds.length === 0) {
		return [];
	}
	return trx
		.selectFrom(TABLE_NAME_MAP.user)
		.selectAll()
		.where('id', 'in', [...userIds])
		.execute();
}

async function readGroupRecord(
	trx: Transaction<TDatabase>,
	id: string
): Promise<IAdminFeatureAccessGroupRecord | null> {
	const summaries = await listFeatureAccessGroupSummariesInTransaction(trx);
	return summaries.find((group) => group.id === id) ?? null;
}

export async function listAdminFeatureModules(
	locale: TLocale = DEFAULT_LOCALE
): Promise<IAdminFeatureModuleListData> {
	const db = await getAccountDatabase();
	return db.transaction().execute(async (trx) => {
		const [definitions, policies] = await Promise.all([
			listFeatureModuleDefinitionsInTransaction(trx, locale),
			listFeatureModulePoliciesInTransaction(trx),
		]);
		const policyMap = new Map(
			policies.map((policy) => [policy.module_key, policy] as const)
		);

		return {
			modules: definitions.map((definition) => {
				const policy = policyMap.get(definition.key);
				return {
					access_level:
						policy?.access_level ?? definition.defaultAccess,
					default_access_level: definition.defaultAccess,
					description: definition.description,
					is_available: definition.isAvailable,
					key: definition.key,
					label: definition.label,
					updated_at: policy?.updated_at ?? null,
				};
			}),
		};
	});
}

export async function updateAdminFeatureModulePolicy({
	adminId,
	body,
	locale = DEFAULT_LOCALE,
	request,
}: {
	adminId: string;
	body: IAdminFeatureModulePolicyUpdateBody;
	locale?: TLocale;
	request: NextRequest;
}): Promise<TFeatureAccessAdminResult<IAdminFeatureModuleListData>> {
	const db = await getAccountDatabase();
	const result = await db.transaction().execute(async (trx) => {
		const definition = await resolveFeatureModuleDefinitionInTransaction(
			trx,
			body.module_key
		);
		if (definition === null) {
			return {
				error: 'feature-access-module-invalid' as const,
				status: 'error' as const,
			};
		}
		const policies = await listFeatureModulePoliciesInTransaction(trx);
		const previousAccessLevel =
			policies.find((policy) => policy.module_key === body.module_key)
				?.access_level ?? definition.defaultAccess;
		const now = Date.now();
		await upsertFeatureModulePolicyInTransaction(trx, {
			accessLevel: body.access_level,
			moduleKey: body.module_key,
			now,
			updatedByAdmin: adminId,
		});
		await writeAccountAuditLogInTransaction(
			trx,
			createAdminAuditInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.adminFeaturePolicyUpdated,
				adminId,
				metadata: {
					access_level: body.access_level,
					module_key: body.module_key,
					previous_access_level: previousAccessLevel,
				},
				request,
				targetId: body.module_key,
				targetType: 'feature_module',
			}),
			now
		);
		return { status: 'ok' as const };
	});
	if (result.status === 'error') {
		return result;
	}

	return { data: await listAdminFeatureModules(locale), status: 'ok' };
}

export async function listAdminFeatureGroups(): Promise<IAdminFeatureAccessGroupListData> {
	const db = await getAccountDatabase();
	return db
		.transaction()
		.execute(async (trx) => ({
			groups: await listFeatureAccessGroupSummariesInTransaction(trx),
		}));
}

export async function getAdminFeatureGroup(
	id: string
): Promise<TFeatureAccessAdminResult<IAdminFeatureAccessGroupDetailData>> {
	const db = await getAccountDatabase();
	return db.transaction().execute(async (trx) => {
		const group = await readGroupRecord(trx, id);
		if (group === null) {
			return {
				error: 'feature-access-group-not-found' as const,
				status: 'error' as const,
			};
		}
		const [moduleKeys, memberIds] = await Promise.all([
			listFeatureAccessGroupModulesInTransaction(trx, id),
			listFeatureAccessGroupMemberIdsInTransaction(trx, id),
		]);
		const members = await readUsersInTransaction(trx, memberIds);
		return {
			data: {
				group,
				members: members.map(createAccountUserProfile),
				module_keys: moduleKeys,
			},
			status: 'ok' as const,
		};
	});
}

export async function createAdminFeatureGroup({
	adminId,
	body,
	request,
}: {
	adminId: string;
	body: IAdminFeatureAccessGroupBody;
	request: NextRequest;
}): Promise<TFeatureAccessAdminResult<{ id: string }>> {
	if (!checkGroupInput(body)) {
		return { error: 'feature-access-group-invalid', status: 'error' };
	}

	const db = await getAccountDatabase();
	try {
		return await db.transaction().execute(async (trx) => {
			if (!(await checkModuleKeysInTransaction(trx, body.module_keys))) {
				return {
					error: 'feature-access-module-invalid' as const,
					status: 'error' as const,
				};
			}
			const userIds = body.user_ids;
			const existingUserIds = await listExistingUserIdsInTransaction(
				trx,
				userIds
			);
			if (existingUserIds.length !== userIds.length) {
				return {
					error: 'feature-access-user-invalid' as const,
					status: 'error' as const,
				};
			}
			if (
				(await findFeatureAccessGroupByNameNormalizedInTransaction(
					trx,
					body.name
				)) !== undefined
			) {
				return {
					error: 'feature-access-group-name-conflict' as const,
					status: 'error' as const,
				};
			}

			const now = Date.now();
			const group = await upsertFeatureAccessGroupInTransaction(trx, {
				createdByAdmin: adminId,
				description: body.description,
				name: body.name,
				now,
			});
			await replaceFeatureAccessGroupModulesInTransaction(
				trx,
				group.id,
				body.module_keys
			);
			await replaceFeatureAccessGroupMembersInTransaction(
				trx,
				group.id,
				userIds,
				adminId,
				now
			);
			await writeAccountAuditLogInTransaction(
				trx,
				createAdminAuditInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupCreated,
					adminId,
					metadata: {
						group_id: group.id,
						member_count: userIds.length,
						module_keys: body.module_keys,
					},
					request,
					targetId: group.id,
					targetType: 'feature_access_group',
				}),
				now
			);
			return { data: { id: group.id }, status: 'ok' as const };
		});
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return {
				error: 'feature-access-group-name-conflict' as const,
				status: 'error' as const,
			};
		}
		throw error;
	}
}

export async function updateAdminFeatureGroup({
	adminId,
	body,
	id,
	request,
}: {
	adminId: string;
	body: IAdminFeatureAccessGroupBody;
	id: string;
	request: NextRequest;
}): Promise<TFeatureAccessAdminResult<IAdminFeatureAccessGroupDetailData>> {
	if (!checkGroupInput(body)) {
		return { error: 'feature-access-group-invalid', status: 'error' };
	}

	const db = await getAccountDatabase();
	let result:
		{ error: TFeatureAccessAdminError; status: 'error' } | { status: 'ok' };
	try {
		result = await db.transaction().execute(async (trx) => {
			const current = await getFeatureAccessGroupInTransaction(trx, id);
			if (current === undefined) {
				return {
					error: 'feature-access-group-not-found' as const,
					status: 'error' as const,
				};
			}
			if (!(await checkModuleKeysInTransaction(trx, body.module_keys))) {
				return {
					error: 'feature-access-module-invalid' as const,
					status: 'error' as const,
				};
			}
			const userIds = body.user_ids;
			const existingUserIds = await listExistingUserIdsInTransaction(
				trx,
				userIds
			);
			if (existingUserIds.length !== userIds.length) {
				return {
					error: 'feature-access-user-invalid' as const,
					status: 'error' as const,
				};
			}
			const conflictingGroup =
				await findFeatureAccessGroupByNameNormalizedInTransaction(
					trx,
					body.name
				);
			if (conflictingGroup !== undefined && conflictingGroup.id !== id) {
				return {
					error: 'feature-access-group-name-conflict' as const,
					status: 'error' as const,
				};
			}

			const now = Date.now();
			const [previousModuleKeys, previousMemberIds] = await Promise.all([
				listFeatureAccessGroupModulesInTransaction(trx, id),
				listFeatureAccessGroupMemberIdsInTransaction(trx, id),
			]);
			await upsertFeatureAccessGroupInTransaction(trx, {
				createdByAdmin: current.created_by_admin,
				description: body.description,
				id,
				name: body.name,
				now,
			});
			await replaceFeatureAccessGroupModulesInTransaction(
				trx,
				id,
				body.module_keys
			);
			await replaceFeatureAccessGroupMembersInTransaction(
				trx,
				id,
				userIds,
				adminId,
				now
			);
			await writeAccountAuditLogInTransaction(
				trx,
				createAdminAuditInput({
					action: ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupUpdated,
					adminId,
					metadata: {
						group_id: id,
						next: {
							member_ids: userIds,
							module_keys: body.module_keys,
						},
						previous: {
							member_ids: previousMemberIds,
							module_keys: previousModuleKeys,
						},
					},
					request,
					targetId: id,
					targetType: 'feature_access_group',
				}),
				now
			);
			return { status: 'ok' as const };
		});
	} catch (error) {
		if (checkSqlitePrimaryKeyOrUniqueConstraintError(error)) {
			return {
				error: 'feature-access-group-name-conflict' as const,
				status: 'error' as const,
			};
		}
		throw error;
	}
	if (result.status === 'error') {
		return result;
	}

	return getAdminFeatureGroup(id);
}

export async function deleteAdminFeatureGroup({
	adminId,
	id,
	request,
}: {
	adminId: string;
	id: string;
	request: NextRequest;
}): Promise<TFeatureAccessAdminResult<{ id: string }>> {
	const db = await getAccountDatabase();
	return db.transaction().execute(async (trx) => {
		const group = await getFeatureAccessGroupInTransaction(trx, id);
		if (group === undefined) {
			return {
				error: 'feature-access-group-not-found' as const,
				status: 'error' as const,
			};
		}
		if ((await deleteFeatureAccessGroupInTransaction(trx, id)) !== 1) {
			return {
				error: 'feature-access-group-not-found' as const,
				status: 'error' as const,
			};
		}
		const now = Date.now();
		await writeAccountAuditLogInTransaction(
			trx,
			createAdminAuditInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.adminFeatureGroupDeleted,
				adminId,
				metadata: { group_id: id, group_name: group.name },
				request,
				targetId: id,
				targetType: 'feature_access_group',
			}),
			now
		);
		return { data: { id }, status: 'ok' as const };
	});
}

export async function listAdminFeatureAccessUsers(options: IListUsersOptions) {
	const [usersModule, userModule] = await Promise.all([
		import('@/features/account/server/persistence/repositories/users'),
		import('@/features/account/server/presentation/user'),
	]);
	const { totalCount, users } = await usersModule.listUsers(options);
	return {
		page: Math.floor(options.offset / options.limit) + 1,
		page_size: options.limit,
		total_count: totalCount,
		total_pages: Math.ceil(totalCount / options.limit),
		users: users.map(userModule.createAccountUserProfile),
	};
}

export async function getAdminFeatureAccessUser(
	userId: string
): Promise<TFeatureAccessAdminResult<IAdminFeatureAccessUserData>> {
	const db = await getAccountDatabase();
	return db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(TABLE_NAME_MAP.user)
			.selectAll()
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user === undefined) {
			return {
				error: 'feature-access-user-not-found' as const,
				status: 'error' as const,
			};
		}
		const [groups, groupIds, moduleOverrides, effectiveAccess] =
			await Promise.all([
				listFeatureAccessGroupSummariesInTransaction(trx),
				listFeatureAccessGroupMembershipsForUserInTransaction(
					trx,
					userId
				),
				listUserFeatureAccessOverridesInTransaction(trx, userId),
				evaluateFeatureAccessForUserInTransaction(trx, userId),
			]);
		return {
			data: {
				effective_access: effectiveAccess,
				group_ids: groupIds,
				groups,
				module_overrides: moduleOverrides,
				user: createAccountUserProfile(user),
			},
			status: 'ok' as const,
		};
	});
}

function checkUserAccessUpdateBody(body: IAdminFeatureAccessUserUpdateBody) {
	return (
		checkUniqueStringArray(body.group_ids) &&
		Object.values(body.module_overrides).every(
			(effect) => effect === 'allow' || effect === 'deny'
		)
	);
}

export async function updateAdminFeatureAccessUser({
	adminId,
	body,
	request,
	userId,
}: {
	adminId: string;
	body: IAdminFeatureAccessUserUpdateBody;
	request: NextRequest;
	userId: string;
}): Promise<TFeatureAccessAdminResult<IAdminFeatureAccessUserData>> {
	if (!checkUserAccessUpdateBody(body)) {
		return { error: 'feature-access-user-invalid', status: 'error' };
	}
	const overrideEntries = Object.entries(body.module_overrides) as Array<
		[TFeatureModuleKey, TFeatureAccessOverrideEffect]
	>;

	const db = await getAccountDatabase();
	const result = await db.transaction().execute(async (trx) => {
		const user = await trx
			.selectFrom(TABLE_NAME_MAP.user)
			.select(['id', 'status'])
			.where('id', '=', userId)
			.executeTakeFirst();
		if (user === undefined) {
			return {
				error: 'feature-access-user-not-found' as const,
				status: 'error' as const,
			};
		}
		if (user.status === 'deleted') {
			return {
				error: 'feature-access-user-invalid' as const,
				status: 'error' as const,
			};
		}
		const existingGroupIds =
			await listExistingFeatureAccessGroupIdsInTransaction(
				trx,
				body.group_ids
			);
		if (existingGroupIds.length !== body.group_ids.length) {
			return {
				error: 'feature-access-group-not-found' as const,
				status: 'error' as const,
			};
		}
		if (
			!(await checkModuleKeysInTransaction(
				trx,
				overrideEntries.map(([moduleKey]) => moduleKey)
			))
		) {
			return {
				error: 'feature-access-module-invalid' as const,
				status: 'error' as const,
			};
		}

		const now = Date.now();
		const [previousGroupIds, previousOverrides] = await Promise.all([
			listFeatureAccessGroupMembershipsForUserInTransaction(trx, userId),
			listUserFeatureAccessOverridesInTransaction(trx, userId),
		]);
		await replaceFeatureAccessGroupMembershipsForUserInTransaction(
			trx,
			userId,
			body.group_ids,
			adminId,
			now
		);
		await replaceUserFeatureAccessOverridesInTransaction(
			trx,
			userId,
			overrideEntries.map(([moduleKey, effect]) => ({
				createdByAdmin: adminId,
				effect,
				moduleKey,
				now,
				updatedByAdmin: adminId,
			}))
		);
		await writeAccountAuditLogInTransaction(
			trx,
			createAdminAuditInput({
				action: ACCOUNT_AUDIT_ACTION_MAP.adminUserFeatureAccessUpdated,
				adminId,
				metadata: {
					next: {
						group_ids: body.group_ids,
						module_overrides: body.module_overrides,
					},
					previous: {
						group_ids: previousGroupIds,
						module_overrides: previousOverrides,
					},
					user_id: userId,
				},
				request,
				targetId: userId,
				targetType: 'user',
			}),
			now
		);
		return { status: 'ok' as const };
	});
	if (result.status === 'error') {
		return result;
	}

	return getAdminFeatureAccessUser(userId);
}

export function checkAdminFeatureAccessLevel(
	value: unknown
): value is TFeatureAccessLevel {
	return ['authenticated', 'granted', 'public'].includes(value as string);
}

export function checkAdminFeatureModuleKey(
	value: unknown
): value is TFeatureModuleKey {
	return typeof value === 'string' && value.length > 0;
}

export function checkAdminFeatureGroupBody(
	value: unknown
): value is IAdminFeatureAccessGroupBody {
	if (value === null || typeof value !== 'object') {
		return false;
	}
	const body = value as Record<string, unknown>;
	return (
		typeof body['name'] === 'string' &&
		typeof body['description'] === 'string' &&
		Array.isArray(body['module_keys']) &&
		body['module_keys'].every(
			(moduleKey) => typeof moduleKey === 'string'
		) &&
		Array.isArray(body['user_ids']) &&
		body['user_ids'].every((userId) => typeof userId === 'string')
	);
}

export function checkAdminFeatureUserUpdateBody(
	value: unknown
): value is IAdminFeatureAccessUserUpdateBody {
	if (value === null || typeof value !== 'object') {
		return false;
	}
	const body = value as Record<string, unknown>;
	const overrides = body['module_overrides'];
	return (
		Array.isArray(body['group_ids']) &&
		body['group_ids'].every((groupId) => typeof groupId === 'string') &&
		overrides !== null &&
		typeof overrides === 'object' &&
		!Array.isArray(overrides) &&
		Object.values(overrides).every(
			(effect) => effect === 'allow' || effect === 'deny'
		)
	);
}
