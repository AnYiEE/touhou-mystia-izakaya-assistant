import type { IAccountUserProfile } from '@/features/account/contracts';

import { type TAccountMessageKey } from './messages';
import { type TAccountBootstrapStatus } from './state/accountStore';

export const ACCOUNT_CLIENT_MESSAGE_KEYS = {
	accountStateRefreshFailed: 'account.client.accountStateRefreshFailed',
	logoutFailed: 'account.client.logoutFailed',
	operationBusy: 'account.client.operationBusy',
	passwordChangeFailed: 'account.client.passwordChangeFailed',
	passwordMustChangeAccountPaused:
		'account.client.passwordMustChangeAccountPaused',
	passwordMustChangeAuthorizePaused:
		'account.client.passwordMustChangeAuthorizePaused',
	passwordMustChangeLogoutAccount:
		'account.client.passwordMustChangeLogoutAccount',
	passwordMustChangeLogoutAuthorize:
		'account.client.passwordMustChangeLogoutAuthorize',
} as const satisfies Record<string, TAccountMessageKey>;

const ACCOUNT_ACTION_STATUS_LABEL_KEYS = {
	signedOut: 'account.action.signedOut',
	unavailable: 'account.action.unavailable',
	welcome: 'account.action.welcome',
} as const satisfies Record<string, TAccountMessageKey>;

export function getAccountActionLabel(
	bootstrapStatus: TAccountBootstrapStatus,
	user: IAccountUserProfile | null,
	t: (key: TAccountMessageKey) => string
) {
	if (bootstrapStatus === 'error') {
		return t(ACCOUNT_ACTION_STATUS_LABEL_KEYS.unavailable);
	}
	if (bootstrapStatus === 'unknown') {
		return t(ACCOUNT_ACTION_STATUS_LABEL_KEYS.welcome);
	}
	if (user === null) {
		return t(ACCOUNT_ACTION_STATUS_LABEL_KEYS.signedOut);
	}
	return user.nickname ?? user.username;
}

export const LEGACY_BACKUP_IMPORT_MESSAGE_KEYS = {
	failed: 'account.legacyImport.failed',
	success: 'account.legacyImport.success',
} as const satisfies Record<string, TAccountMessageKey>;
