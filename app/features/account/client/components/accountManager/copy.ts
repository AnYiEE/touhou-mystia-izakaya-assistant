import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	type TAccountMessageKey,
	type TAccountTranslate,
} from '@/features/account/client/messages';

export const ACCOUNT_MANAGER_MESSAGE_KEYS = {
	accountDeleteFailed: 'account.manager.accountDeleteFailed',
	authenticationCredentialsRequired:
		'account.manager.authenticationCredentialsRequired',
	authenticationFailed: 'account.manager.authenticationFailed',
	cloudDataChangedReconfirm: 'account.manager.cloudDataChangedReconfirm',
	cloudDataChangedRefreshing: 'account.manager.cloudDataChangedRefreshing',
	cloudDataCleared: 'account.manager.cloudDataCleared',
	cloudDataClearFailed: 'account.manager.cloudDataClearFailed',
	loginSuccess: 'account.manager.loginSuccess',
	logoutSyncFailed: 'account.manager.logoutSyncFailed',
	passkeyAdded: 'account.manager.passkeyAdded',
	passkeyAddFailed: 'account.manager.passkeyAddFailed',
	passkeyDeleted: 'account.manager.passkeyDeleted',
	passkeyDeleteFailed: 'account.manager.passkeyDeleteFailed',
	passkeyRefreshFailed: 'account.manager.passkeyRefreshFailed',
	passkeyRenamed: 'account.manager.passkeyRenamed',
	passkeyRenameFailed: 'account.manager.passkeyRenameFailed',
	passwordSet: 'account.manager.passwordSet',
	passwordUpdated: 'account.manager.passwordUpdated',
	profileUpdated: 'account.manager.profileUpdated',
	profileUpdateFailed: 'account.manager.profileUpdateFailed',
	registrationFailed: 'account.manager.registrationFailed',
	registrationSuccess: 'account.manager.registrationSuccess',
	sessionRefreshFailed: 'account.manager.sessionRefreshFailed',
	sessionRevoked: 'account.manager.sessionRevoked',
	sessionRevokeFailed: 'account.manager.sessionRevokeFailed',
	ssoGrantRefreshFailed: 'account.manager.ssoGrantRefreshFailed',
	ssoGrantRevoked: 'account.manager.ssoGrantRevoked',
	ssoGrantRevokeFailed: 'account.manager.ssoGrantRevokeFailed',
	syncPendingBeforeLogout: 'account.manager.syncPendingBeforeLogout',
	termsRequired: 'account.manager.termsRequired',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_MANAGER_SUCCESS_MESSAGE_KEY_SET = new Set<string>([
	ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataCleared,
	ACCOUNT_MANAGER_MESSAGE_KEYS.loginSuccess,
	ACCOUNT_MANAGER_MESSAGE_KEYS.passkeyAdded,
	ACCOUNT_MANAGER_MESSAGE_KEYS.passkeyDeleted,
	ACCOUNT_MANAGER_MESSAGE_KEYS.passkeyRenamed,
	ACCOUNT_MANAGER_MESSAGE_KEYS.passwordSet,
	ACCOUNT_MANAGER_MESSAGE_KEYS.passwordUpdated,
	ACCOUNT_MANAGER_MESSAGE_KEYS.profileUpdated,
	ACCOUNT_MANAGER_MESSAGE_KEYS.registrationSuccess,
	ACCOUNT_MANAGER_MESSAGE_KEYS.sessionRevoked,
	ACCOUNT_MANAGER_MESSAGE_KEYS.ssoGrantRevoked,
]);

const ACCOUNT_LOGIN_SUPPORT_LINK_KEY: TAccountMessageKey =
	'account.manager.loginSupportLink';

const ACCOUNT_LOGIN_SUPPORT_MESSAGE_PREFIX_KEY_MAP = new Map<
	string,
	TAccountMessageKey
>([
	[
		ACCOUNT_API_RESPONSE_CODE_MAP.invalidCredentials,
		'account.manager.loginSupport.invalidCredentials',
	],
	[
		ACCOUNT_API_RESPONSE_CODE_MAP.userDeleted,
		'account.manager.loginSupport.userDeleted',
	],
	[
		ACCOUNT_API_RESPONSE_CODE_MAP.userDisabled,
		'account.manager.loginSupport.userDisabled',
	],
]);

export interface IAccountLoginSupportMessage {
	messagePrefix: string;
	supportLinkLabel: string;
}

export function checkAccountLoginCredentialError(message: string | null) {
	return (
		message !== null &&
		ACCOUNT_LOGIN_SUPPORT_MESSAGE_PREFIX_KEY_MAP.has(message)
	);
}

export function getAccountLoginSupportMessage(
	message: string | null,
	t: TAccountTranslate
): IAccountLoginSupportMessage | null {
	const messagePrefixKey =
		message === null
			? undefined
			: ACCOUNT_LOGIN_SUPPORT_MESSAGE_PREFIX_KEY_MAP.get(message);
	return messagePrefixKey === undefined
		? null
		: {
				messagePrefix: t(messagePrefixKey),
				supportLinkLabel: t(ACCOUNT_LOGIN_SUPPORT_LINK_KEY),
			};
}

export const ACCOUNT_MANAGER_STATUS_LABEL_KEYS = {
	awaitingSystemVerification:
		'account.manager.status.awaitingSystemVerification',
	connected: 'account.manager.status.connected',
	noPasskeys: 'account.manager.status.noPasskeys',
	noSessions: 'account.manager.status.noSessions',
	noSsoGrants: 'account.manager.status.noSsoGrants',
	passkeyPrompt: 'account.manager.status.passkeyPrompt',
	passkeysUnsupported: 'account.manager.status.passkeysUnsupported',
	paused: 'account.manager.status.paused',
	readingPasskeys: 'account.manager.status.readingPasskeys',
	readingSessions: 'account.manager.status.readingSessions',
	readingSsoGrants: 'account.manager.status.readingSsoGrants',
} as const satisfies Record<string, TAccountMessageKey>;

const ACCOUNT_BOOTSTRAP_ERROR_MESSAGE_KEYS: Readonly<
	Record<string, TAccountMessageKey>
> = {
	'bootstrap-failed': 'account.manager.bootstrapFailed',
	'server-misconfigured': 'account.manager.bootstrapServerMisconfigured',
};

export function getAccountBootstrapErrorMessage(
	errorCode: string | null,
	t: TAccountTranslate
) {
	if (errorCode === null) {
		return t('account.manager.bootstrapUnavailable', {
			message: t('account.manager.bootstrapServerMisconfigured'),
		});
	}

	const messageKey = ACCOUNT_BOOTSTRAP_ERROR_MESSAGE_KEYS[errorCode];
	return t('account.manager.bootstrapUnavailable', {
		message: messageKey === undefined ? errorCode : t(messageKey),
	});
}
