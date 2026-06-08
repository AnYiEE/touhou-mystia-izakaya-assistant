export const USER_STATUS_MAP = {
	active: 'active',
	deleted: 'deleted',
	disabled: 'disabled',
} as const;

export const ACCOUNT_COOKIE_NAME_MAP = {
	adminSession: 'mystia-admin-session',
	session: 'mystia-session',
} as const;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_RULE_DESCRIPTION = `用户名${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH}位，可使用中文、英文字母、数字、下划线、点和短横线`;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_RULE_DESCRIPTION = `密码长度${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位，且至少包含一个非空白字符`;

export function checkPasswordLengthPolicy(password: string) {
	return (
		password.length >= PASSWORD_MIN_LENGTH &&
		password.length <= PASSWORD_MAX_LENGTH
	);
}

export function checkPasswordPolicy(password: string) {
	return checkPasswordLengthPolicy(password) && /\S/u.test(password);
}
