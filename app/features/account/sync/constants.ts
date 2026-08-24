import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

export const ACCOUNT_SYNC_OPERATION_KIND_MAP = {
	deleteData: 'delete-data',
	importBackup: 'import-backup',
	rebuildCloud: 'rebuild-cloud',
} as const;

export const SYNC_SCHEMA_VERSION_MAP = {
	[SYNC_NAMESPACE_MAP.normalGuestMeals]: 3,
	[SYNC_NAMESPACE_MAP.specialGuestMeals]: 3,
	[SYNC_NAMESPACE_MAP.specialGuestPlans]: 4,
	[SYNC_NAMESPACE_MAP.specialGuestSettings]: 1,
	[SYNC_NAMESPACE_MAP.globalPreferences]: 3,
	[SYNC_NAMESPACE_MAP.theme]: 2,
	[SYNC_NAMESPACE_MAP.tutorialSpecialGuest]: 1,
} as const satisfies Record<TSyncNamespace, number>;

export const SYNC_MIN_SCHEMA_VERSION_MAP = {
	[SYNC_NAMESPACE_MAP.normalGuestMeals]: 1,
	[SYNC_NAMESPACE_MAP.specialGuestMeals]: 1,
	[SYNC_NAMESPACE_MAP.specialGuestPlans]: 1,
	[SYNC_NAMESPACE_MAP.specialGuestSettings]: 1,
	[SYNC_NAMESPACE_MAP.globalPreferences]: 1,
	[SYNC_NAMESPACE_MAP.theme]: 1,
	[SYNC_NAMESPACE_MAP.tutorialSpecialGuest]: 1,
} as const satisfies Record<TSyncNamespace, number>;

export function checkSupportedSyncSchemaVersion(
	namespace: TSyncNamespace,
	version: unknown
): version is number {
	return (
		typeof version === 'number' &&
		Number.isSafeInteger(version) &&
		version >= SYNC_MIN_SCHEMA_VERSION_MAP[namespace] &&
		version <= SYNC_SCHEMA_VERSION_MAP[namespace]
	);
}
