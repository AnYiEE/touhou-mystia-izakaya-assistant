export const USER_STATUS_MAP = {
	active: 'active',
	deleted: 'deleted',
	disabled: 'disabled',
} as const;

export type TUserStatus =
	(typeof USER_STATUS_MAP)[keyof typeof USER_STATUS_MAP];

export const ACCOUNT_SYNC_STATUS_MAP = {
	active: 'active',
	pausedEmpty: 'paused_empty',
} as const;

export type TAccountSyncStatus =
	(typeof ACCOUNT_SYNC_STATUS_MAP)[keyof typeof ACCOUNT_SYNC_STATUS_MAP];

export function checkAccountSyncStatus(
	value: unknown
): value is TAccountSyncStatus {
	return Object.values(ACCOUNT_SYNC_STATUS_MAP).includes(
		value as TAccountSyncStatus
	);
}

export const SYNC_NAMESPACE_MAP = {
	normalGuestMeals: 'customer_normal.meals',
	specialGuestMeals: 'customer_rare.meals',
	specialGuestPlans: 'customer_rare.plans',
	specialGuestSettings: 'customer_rare.settings',
	// eslint-disable-next-line sort-keys -- Preserve sync processing and status display enumeration order.
	globalPreferences: 'global.preferences',
	theme: 'theme',
	tutorialSpecialGuest: 'tutorial.customer_rare',
} as const;

export type TSyncNamespace =
	(typeof SYNC_NAMESPACE_MAP)[keyof typeof SYNC_NAMESPACE_MAP];

export const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);

export const SSO_CALLBACK_EVENT_LIST = [
	'client_deleted',
	'client_disabled',
	'grant_revoked',
	'secret_rotated',
	'user_deleted',
	'user_disabled',
	'user_profile_updated',
] as const;

export type TAccountSsoCallbackEvent = (typeof SSO_CALLBACK_EVENT_LIST)[number];

export type TSsoGrantEvent =
	| 'admin_revoked'
	| 'client_deleted'
	| 'grant_created'
	| 'grant_refreshed'
	| 'user_revoked';

export type TSsoActorType = 'admin' | 'client' | 'system' | 'user';

export type TSsoCallbackDeliveryStatus =
	| 'failed'
	| 'final_failed'
	| 'succeeded';
