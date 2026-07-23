export const SYNC_NAMESPACE_MAP = {
	customerNormalMeals: 'customer_normal.meals',
	customerRareMeals: 'customer_rare.meals',
	customerRarePlans: 'customer_rare.plans',
	customerRareSettings: 'customer_rare.settings',
	globalPreferences: 'global.preferences',
	theme: 'theme',
	tutorialCustomerRare: 'tutorial.customer_rare',
} as const;

export type TSyncNamespace =
	(typeof SYNC_NAMESPACE_MAP)[keyof typeof SYNC_NAMESPACE_MAP];

export const ACCOUNT_SYNC_OPERATION_KIND_MAP = {
	deleteData: 'delete-data',
	importBackup: 'import-backup',
	rebuildCloud: 'rebuild-cloud',
} as const;

export const SYNC_SCHEMA_VERSION_MAP = {
	[SYNC_NAMESPACE_MAP.customerNormalMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRareMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRarePlans]: 3,
	[SYNC_NAMESPACE_MAP.customerRareSettings]: 1,
	[SYNC_NAMESPACE_MAP.globalPreferences]: 1,
	[SYNC_NAMESPACE_MAP.theme]: 1,
	[SYNC_NAMESPACE_MAP.tutorialCustomerRare]: 1,
} as const satisfies Record<TSyncNamespace, number>;

export const SYNC_MIN_SCHEMA_VERSION_MAP = {
	[SYNC_NAMESPACE_MAP.customerNormalMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRareMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRarePlans]: 1,
	[SYNC_NAMESPACE_MAP.customerRareSettings]: 1,
	[SYNC_NAMESPACE_MAP.globalPreferences]: 1,
	[SYNC_NAMESPACE_MAP.theme]: 1,
	[SYNC_NAMESPACE_MAP.tutorialCustomerRare]: 1,
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
