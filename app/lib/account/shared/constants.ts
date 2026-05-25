export const USER_STATUS_MAP = {
	active: 'active',
	deleted: 'deleted',
	disabled: 'disabled',
} as const;

export const ACCOUNT_COOKIE_NAME_MAP = {
	adminSession: 'mystia-admin-session',
	session: 'mystia-session',
} as const;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
