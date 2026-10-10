import { type TAccountMessageKey } from '@/features/account/client/messages';
import { type TAccountSyncConflictResolutionReadiness } from '@/features/account/client/state/accountStore';

import { type TAccountSyncConflictResolutionResultStatus } from './conflict';

export const ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS = {
	busy: 'account.sync.conflict.busy',
	recovering: 'account.sync.conflict.recovering',
	stale: 'account.sync.conflict.stale',
	storageUnavailable: 'account.sync.conflict.storageUnavailable',
	unexpected: 'account.sync.conflict.unexpected',
	unsupported: 'account.sync.conflict.unsupported',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_CONFLICT_READINESS_MESSAGE_KEYS = {
	busy: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.busy,
	ready: null,
	recovering: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.recovering,
	stale: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.stale,
	'storage-unavailable':
		ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.storageUnavailable,
	unsupported: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.unsupported,
} as const satisfies Record<
	TAccountSyncConflictResolutionReadiness,
	null | TAccountMessageKey
>;

const ACCOUNT_SYNC_CONFLICT_READINESS_LABEL_KEYS = {
	busy: 'account.sync.readiness.busy',
	ready: 'account.sync.readiness.ready',
	recovering: 'account.sync.readiness.recovering',
	stale: 'account.sync.readiness.stale',
	'storage-unavailable': 'account.sync.readiness.storageUnavailable',
	unsupported: 'account.sync.readiness.unsupported',
} as const satisfies Record<
	TAccountSyncConflictResolutionReadiness,
	TAccountMessageKey
>;

export const ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS = {
	automaticResolution: 'account.sync.namespace.automaticResolution',
	automaticResolutionPaused:
		'account.sync.namespace.automaticResolutionPaused',
	conflict: 'account.sync.namespace.conflict',
	dirty: 'account.sync.namespace.dirty',
	synced: 'account.sync.namespace.synced',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_STATUS_FALLBACK_MESSAGE_KEYS = {
	rebuildFailed: 'account.sync.fallback.rebuildFailed',
	syncFailed: 'account.sync.fallback.syncFailed',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_STATUS_MESSAGE_KEYS = {
	noPendingData: 'account.sync.status.noPendingData',
	noSuccessfulRecord: 'account.sync.status.noSuccessfulRecord',
	paused: 'account.sync.status.paused',
	pausedEmptyDescription: 'account.sync.status.pausedEmptyDescription',
	sessionQueueFallback: 'account.sync.status.sessionQueueFallback',
	sessionQueueWarning: 'account.sync.status.sessionQueueWarning',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_STORAGE_MODE_LABEL_KEYS = {
	local: 'account.sync.storage.local',
	memory: 'account.sync.storage.memory',
	session: 'account.sync.storage.session',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_PAUSED_REASON_LABEL_KEYS = {
	'applying-remote': 'account.sync.pausedReason.applyingRemote',
	bootstrap: 'account.sync.pausedReason.bootstrap',
	'cloud-paused': 'account.sync.pausedReason.cloudPaused',
	conflict: ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS.conflict,
	'delete-data': 'account.sync.pausedReason.deleteData',
	'importing-backup': 'account.sync.pausedReason.importingBackup',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_FAILED_ATTEMPTS_MESSAGE_KEY: TAccountMessageKey =
	'account.sync.failedAttempts';

export const ACCOUNT_SYNC_CONTROL_LABEL_KEYS = {
	broadcastAvailable: 'account.sync.control.broadcastAvailable',
	broadcastUnavailable: 'account.sync.control.broadcastUnavailable',
	collapseDetails: 'account.sync.control.collapseDetails',
	compatibleLock: 'account.sync.control.compatibleLock',
	expandDetails: 'account.sync.control.expandDetails',
	mergedUnavailable: 'account.sync.control.mergedUnavailable',
	nativeLock: 'account.sync.control.nativeLock',
	restore: 'account.sync.control.restore',
	restoring: 'account.sync.control.restoring',
	sync: 'account.sync.control.sync',
	syncing: 'account.sync.control.syncing',
} as const satisfies Record<string, TAccountMessageKey>;

const ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_KEYS = {
	'sync-account-capacity-exceeded': 'account.sync.terminal.capacityExceeded',
	'sync-request-too-large': 'account.sync.terminal.requestTooLarge',
} as const satisfies Record<string, TAccountMessageKey>;

export const ACCOUNT_SYNC_CONFLICT_RESULT_MESSAGE_KEYS = {
	busy: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.busy,
	resolved: null,
	'resolved-elsewhere': null,
	stale: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.stale,
	'storage-unavailable':
		ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.storageUnavailable,
	unsupported: ACCOUNT_SYNC_CONFLICT_MESSAGE_KEYS.unsupported,
} as const satisfies Record<
	TAccountSyncConflictResolutionResultStatus,
	null | TAccountMessageKey
>;

export const ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_KEYS = {
	'conflict-storage-unavailable': {
		detail: 'account.sync.isolated.storageUnavailable.detail',
		title: 'account.sync.isolated.storageUnavailable.title',
	},
	default: {
		detail: 'account.sync.isolated.default.detail',
		title: 'account.sync.isolated.default.title',
	},
	'quarantine-storage-failed': {
		detail: 'account.sync.isolated.quarantineFailed.detail',
		title: 'account.sync.isolated.quarantineFailed.title',
	},
	'sync-reset-marker-invalid': {
		detail: 'account.sync.isolated.resetMarkerInvalid.detail',
		title: 'account.sync.isolated.resetMarkerInvalid.title',
	},
} as const satisfies Record<
	string,
	{ detail: TAccountMessageKey; title: TAccountMessageKey }
>;

interface IAccountSyncNamespaceStatusLabelKeyOptions {
	hasConflict: boolean;
	isAutomaticResolution: boolean;
	isDirty: boolean;
	resolutionReadiness: TAccountSyncConflictResolutionReadiness | undefined;
	terminalError: keyof typeof ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_KEYS | null;
}

export function getAccountSyncNamespaceStatusLabelKey({
	hasConflict,
	isAutomaticResolution,
	isDirty,
	resolutionReadiness,
	terminalError,
}: IAccountSyncNamespaceStatusLabelKeyOptions): TAccountMessageKey {
	if (resolutionReadiness !== undefined) {
		return ACCOUNT_SYNC_CONFLICT_READINESS_LABEL_KEYS[resolutionReadiness];
	}
	if (isAutomaticResolution) {
		return ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS.automaticResolution;
	}
	if (hasConflict) {
		return ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS.conflict;
	}
	if (terminalError !== null) {
		return ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_KEYS[terminalError];
	}
	return isDirty
		? ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS.dirty
		: ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_KEYS.synced;
}
