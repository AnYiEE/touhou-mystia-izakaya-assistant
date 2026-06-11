export const SYNC_NAMESPACE_MAP = {
	customerNormalMeals: 'customer_normal.meals',
	customerRareMeals: 'customer_rare.meals',
	customerRareSettings: 'customer_rare.settings',
	globalPreferences: 'global.preferences',
	theme: 'theme',
	tutorialCustomerRare: 'tutorial.customer_rare',
} as const;

export type TSyncNamespace =
	(typeof SYNC_NAMESPACE_MAP)[keyof typeof SYNC_NAMESPACE_MAP];

export const SYNC_SCHEMA_VERSION_MAP = {
	[SYNC_NAMESPACE_MAP.customerNormalMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRareMeals]: 1,
	[SYNC_NAMESPACE_MAP.customerRareSettings]: 1,
	[SYNC_NAMESPACE_MAP.globalPreferences]: 1,
	[SYNC_NAMESPACE_MAP.theme]: 1,
	[SYNC_NAMESPACE_MAP.tutorialCustomerRare]: 1,
} as const satisfies Record<TSyncNamespace, number>;
