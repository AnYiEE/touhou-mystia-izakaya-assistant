export const USER_STATUS_MAP = {
	active: 'active',
	deleted: 'deleted',
	disabled: 'disabled',
} as const;

export const ACCOUNT_COOKIE_NAME_MAP = {
	adminSession: 'mystia-admin-session',
	session: 'mystia-session',
	ssoContext: 'mystia-sso-context',
	webauthnChallenge: 'mystia-webauthn',
} as const;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_RULE_DESCRIPTION = `用户名${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH}位，可使用中文、英文字母、数字、下划线、点、短横线和邮箱形式`;

const USERNAME_REGEXP = /^[\p{Script=Han}A-Za-z0-9_.@-]+$/u;
const USERNAME_SEPARATOR_REGEXP = /(^[.@-]|[.@-]$|[.-]{2,}|[.-]@|@[.-])/u;

export function checkUsernamePolicy(username: string) {
	const trimmedUsername = username.trim();

	return (
		trimmedUsername.length >= USERNAME_MIN_LENGTH &&
		trimmedUsername.length <= USERNAME_MAX_LENGTH &&
		USERNAME_REGEXP.test(trimmedUsername) &&
		(trimmedUsername.match(/@/gu)?.length ?? 0) <= 1 &&
		!USERNAME_SEPARATOR_REGEXP.test(trimmedUsername)
	);
}

export const SSO_CALLBACK_EVENT_LIST = [
	'client_deleted',
	'client_disabled',
	'grant_revoked',
	'secret_rotated',
	'user_deleted',
	'user_disabled',
	'user_profile_updated',
] as const;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_RULE_DESCRIPTION = `密码长度${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH}位，且至少包含一个非空白字符`;

export const NICKNAME_MAX_LENGTH = 32;
export const NICKNAME_RULE_DESCRIPTION = `昵称最多${NICKNAME_MAX_LENGTH}个字符，不能包含换行或控制字符`;

function hasControlCharacter(value: string) {
	for (let index = 0; index < value.length; index++) {
		const codePoint = value.codePointAt(index);
		if (
			codePoint !== undefined &&
			((codePoint >= 0 && codePoint <= 0x1f) || codePoint === 0x7f)
		) {
			return true;
		}
	}

	return false;
}

export function normalizeNickname(value: string) {
	const trimmedValue = value.trim();

	return trimmedValue === '' ? null : trimmedValue;
}

export function checkNicknamePolicy(value: string | null) {
	return (
		value === null ||
		(value.length <= NICKNAME_MAX_LENGTH && !hasControlCharacter(value))
	);
}

export function checkPasswordLengthPolicy(password: string) {
	return (
		password.length >= PASSWORD_MIN_LENGTH &&
		password.length <= PASSWORD_MAX_LENGTH
	);
}

export function checkPasswordPolicy(password: string) {
	return checkPasswordLengthPolicy(password) && /\S/u.test(password);
}

export const WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const WEBAUTHN_MAX_CREDENTIALS_PER_USER = 20;
export const WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH = 50;
export const WEBAUTHN_CREDENTIAL_NAME_RULE_DESCRIPTION = `通行密钥名称最多${WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH}个字符，不能包含换行或控制字符`;

export function normalizeWebauthnCredentialName(value: string) {
	const trimmedValue = value.trim();

	return trimmedValue === '' ? null : trimmedValue;
}

export function checkWebauthnCredentialNamePolicy(value: string | null) {
	return (
		value === null ||
		(value.length <= WEBAUTHN_CREDENTIAL_NAME_MAX_LENGTH &&
			!hasControlCharacter(value))
	);
}
