import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '@/features/account/constants';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';

import {
	ACCOUNT_ERROR_MESSAGE_KEY_SET,
	type TAccountErrorMessageKey,
	accountErrorMessages,
} from './errorMessages';
import {
	ACCOUNT_MESSAGE_KEY_SET,
	type TAccountMessageKey,
	accountMessages,
} from './messages';

const ACCOUNT_CLIENT_ERROR_MESSAGE_KEYS: Readonly<
	Record<string, TAccountErrorMessageKey>
> = {
	'account-disabled-offline': 'account.error.account-disabled-offline',
	'account-sync-pause-incomplete':
		'account.error.account-sync-pause-incomplete',
	'account-sync-reset-incomplete':
		'account.error.account-sync-reset-incomplete',
	'backup-code-already-imported':
		'account.error.backup-code-already-imported',
	'backup-code-lock-lost': 'account.error.backup-code-lock-lost',
	'backup-code-lock-timeout': 'account.error.backup-code-lock-timeout',
	'backup-code-not-found': 'account.error.backup-code-not-found',
	'bootstrap-failed': 'account.error.bootstrap-failed',
	'cannot-revoke-current-session':
		'account.error.cannot-revoke-current-session',
	'challenge-expired': 'account.error.challenge-expired',
	'challenge-not-found': 'account.error.challenge-not-found',
	conflict: 'account.error.conflict',
	'conflict-storage-unavailable':
		'account.error.conflict-storage-unavailable',
	'credential-changed': 'account.error.credential-changed',
	'credential-state-stale': 'account.error.credential-state-stale',
	forbidden: 'account.error.forbidden',
	'invalid-api-response': 'account.error.invalid-api-response',
	'invalid-backup-code': 'account.error.invalid-backup-code',
	'invalid-backup-file': 'account.error.invalid-backup-file',
	'invalid-credentials': 'account.error.invalid-credentials',
	'invalid-nickname': 'account.error.invalid-nickname',
	'invalid-object-structure': 'account.error.invalid-object-structure',
	'invalid-passkey-name': 'account.error.invalid-passkey-name',
	'invalid-password': 'account.error.invalid-password',
	'invalid-user-status': 'account.error.invalid-user-status',
	'invalid-username': 'account.error.invalid-username',
	'legacy-backup-disabled-offline':
		'account.error.legacy-backup-disabled-offline',
	'legacy-import-failed': 'account.error.legacy-import-failed',
	'legacy-import-local-takeover-failed':
		'account.error.legacy-import-local-takeover-failed',
	'legacy-import-sync-pending': 'account.error.legacy-import-sync-pending',
	'local-takeover-failed': 'account.error.local-takeover-failed',
	'passkey-not-found': 'account.error.passkey-not-found',
	'password-already-set': 'account.error.password-already-set',
	'password-must-change': 'account.error.password-must-change',
	'password-not-set': 'account.error.password-not-set',
	'payload-too-large': 'account.error.payload-too-large',
	'quarantine-storage-failed': 'account.error.quarantine-storage-failed',
	'remote-conflict-source-unavailable':
		'account.error.remote-conflict-source-unavailable',
	'server-misconfigured': 'account.error.server-misconfigured',
	'session-not-found': 'account.error.session-not-found',
	'session-revoked': 'account.error.session-revoked',
	'state-epoch-mismatch': 'account.error.state-epoch-mismatch',
	'sync-account-capacity-exceeded':
		'account.error.sync-account-capacity-exceeded',
	'sync-account-restore-incomplete':
		'account.error.sync-account-restore-incomplete',
	'sync-client-update-required': 'account.error.sync-client-update-required',
	'sync-conflict': 'account.error.sync-conflict',
	'sync-failed': 'account.error.sync-failed',
	'sync-generation-mismatch': 'account.error.sync-generation-mismatch',
	'sync-paused': 'account.error.sync-paused',
	'sync-rebuild-conflict': 'account.error.sync-rebuild-conflict',
	'sync-rebuild-failed': 'account.error.sync-rebuild-failed',
	'sync-refresh-failed': 'account.error.sync-refresh-failed',
	'sync-request-too-large': 'account.error.sync-request-too-large',
	'sync-reset-marker-future': 'account.error.sync-reset-marker-future',
	'sync-reset-marker-invalid': 'account.error.sync-reset-marker-invalid',
	'sync-schema-update-required': 'account.error.sync-schema-update-required',
	'too-many-passkeys': 'account.error.too-many-passkeys',
	'too-many-requests': 'account.error.too-many-requests',
	unauthorized: 'account.error.unauthorized',
	'user-deleted': 'account.error.user-deleted',
	'user-disabled': 'account.error.user-disabled',
	'username-conflict': 'account.error.username-conflict',
	'webauthn-canceled': 'account.error.webauthn-canceled',
	'webauthn-failed': 'account.error.webauthn-failed',
	'webauthn-timeout': 'account.error.webauthn-timeout',
	'webauthn-verification-failed':
		'account.error.webauthn-verification-failed',
};

const LEGACY_BACKUP_IMPORT_ERROR_CODES = new Set<string>([
	'backup-code-lock-lost',
	'backup-code-lock-timeout',
	'backup-code-already-imported',
	'backup-code-not-found',
	'invalid-backup-code',
	'invalid-backup-file',
	'legacy-import-failed',
	'legacy-import-local-takeover-failed',
	'legacy-import-sync-pending',
	'sync-account-capacity-exceeded',
	'sync-conflict',
]);

const USER_FACING_MESSAGE_REGEXP = /[\u4E00-\u9FFF]/u;

export function isLegacyBackupImportErrorMessage(message: string) {
	return LEGACY_BACKUP_IMPORT_ERROR_CODES.has(message);
}

/**
 * @description Resolves an account API/flow message code to localized copy.
 * Unknown messages that already carry user-facing text (legacy server strings
 * contain Chinese) pass through unchanged; anything else uses the fallback.
 */
export function getAccountClientErrorMessage(
	message: string,
	locale: TLocale,
	fallback?: string
) {
	if (message === 'invalid-password-rule') {
		return translate(accountMessages, locale, 'account.passwordRule', {
			max: PASSWORD_MAX_LENGTH,
			min: PASSWORD_MIN_LENGTH,
		});
	}

	if (ACCOUNT_MESSAGE_KEY_SET.has(message)) {
		return translate(
			accountMessages,
			locale,
			message as TAccountMessageKey
		);
	}
	if (ACCOUNT_ERROR_MESSAGE_KEY_SET.has(message)) {
		return translate(
			accountErrorMessages,
			locale,
			message as TAccountErrorMessageKey
		);
	}

	const key = ACCOUNT_CLIENT_ERROR_MESSAGE_KEYS[message];
	if (key !== undefined) {
		return translate(accountErrorMessages, locale, key);
	}

	return USER_FACING_MESSAGE_REGEXP.test(message)
		? message
		: (fallback ??
				translate(
					accountErrorMessages,
					locale,
					'account.error.fallback'
				));
}
