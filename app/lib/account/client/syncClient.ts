import {
	consumeAccountRuntimeInvalidationOperation,
	createAccountRuntimeSignalKey,
	parseAccountRuntimeSignal,
	publishAccountRuntimeInvalidation,
} from './accountRuntimeInvalidation';
import {
	AccountApiError,
	fetchSyncState,
	putSyncState,
	sendSyncPing,
} from './api';
import {
	readAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
	writeAccountSyncBaseSnapshot,
} from './baseSnapshot';
import {
	postAccountSyncBroadcastMessage,
	subscribeAccountSyncBroadcastMessage,
} from './broadcast';
import {
	checkAccountSyncConflictResolutionJournalsPending,
	reconcileAccountSyncDirtyQueueCollisions,
	reconcileAccountSyncPausedConflicts,
	recoverAccountSyncConflictResolutionJournals,
	resolveAccountSyncConflict,
	withAccountSyncNamespaceTransitionLock,
} from './conflict';
import {
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
} from './conflictResolutionJournal';
import {
	ACCOUNT_SYNC_LEASE_RENEW_INTERVAL,
	acquireAccountSyncLease,
	createAccountTabId,
	readAccountSyncLease,
	releaseAccountSyncLease,
	renewAccountSyncLease,
} from './lease';
import {
	checkDirtyQueueEntryTerminalError,
	checkSnapshotHashMatches,
	checkSnapshotHashesEquivalent,
	clearTerminalDirtyQueueEntryErrors,
	completeDirtyQueueEntryUpload,
	createDirtyQueueKey,
	createDirtyQueueNamespaceGenerationHash,
	createLegacyDirtyQueueKey,
	createSnapshotHash,
	markAccountSyncDirty,
	readDirtyQueueCollisionState,
	readDirtyQueueEntries,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
	recordAccountSyncDirtyQueueExternalMutation,
	removeDirtyQueueEntryIfCurrent,
	setDirtyQueueEntryError,
	writeDirtyQueueEntryIfCurrent,
	writeDirtyQueueNullTombstoneIfCurrent,
} from './queue';
import { createAccountClientId } from './random';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetPrepared,
	checkAccountSyncResetWriteAllowed,
	commitAccountSyncResetGeneration,
	prepareAccountSyncResetGeneration,
	readAccountSyncResetGeneration,
	withAccountSyncResetGenerationLock,
} from './resetGeneration';
import {
	applyRemoteAccountRecords,
	checkAccountSyncPaused,
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withAccountSyncMetaTransitionLock,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';
import { ACCOUNT_STORAGE_KEY_MAP, createAccountStorageKey } from './storage';
import {
	ACCOUNT_SYNC_OPERATION_TTL,
	applyAccountSyncOperationLeaseSignal,
	checkAccountSyncOperationActive,
	checkAccountSyncOperationOwnedByCurrentTab,
	withAccountSyncOperationLease,
} from './syncOperationLease';
import {
	addAccountSyncRemoteConflictNotices,
	beginAccountSyncAutoResolution,
	checkAccountSyncAutoResolutionActive,
	clearAccountSyncRuntimeConflicts,
	endAccountSyncAutoResolution,
	removeAccountSyncRemoteConflictNotices,
	replaceAccountSyncConflicts,
	setAccountSyncFutureStateIsolated,
	upsertAccountSyncConflict,
} from './syncRuntimeState';
import {
	type IAccountSyncBroadcastMessage,
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	type ISyncStateGetResponse,
	type ISyncStateItemCapacityError,
	type ISyncStateItemConflict,
	type ISyncStatePutResponse,
	type ISyncStateRecord,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
	type TSyncStatePutResult,
	checkSupportedSyncSchemaVersion,
} from '@/lib/account/sync';
import {
	checkSnapshotEqual,
	checkSyncMergeCanApplyAutomatically,
} from '@/lib/account/sync/serializers/utils';
import { SEND_BEACON_SYNC_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	type IGlobalPreferencesSnapshot,
	globalPreferencesSerializer,
} from '@/lib/account/sync/serializers/globalPreferences';
import { getLogSafeErrorCode } from '@/lib/logging';
import { accountStore } from '@/stores/account';
import { checkCrossTabNativeLockSupported } from '@/utilities/crossTabLock';
import { getSafeStorageMode } from '@/utilities/safeStorage';

const DIRTY_COUNT_FLUSH_THRESHOLD = 10;
const FORCE_FLUSH_DELAY = 30 * 1000;
const QUIET_FLUSH_DELAY = 2 * 1000;
const LEASE_BUSY_RETRY_DELAY = QUIET_FLUSH_DELAY;
const EXPLICIT_FLUSH_MAX_PASSES = 8;
const MAX_RATE_LIMIT_RETRY_DELAY = 5 * 60 * 1000;
const CONFLICT_HEARTBEAT_INTERVAL = 5 * 1000;
const REMOTE_CONFLICT_NOTICE_REASONS: ReadonlySet<
	IAccountSyncBroadcastMessage['runtimeReason']
> = new Set(['conflict-changed', 'conflict-created', 'conflict-heartbeat']);
const ACCOUNT_STATE_RESUME_REFRESH_DEDUPE_MS = 1000;
const RESET_RECOVERY_ERROR_REPORT_ATTEMPTS = 3;
const RESET_RECOVERY_MAX_RETRY_DELAY = 60 * 1000;
const TERMINAL_SYNC_ERROR_PRECEDENCE = [
	'sync-schema-update-required',
	'sync-account-capacity-exceeded',
	'sync-request-too-large',
] as const;

interface IAccountSyncResetRecovery {
	attempts: number;
	deleteStartedAt?: number;
	failures: number;
	key: string;
	operationId: string;
	running: boolean;
	timer: ReturnType<typeof setTimeout> | null;
	userId: string;
}

const resetRecoveries = new Map<string, IAccountSyncResetRecovery>();
const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);

interface IActiveFlushRun {
	generation: number;
	promise: Promise<boolean>;
	runId: string;
	userId: string;
}

let activeFlushRun: IActiveFlushRun | null = null;
let forceFlushTimer: ReturnType<typeof setTimeout> | null = null;
let leaseTimer: ReturnType<typeof setInterval> | null = null;
let leaseTimerGeneration: number | null = null;
let quietFlushTimer: ReturnType<typeof setTimeout> | null = null;
let syncClientGeneration = 0;
let visibilityOperationId: string | null = null;

const tabId = createAccountTabId();

function getLoggedInAccountContext() {
	const csrfToken = accountStore.shared.csrfToken.get();
	const user = accountStore.shared.user.get();

	if (csrfToken === null || user === null) {
		return null;
	}

	return { csrfToken, user };
}

function checkCurrentAccountUser(userId: string) {
	return accountStore.shared.user.get()?.id === userId;
}

function checkCurrentSyncRun(generation: number, userId: string) {
	return (
		syncClientGeneration === generation && checkCurrentAccountUser(userId)
	);
}

function checkNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function checkRemoteRevision(value: unknown): value is number {
	return (
		checkNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER
	);
}

function checkSyncNamespace(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

function checkRemoteSyncSchemaVersion(
	namespace: TSyncNamespace,
	version: unknown
): version is number {
	if (
		checkNonNegativeSafeInteger(version) &&
		version > SYNC_SCHEMA_VERSION_MAP[namespace]
	) {
		throw new TypeError('sync-client-update-required');
	}

	return checkSupportedSyncSchemaVersion(namespace, version);
}

function validateRemoteSyncRecord(record: unknown): ISyncStateRecord {
	if (!checkPlainObject(record)) {
		throw new TypeError('invalid-sync-state-record');
	}
	const {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		updated_at: updatedAt,
	} = record;

	if (
		!checkSyncNamespace(namespace) ||
		!checkRemoteRevision(revision) ||
		!checkNonNegativeSafeInteger(updatedAt)
	) {
		throw new TypeError('invalid-sync-state-record');
	}
	if (!checkRemoteSyncSchemaVersion(namespace, schemaVersion)) {
		throw new TypeError('invalid-sync-state-record');
	}

	return {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		updated_at: updatedAt,
	};
}

function validateRemoteSyncState(response: unknown): ISyncStateGetResponse {
	if (!checkPlainObject(response)) {
		throw new TypeError('invalid-sync-state');
	}
	const { records, state_epoch: stateEpoch } = response;

	if (!Array.isArray(records)) {
		throw new TypeError('invalid-sync-state');
	}

	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		throw new TypeError('invalid-sync-state-epoch');
	}

	return {
		records: records.map(validateRemoteSyncRecord),
		state_epoch: stateEpoch,
	};
}

function validateSyncPutResult(result: unknown): TSyncStatePutResult {
	if (!checkPlainObject(result)) {
		throw new TypeError('invalid-sync-result');
	}
	const { namespace, status } = result;

	if (!checkSyncNamespace(namespace)) {
		throw new TypeError('invalid-sync-result');
	}

	if (status === 'error') {
		const { message } = result;
		if (typeof message !== 'string') {
			throw new TypeError('invalid-sync-result');
		}
		if (message === 'sync-schema-update-required') {
			const { current_schema_version: currentSchemaVersion } = result;
			if (
				!checkNonNegativeSafeInteger(currentSchemaVersion) ||
				currentSchemaVersion <= SYNC_SCHEMA_VERSION_MAP[namespace]
			) {
				throw new TypeError('invalid-sync-result');
			}

			return {
				current_schema_version: currentSchemaVersion,
				message,
				namespace,
				status,
			};
		}
		if (message === 'sync-account-capacity-exceeded') {
			const {
				candidate_bytes: candidateBytes,
				candidate_namespace_bytes: candidateNamespaceBytes,
				current_bytes: currentBytes,
				current_namespace_bytes: currentNamespaceBytes,
				limit_bytes: limitBytes,
				namespaces,
			} = result;
			if (
				!checkNonNegativeSafeInteger(candidateBytes) ||
				!checkNonNegativeSafeInteger(candidateNamespaceBytes) ||
				!checkNonNegativeSafeInteger(currentBytes) ||
				!checkNonNegativeSafeInteger(currentNamespaceBytes) ||
				!checkNonNegativeSafeInteger(limitBytes) ||
				limitBytes === 0 ||
				!Array.isArray(namespaces) ||
				!namespaces.every(checkSyncNamespace)
			) {
				throw new TypeError('invalid-sync-result');
			}

			return {
				candidate_bytes: candidateBytes,
				candidate_namespace_bytes: candidateNamespaceBytes,
				current_bytes: currentBytes,
				current_namespace_bytes: currentNamespaceBytes,
				limit_bytes: limitBytes,
				message,
				namespace,
				namespaces,
				status,
			};
		}

		return { message, namespace, status };
	}

	if (status !== 'ok' && status !== 'conflict') {
		throw new TypeError('invalid-sync-result');
	}
	const { revision, updated_at: updatedAt } = result;

	if (
		!checkRemoteRevision(revision) ||
		!checkNonNegativeSafeInteger(updatedAt)
	) {
		throw new TypeError('invalid-sync-result');
	}

	if (status === 'ok') {
		return { namespace, revision, status, updated_at: updatedAt };
	}
	const { data, schema_version: schemaVersion } = result;
	if (!checkRemoteSyncSchemaVersion(namespace, schemaVersion)) {
		throw new TypeError('invalid-sync-result');
	}

	return {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		status,
		updated_at: updatedAt,
	};
}

function validateSyncPutResponse(response: unknown): ISyncStatePutResponse {
	if (!checkPlainObject(response)) {
		throw new TypeError('invalid-sync-result');
	}
	const { results, state_epoch: stateEpoch } = response;

	if (!Array.isArray(results)) {
		throw new TypeError('invalid-sync-result');
	}

	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		throw new TypeError('invalid-sync-state-epoch');
	}

	return {
		results: results.map(validateSyncPutResult),
		state_epoch: stateEpoch,
	};
}

function checkBroadcastStateEpoch(message: IAccountSyncBroadcastMessage) {
	const { state_epoch: stateEpoch } = message;

	return checkNonNegativeSafeInteger(stateEpoch);
}

function checkRemoteStateFresh(userId: string, stateEpoch: number) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const currentUser = accountStore.shared.user.get();
	if (currentUser?.id !== userId || stateEpoch < currentUser.state_epoch) {
		return false;
	}

	const currentMeta = readAccountSyncMeta(userId);

	return currentMeta === null || stateEpoch >= currentMeta.state_epoch;
}

function clearActiveFlushRun({
	generation,
	runId,
	userId,
}: {
	generation: number;
	runId: string;
	userId: string;
}) {
	const activeRun = activeFlushRun;
	if (
		activeRun?.runId === runId &&
		activeRun.generation === generation &&
		activeRun.userId === userId
	) {
		activeFlushRun = null;
	}
}

function setCurrentAccountUserStateEpoch(userId: string, stateEpoch: number) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const user = accountStore.shared.user.get();
	if (user?.id !== userId) {
		return false;
	}
	if (stateEpoch < user.state_epoch) {
		return false;
	}

	if (user.state_epoch !== stateEpoch) {
		accountStore.shared.user.set({ ...user, state_epoch: stateEpoch });
	}

	return true;
}

function updatePendingCount(entries?: IDirtyQueueEntry[]) {
	const user = accountStore.shared.user.get();
	const pendingEntries =
		entries ?? (user === null ? [] : readDirtyQueueEntries(user.id));
	const isolatedNamespaces = new Set(
		user === null ? [] : readIsolatedDirtyQueueNamespaces(user.id)
	);

	accountStore.shared.sync.pendingCount.set(
		pendingEntries.filter(
			(entry) =>
				entry.paused === null &&
				!isolatedNamespaces.has(entry.namespace) &&
				!checkDirtyQueueEntryTerminalError(entry)
		).length
	);
	accountStore.shared.sync.queueRevision.set(
		accountStore.shared.sync.queueRevision.get() + 1
	);
}

function clearSyncTimers() {
	if (quietFlushTimer !== null) {
		clearTimeout(quietFlushTimer);
		quietFlushTimer = null;
	}
	if (forceFlushTimer !== null) {
		clearTimeout(forceFlushTimer);
		forceFlushTimer = null;
	}
}

function getRateLimitRetryDelay(error: AccountApiError) {
	if (error.status !== 429 || error.retryAfter === null) {
		return null;
	}

	return Math.min(
		MAX_RATE_LIMIT_RETRY_DELAY,
		Math.max(QUIET_FLUSH_DELAY, Math.ceil(error.retryAfter * 1000))
	);
}

function scheduleAccountSyncFlushAfter(delay: number, flush: () => void) {
	if (quietFlushTimer !== null) {
		clearTimeout(quietFlushTimer);
	}
	quietFlushTimer = setTimeout(() => {
		quietFlushTimer = null;
		flush();
	}, delay);
}

function resetExpiredAccountSession() {
	const user = accountStore.shared.user.get();
	if (user !== null) {
		void publishAccountRuntimeInvalidation({
			reason: 'session-expired',
			stateEpoch: user.state_epoch,
			userId: user.id,
		});
	}
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	accountStore.shared.sync.canRetry.set(false);
	clearAccountSyncRuntimeConflicts();
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.isSyncing.set(false);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.lastResult.set(null);
	accountStore.shared.sync.lastSyncedAt.set(null);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.sync.pendingCount.set(0);
	accountStore.shared.user.set(null);
}

function stopLeaseRenewal(generation?: number) {
	if (generation !== undefined && leaseTimerGeneration !== generation) {
		return;
	}

	if (leaseTimer !== null) {
		clearInterval(leaseTimer);
		leaseTimer = null;
	}
	leaseTimerGeneration = null;
}

function clearAccountSyncResetRecovery(recovery: IAccountSyncResetRecovery) {
	if (recovery.timer !== null) {
		clearTimeout(recovery.timer);
		recovery.timer = null;
	}
	if (resetRecoveries.get(recovery.key) === recovery) {
		resetRecoveries.delete(recovery.key);
	}
}

function clearAccountSyncResetRecoveries(userId?: string) {
	for (const recovery of resetRecoveries.values()) {
		if (userId === undefined || recovery.userId === userId) {
			clearAccountSyncResetRecovery(recovery);
		}
	}
}

function recordAccountSyncResetRecoveryFailure(
	recovery: IAccountSyncResetRecovery
) {
	if (
		recovery.failures < RESET_RECOVERY_ERROR_REPORT_ATTEMPTS ||
		!checkCurrentAccountUser(recovery.userId)
	) {
		return;
	}
	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set('account-sync-reset-incomplete');
	accountStore.shared.sync.lastResult.set('failed');
}

function clearAccountSyncResetRecoveryError(userId: string) {
	if (
		checkCurrentAccountUser(userId) &&
		accountStore.shared.sync.lastError.get() ===
			'account-sync-reset-incomplete'
	) {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		recordAccountSyncRefreshSuccess({ userId });
	}
}

export function invalidateAccountSyncClientRuns(userId?: string) {
	syncClientGeneration += 1;
	if (userId !== undefined) {
		clearAccountSyncResetRecoveries(userId);
	}
	activeFlushRun = null;
	visibilityOperationId = null;
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
}

export function stopAccountSyncClient() {
	invalidateAccountSyncClientRuns();
	clearAccountSyncResetRecoveries();
}

function handleForbiddenSyncError(error: AccountApiError) {
	const user = accountStore.shared.user.get();
	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.lastError.set(error.message);
	accountStore.shared.sync.lastResult.set('failed');

	if (error.message !== 'password-must-change') {
		stopAccountSyncClient();
		resetExpiredAccountSession();
		return;
	}

	void import('./session')
		.then(({ refreshAccountStateFromInvalidation }) =>
			refreshAccountStateFromInvalidation()
		)
		.then(() => {
			if (user !== null) {
				return publishAccountRuntimeInvalidation({
					reason: 'password-required',
					stateEpoch: user.state_epoch,
					userId: user.id,
				});
			}
			return false;
		})
		.catch(() => {
			accountStore.shared.sync.canRetry.set(true);
		});
}

function handlePassiveSyncRefreshError(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (!checkCurrentSyncRun(generation, expectedUserId)) {
		return;
	}
	if (
		error instanceof Error &&
		error.message === 'sync-client-update-required'
	) {
		setAccountSyncFutureStateIsolated(expectedUserId, true);
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastResult.set('failed');
		return;
	}

	if (error instanceof AccountApiError && error.status === 401) {
		stopAccountSyncClient();
		resetExpiredAccountSession();
		return;
	}
	if (error instanceof AccountApiError && error.status === 403) {
		handleForbiddenSyncError(error);
		return;
	}
	if (error instanceof AccountApiError && error.status === 429) {
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastError.set(error.message);
		scheduleAccountSyncFlushAfter(
			getRateLimitRetryDelay(error) ?? LEASE_BUSY_RETRY_DELAY,
			() => {
				// eslint-disable-next-line @typescript-eslint/no-use-before-define
				scheduleAccountSyncFlush();
			}
		);
		return;
	}

	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set(
		error instanceof Error ? error.message : 'sync-refresh-failed'
	);
}

function handleActiveSyncRefreshUnauthorized(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (
		!(error instanceof AccountApiError) ||
		error.status !== 401 ||
		!checkCurrentSyncRun(generation, expectedUserId)
	) {
		return false;
	}

	stopAccountSyncClient();
	resetExpiredAccountSession();
	return true;
}

function handleActiveForbiddenSyncError(
	error: unknown,
	expectedUserId: string,
	generation: number
) {
	if (
		!(error instanceof AccountApiError) ||
		error.status !== 403 ||
		!checkCurrentSyncRun(generation, expectedUserId)
	) {
		return false;
	}

	handleForbiddenSyncError(error);
	return true;
}

async function fetchSyncStateForCurrentUser(
	userId: string,
	generation = syncClientGeneration
) {
	try {
		return validateRemoteSyncState(await fetchSyncState());
	} catch (error) {
		if (handleActiveSyncRefreshUnauthorized(error, userId, generation)) {
			return null;
		}
		if (handleActiveForbiddenSyncError(error, userId, generation)) {
			return null;
		}
		if (
			error instanceof Error &&
			error.message === 'sync-client-update-required' &&
			checkCurrentSyncRun(generation, userId)
		) {
			setAccountSyncFutureStateIsolated(userId, true);
			accountStore.shared.sync.canRetry.set(false);
			accountStore.shared.sync.lastResult.set('failed');
		}

		throw error;
	}
}

async function fetchValidatedSyncState(namespaces: TSyncNamespace[]) {
	return validateRemoteSyncState(await fetchSyncState(namespaces));
}

function startLeaseRenewal(
	userId: string,
	generation: number,
	leaseRunId: string
) {
	if (leaseTimer !== null) {
		return;
	}

	leaseTimerGeneration = generation;
	leaseTimer = setInterval(() => {
		void renewAccountSyncLease(userId, tabId, leaseRunId)
			.then((isRenewed) => {
				if (!isRenewed && checkCurrentSyncRun(generation, userId)) {
					stopAccountSyncClient();
				}
			})
			.catch(() => {
				if (checkCurrentSyncRun(generation, userId)) {
					stopAccountSyncClient();
				}
			});
	}, ACCOUNT_SYNC_LEASE_RENEW_INTERVAL);
}

function getRecordMap(records: ISyncStateRecord[]) {
	return records.reduce<Partial<Record<TSyncNamespace, ISyncStateRecord>>>(
		(result, record) => {
			result[record.namespace] = record;
			return result;
		},
		{}
	);
}

function postRemoteAppliedBroadcast({
	records,
	stateEpoch,
	userId,
}: {
	records: ISyncStateRecord[];
	stateEpoch: number;
	userId: string;
}) {
	if (records.length === 0) {
		return;
	}

	void postAccountSyncBroadcastMessage({
		namespaces: records.map((record) => record.namespace),
		operationId: createAccountClientId(),
		state_epoch: stateEpoch,
		tabId,
		type: 'remote-applied',
		userId,
	});
}

function migrateDirtyQueueEntryToCurrentSchema({
	entry,
	generationToken,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}): IDirtyQueueEntry | null {
	const schemaVersion = SYNC_SCHEMA_VERSION_MAP[entry.namespace];
	if (entry.schema_version >= schemaVersion) {
		return entry;
	}

	const serializer = getAccountSyncSerializer(entry.namespace);
	const data = serializer.migrate(entry.data, entry.schema_version);
	const migratedEntry = {
		...entry,
		data,
		...(entry.lastError === 'sync-schema-update-required'
			? { attempts: 0, lastError: null }
			: {}),
		schema_version: schemaVersion,
		snapshotHash: createSnapshotHash(data),
	} satisfies IDirtyQueueEntry;

	return writeDirtyQueueEntryIfCurrent({
		expectedEntry: entry,
		generationToken,
		nextEntry: migratedEntry,
		userId,
	})
		? migratedEntry
		: readDirtyQueueEntry(userId, entry.namespace);
}

function readMigratedDirtyQueueEntries(
	userId: string,
	generationToken: string | null
) {
	return readDirtyQueueEntries(userId)
		.map((entry) =>
			migrateDirtyQueueEntryToCurrentSchema({
				entry,
				generationToken,
				userId,
			})
		)
		.filter((entry): entry is IDirtyQueueEntry => entry !== null);
}

function getFlushableEntries(userId: string, generationToken: string | null) {
	if (checkAccountSyncResetPrepared(userId)) {
		return [];
	}
	const entries = readMigratedDirtyQueueEntries(userId, generationToken);
	const isolatedNamespaces = new Set(
		readIsolatedDirtyQueueNamespaces(userId)
	);
	return entries.filter(
		(entry) =>
			entry.paused === null &&
			!isolatedNamespaces.has(entry.namespace) &&
			!checkDirtyQueueEntryTerminalError(entry)
	);
}

function recordAccountSyncRefreshSuccess({
	unresolvedReason = null,
	userId,
}: {
	unresolvedReason?: string | null;
	userId: string;
}) {
	if (!checkCurrentAccountUser(userId)) {
		return false;
	}
	// Synchronous runtime-status boundary.
	const generationToken = captureAccountSyncResetGeneration(userId);
	const allEntries = readMigratedDirtyQueueEntries(userId, generationToken);
	const hasPendingUploads =
		getFlushableEntries(userId, generationToken).length > 0;
	const durableTerminalError =
		TERMINAL_SYNC_ERROR_PRECEDENCE.find((message) =>
			allEntries.some((entry) => entry.lastError === message)
		) ?? null;
	const hasCurrentUserConflict = accountStore.shared.sync.conflicts
		.get()
		.some((conflict) => conflict.userId === userId);
	const effectiveError = hasCurrentUserConflict
		? 'conflict'
		: (durableTerminalError ?? unresolvedReason);
	const hasPartialResult =
		effectiveError !== null || hasPendingUploads || hasCurrentUserConflict;

	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.failedAttempts.set(0);
	accountStore.shared.sync.lastError.set(effectiveError);
	accountStore.shared.sync.lastResult.set(
		hasPartialResult ? 'partial' : 'success'
	);
	accountStore.shared.sync.lastSyncedAt.set(Date.now());

	return true;
}

function checkFlushEntriesStillCurrent(
	userId: string,
	entries: IDirtyQueueEntry[]
) {
	const entriesMatch = entries.every((entry) => {
		const currentEntry = readDirtyQueueEntry(userId, entry.namespace);

		return (
			currentEntry !== null &&
			currentEntry.paused === null &&
			currentEntry.clientMutationId === entry.clientMutationId &&
			checkSnapshotHashesEquivalent(currentEntry, entry)
		);
	});
	if (!entriesMatch) {
		return false;
	}
	const isolatedNamespaces = new Set(
		readIsolatedDirtyQueueNamespaces(userId)
	);
	return entries.every((entry) => !isolatedNamespaces.has(entry.namespace));
}

function setAccountSyncConflict(conflict: ISyncConflictItem) {
	upsertAccountSyncConflict(conflict);
}

function normalizeGlobalPreferencesInteractionCount(
	data: IGlobalPreferencesSnapshot,
	interactionCount: number
) {
	return {
		...data,
		donationModal: { ...data.donationModal, interactionCount },
	};
}

function getInteractionCountOnlyCloudConflict(
	conflict: ISyncConflictItem
): ISyncConflictItem<IGlobalPreferencesSnapshot> | null {
	if (conflict.namespace !== SYNC_NAMESPACE_MAP.globalPreferences) {
		return null;
	}

	let cloud: IGlobalPreferencesSnapshot;
	let local: IGlobalPreferencesSnapshot;
	let localCollision:
		| {
				candidates: Array<{
					baseRevision: number;
					data: IGlobalPreferencesSnapshot;
					id: string;
					label: string;
					schemaVersion: number;
					snapshotHash: string;
				}>;
				invalidEvidenceCount: number;
				token: string;
				version: 1;
		  }
		| undefined;
	try {
		cloud = globalPreferencesSerializer.deserialize(conflict.cloud);
		local = globalPreferencesSerializer.deserialize(conflict.local);
		localCollision =
			conflict.localCollision === undefined
				? undefined
				: {
						...conflict.localCollision,
						candidates: conflict.localCollision.candidates.map(
							(candidate) => {
								const data =
									globalPreferencesSerializer.deserialize(
										candidate.data
									);
								if (
									!globalPreferencesSerializer.validate(data)
								) {
									throw new Error(
										'invalid-global-preferences-collision-candidate'
									);
								}
								return { ...candidate, data };
							}
						),
					};
	} catch {
		return null;
	}

	const normalizedLocal = normalizeGlobalPreferencesInteractionCount(
		local,
		cloud.donationModal.interactionCount
	);
	if (createSnapshotHash(normalizedLocal) !== createSnapshotHash(cloud)) {
		return null;
	}

	return {
		cloud,
		local,
		...(localCollision === undefined ? {} : { localCollision }),
		merged:
			conflict.merged === null
				? null
				: globalPreferencesSerializer.deserialize(conflict.merged),
		namespace: conflict.namespace,
		revision: conflict.revision,
		userId: conflict.userId,
	};
}

function tryResolveInteractionCountOnlyConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	const cloudConflict = getInteractionCountOnlyCloudConflict(conflict);
	if (cloudConflict === null) {
		return false;
	}
	if (checkAccountSyncAutoResolutionActive(userId, cloudConflict.namespace)) {
		return true;
	}
	if (!beginAccountSyncAutoResolution(userId, cloudConflict.namespace)) {
		return false;
	}

	void resolveAccountSyncConflict({
		conflict: cloudConflict,
		resolution: 'cloud',
		userId,
	})
		.then((didResolve) => {
			if (!didResolve && checkCurrentAccountUser(userId)) {
				upsertAccountSyncConflict(cloudConflict);
			}
		})
		.catch((error: unknown) => {
			if (!checkCurrentAccountUser(userId)) {
				return;
			}
			console.warn(
				'Failed to auto-resolve interactionCount-only account sync conflict.',
				{ errorCode: getLogSafeErrorCode(error) }
			);
			accountStore.shared.sync.lastError.set(
				'conflict-auto-resolution-failed'
			);
			upsertAccountSyncConflict(cloudConflict);
		})
		.finally(() => {
			endAccountSyncAutoResolution(userId, cloudConflict.namespace);
		});

	return true;
}

function normalizeRestoredAccountSyncConflict(conflict: ISyncConflictItem) {
	const serializer = getAccountSyncSerializer(conflict.namespace);

	return {
		...conflict,
		cloud: serializer.deserialize(conflict.cloud),
		local: serializer.deserialize(conflict.local),
		merged:
			conflict.merged === null
				? null
				: serializer.deserialize(conflict.merged),
	} satisfies ISyncConflictItem;
}

function restoreAccountSyncConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	if (tryResolveInteractionCountOnlyConflict(conflict, userId)) {
		return null;
	}

	try {
		return normalizeRestoredAccountSyncConflict(conflict);
	} catch (error) {
		console.warn('Failed to restore paused account sync conflict.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return null;
	}
}

function mergeConflictFromDirtyEntry({
	entry,
	record,
	userId,
}: {
	entry: IDirtyQueueEntry;
	record: ISyncStateRecord | null;
	userId: string;
}) {
	const serializer = getAccountSyncSerializer(entry.namespace);
	const cloud =
		record === null
			? null
			: serializer.migrate(record.data, record.schema_version);
	const local = serializer.migrate(entry.data, entry.schema_version);
	const storedBase = readAccountSyncBaseSnapshot(
		userId,
		entry.namespace,
		entry.baseRevision,
		serializer
	);
	const base = storedBase?.data ?? null;
	const mergeResult = serializer.merge({
		base,
		cloud,
		local,
		namespace: entry.namespace,
	});

	const conflict =
		mergeResult.conflict === null
			? ({
					cloud: cloud ?? serializer.getDefaultSnapshot(),
					local,
					merged: mergeResult.data,
					namespace: entry.namespace,
					revision: record?.revision ?? 0,
					userId,
				} satisfies ISyncConflictItem)
			: {
					...mergeResult.conflict,
					revision: record?.revision ?? 0,
					userId,
				};

	return { cloud, conflict, mergeResult, serializer };
}

function checkConflictSnapshotsEqual(
	left: ISyncConflictItem | null,
	right: ISyncConflictItem
) {
	return (
		left !== null &&
		left.revision === right.revision &&
		createSnapshotHash(left.cloud) === createSnapshotHash(right.cloud) &&
		createSnapshotHash(left.local) === createSnapshotHash(right.local) &&
		createSnapshotHash(left.merged) === createSnapshotHash(right.merged)
	);
}

function pauseDirtyEntryWithConflict({
	allowMissing = false,
	conflict,
	entry,
	generationToken,
	incrementAttempts = false,
	userId,
}: {
	allowMissing?: boolean;
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	incrementAttempts?: boolean;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	const isCurrentEntryMatch =
		currentEntry?.clientMutationId === entry.clientMutationId &&
		checkSnapshotHashesEquivalent(currentEntry, entry);
	if (!isCurrentEntryMatch && !(allowMissing && currentEntry === null)) {
		return false;
	}

	const entryToPause = currentEntry ?? entry;
	const hasConflictChanged =
		entryToPause.paused !== 'conflict' ||
		!checkConflictSnapshotsEqual(entryToPause.conflict, conflict);
	const nextEntry = {
		...entryToPause,
		attempts: entryToPause.attempts + (incrementAttempts ? 1 : 0),
		clientMutationId: hasConflictChanged
			? createAccountClientId()
			: entryToPause.clientMutationId,
		conflict,
		data: conflict.local,
		dirtyAt: hasConflictChanged ? Date.now() : entryToPause.dirtyAt,
		lastError: 'conflict',
		paused: 'conflict',
		snapshotHash: createSnapshotHash(conflict.local),
	} satisfies IDirtyQueueEntry;
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			userId,
		})
	) {
		return false;
	}
	setAccountSyncConflict(conflict);
	const user = accountStore.shared.user.get();
	if (user?.id === userId) {
		void postAccountSyncBroadcastMessage({
			namespaces: [entry.namespace],
			operationId: createAccountClientId(),
			runtimeMutationId: nextEntry.clientMutationId,
			runtimeReason: 'conflict-created',
			state_epoch: user.state_epoch,
			tabId,
			type: 'dirty',
			userId,
		});
	}

	return nextEntry;
}

function routePausedConflictMergeResult({
	cloud,
	deferredAutoResolutions,
	entry,
	generationToken,
	local,
	mergeResult,
	record,
	userId,
}: {
	cloud: unknown;
	deferredAutoResolutions?: Array<() => void>;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	local: unknown;
	mergeResult: ReturnType<
		ReturnType<typeof getAccountSyncSerializer>['merge']
	>;
	record: ISyncStateRecord | undefined;
	userId: string;
}) {
	const conflict =
		mergeResult.conflict === null
			? {
					cloud,
					local,
					merged: mergeResult.data,
					namespace: entry.namespace,
					revision: record?.revision ?? 0,
					userId,
				}
			: {
					...mergeResult.conflict,
					revision: record?.revision ?? 0,
					userId,
				};
	const pausedEntry = pauseDirtyEntryWithConflict({
		conflict,
		entry,
		generationToken,
		userId,
	});
	if (pausedEntry === false) {
		return false;
	}
	if (!checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
		return true;
	}

	const resolveAutomatically = () => {
		beginAccountSyncAutoResolution(userId, entry.namespace);
		void resolveAccountSyncConflict({
			conflict,
			generationToken,
			resolution: mergeResult.shouldUpload ? 'merged' : 'cloud',
			userId,
		})
			.then((didResolve) => {
				if (!didResolve && checkCurrentAccountUser(userId)) {
					upsertAccountSyncConflict(conflict);
					return;
				}
				if (didResolve && mergeResult.shouldUpload) {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					scheduleAccountSyncFlush();
				}
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountUser(userId)) {
					return;
				}
				console.warn(
					'Failed to apply automatic account sync resolution.',
					{ errorCode: getLogSafeErrorCode(error) }
				);
				accountStore.shared.sync.lastError.set(
					'conflict-auto-resolution-failed'
				);
				upsertAccountSyncConflict(conflict);
			})
			.finally(() => {
				endAccountSyncAutoResolution(userId, entry.namespace);
			});
	};
	if (deferredAutoResolutions === undefined) {
		resolveAutomatically();
	} else {
		deferredAutoResolutions.push(resolveAutomatically);
	}

	return true;
}

function checkRemoteStateCleared({
	records,
	stateEpoch,
	userId,
}: {
	records: ISyncStateRecord[];
	stateEpoch: number;
	userId: string;
}) {
	const currentMeta = readAccountSyncMeta(userId);
	if (records.length > 0) {
		return false;
	}

	if (currentMeta !== null && stateEpoch > currentMeta.state_epoch) {
		return true;
	}

	if (currentMeta?.clearedStateEpoch !== stateEpoch) {
		return false;
	}

	return readDirtyQueueEntries(userId).length === 0;
}

function applyRemoteStatePreservingDirtyUnlocked({
	deferredAutoResolutions,
	generationToken,
	records,
	replaceMeta = true,
	stateEpoch,
	targetNamespaces,
	userId,
}: {
	deferredAutoResolutions: Array<() => void>;
	generationToken: string | null;
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	targetNamespaces?: TSyncNamespace[];
	userId: string;
}) {
	if (!checkRemoteStateFresh(userId, stateEpoch)) {
		return [];
	}

	const targetNamespaceSet =
		targetNamespaces === undefined ? null : new Set(targetNamespaces);
	const targetRecords =
		targetNamespaceSet === null
			? records
			: records.filter((record) =>
					targetNamespaceSet.has(record.namespace)
				);
	const dirtyEntries = readMigratedDirtyQueueEntries(
		userId,
		generationToken
	).filter(
		(entry) =>
			targetNamespaceSet === null ||
			targetNamespaceSet.has(entry.namespace)
	);
	const preserveNamespaceSet = new Set<TSyncNamespace>();
	const recordMap = getRecordMap(targetRecords);

	dirtyEntries.forEach((entry) => {
		const storedConflict = entry.conflict;
		const wasPausedConflict =
			entry.paused === 'conflict' && storedConflict !== null;
		if (entry.paused === 'conflict' && storedConflict !== null) {
			const serializer = getAccountSyncSerializer(entry.namespace);
			const record = recordMap[entry.namespace];
			const currentCloud =
				record === undefined
					? serializer.getDefaultSnapshot()
					: serializer.migrate(record.data, record.schema_version);
			const storedCloud = serializer.deserialize(storedConflict.cloud);
			if (
				storedConflict.revision === (record?.revision ?? 0) &&
				checkSnapshotEqual(storedCloud, currentCloud)
			) {
				const restoredConflict = restoreAccountSyncConflict(
					storedConflict,
					userId
				);
				if (restoredConflict !== null) {
					setAccountSyncConflict(restoredConflict);
					preserveNamespaceSet.add(entry.namespace);
				}
				return;
			}
		}

		const serializer = getAccountSyncSerializer(entry.namespace);
		const record = recordMap[entry.namespace];
		const cloud =
			record === undefined
				? null
				: serializer.migrate(record.data, record.schema_version);
		const local = serializer.migrate(entry.data, entry.schema_version);
		const storedBase = readAccountSyncBaseSnapshot(
			userId,
			entry.namespace,
			entry.baseRevision,
			serializer
		);
		const base = storedBase?.data ?? null;
		const mergeResult = serializer.merge({
			base,
			cloud,
			local,
			namespace: entry.namespace,
		});
		if (wasPausedConflict) {
			routePausedConflictMergeResult({
				cloud: cloud ?? serializer.getDefaultSnapshot(),
				deferredAutoResolutions,
				entry,
				generationToken,
				local,
				mergeResult,
				record,
				userId,
			});
			preserveNamespaceSet.add(entry.namespace);
			return;
		}

		if (checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
			routePausedConflictMergeResult({
				cloud: cloud ?? serializer.getDefaultSnapshot(),
				deferredAutoResolutions,
				entry,
				generationToken,
				local,
				mergeResult,
				record,
				userId,
			});
			preserveNamespaceSet.add(entry.namespace);
			return;
		}

		pauseDirtyEntryWithConflict({
			conflict:
				mergeResult.conflict === null
					? {
							cloud: cloud ?? serializer.getDefaultSnapshot(),
							local,
							merged: mergeResult.data,
							namespace: entry.namespace,
							revision: record?.revision ?? 0,
							userId,
						}
					: {
							...mergeResult.conflict,
							revision: record?.revision ?? 0,
							userId,
						},
			entry,
			generationToken,
			userId,
		});
		preserveNamespaceSet.add(entry.namespace);
	});

	const recordsToApply = targetRecords.filter(
		(record) => !preserveNamespaceSet.has(record.namespace)
	);
	applyRemoteAccountRecords({
		generationToken,
		preserveNamespaces: [...preserveNamespaceSet],
		records: recordsToApply,
		replaceMeta,
		stateEpoch,
		userId,
	});
	recordsToApply.forEach((record) => {
		const schemaVersion = SYNC_SCHEMA_VERSION_MAP[record.namespace];
		if (record.schema_version >= schemaVersion) {
			return;
		}

		const serializer = getAccountSyncSerializer(record.namespace);
		const data = serializer.migrate(record.data, record.schema_version);
		writeDirtyQueueEntryIfCurrent({
			expectedEntry: null,
			generationToken,
			nextEntry: {
				attempts: 0,
				baseRevision: record.revision,
				clientMutationId: createAccountClientId(),
				conflict: null,
				data,
				dirtyAt: Date.now(),
				lastError: null,
				namespace: record.namespace,
				paused: null,
				schema_version: schemaVersion,
				snapshotHash: createSnapshotHash(data),
			},
			userId,
		});
	});
	updatePendingCount();

	return recordsToApply;
}

async function applyRemoteStatePreservingDirty(options: {
	generationToken: string | null;
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	targetNamespaces?: TSyncNamespace[];
	userId: string;
}) {
	const deferredAutoResolutions: Array<() => void> = [];
	const result = await withAccountSyncMetaTransitionLock(
		options.userId,
		options.generationToken,
		() => {
			if (
				!checkCurrentAccountUser(options.userId) ||
				!checkRemoteStateFresh(options.userId, options.stateEpoch) ||
				!checkAccountSyncResetWriteAllowed({
					expectedGeneration: options.generationToken,
					userId: options.userId,
				})
			) {
				return null;
			}
			return applyRemoteStatePreservingDirtyUnlocked({
				...options,
				deferredAutoResolutions,
			});
		}
	);
	if (result !== null) {
		deferredAutoResolutions.forEach((resolve) => {
			resolve();
		});
	}

	return result;
}

export function restoreAccountSyncRuntimeState(
	userId: string,
	skipJournalRecovery = false
) {
	const resetGeneration = readAccountSyncResetGeneration(userId);
	if (
		resetGeneration.status === 'future' ||
		resetGeneration.status === 'invalid'
	) {
		setAccountSyncFutureStateIsolated(userId, true);
		accountStore.shared.sync.lastError.set(
			resetGeneration.status === 'future'
				? 'sync-reset-marker-future'
				: 'sync-reset-marker-invalid'
		);
		accountStore.shared.sync.lastResult.set('failed');
		updatePendingCount([]);
		return;
	}
	const hasPendingJournal =
		checkAccountSyncConflictResolutionJournalsPending(userId);
	if (hasPendingJournal && !skipJournalRecovery) {
		void recoverAccountSyncConflictResolutionJournals(userId)
			.then(() => {
				if (checkCurrentAccountUser(userId)) {
					restoreAccountSyncRuntimeState(userId, true);
				}
			})
			.catch((error: unknown) => {
				if (checkCurrentAccountUser(userId)) {
					console.warn(
						'Failed to recover account sync conflict journal.',
						{ errorCode: getLogSafeErrorCode(error) }
					);
					setAccountSyncFutureStateIsolated(userId, true);
				}
			});
	}
	const runtimeGenerationToken =
		resetGeneration.status === 'current' ? resetGeneration.raw : null;
	const entries = readMigratedDirtyQueueEntries(
		userId,
		runtimeGenerationToken
	);
	const conflicts = entries
		.map((entry) => {
			if (entry.paused !== 'conflict' || entry.conflict === null) {
				return null;
			}

			return restoreAccountSyncConflict(entry.conflict, userId);
		})
		.filter((conflict): conflict is ISyncConflictItem => conflict !== null);
	const terminalError =
		TERMINAL_SYNC_ERROR_PRECEDENCE.find((message) =>
			entries.some((entry) => entry.lastError === message)
		) ?? null;
	replaceAccountSyncConflicts(userId, conflicts);
	if (
		conflicts.length === 0 &&
		accountStore.shared.sync.lastError.get() === 'conflict'
	) {
		accountStore.shared.sync.lastError.set(null);
	}
	const isolatedNamespaces = readIsolatedDirtyQueueNamespaces(userId);
	if (isolatedNamespaces.length > 0) {
		void reconcileAccountSyncDirtyQueueCollisions(userId)
			.then((results) => {
				if (
					checkCurrentAccountUser(userId) &&
					results.some(
						(result) =>
							result === 'conflict' || result === 'resolved'
					)
				) {
					restoreAccountSyncRuntimeState(userId, true);
					if (results.includes('resolved')) {
						// eslint-disable-next-line @typescript-eslint/no-use-before-define
						scheduleAccountSyncFlush();
					}
				}
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountUser(userId)) {
					return;
				}
				console.warn('Failed to quarantine account sync state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				setAccountSyncFutureStateIsolated(userId, true);
				accountStore.shared.sync.lastError.set(
					error instanceof Error &&
						error.message === 'quarantine-storage-failed'
						? 'quarantine-storage-failed'
						: 'conflict-reconcile-failed'
				);
				accountStore.shared.sync.lastResult.set('failed');
			});
	}
	setAccountSyncFutureStateIsolated(
		userId,
		hasPendingJournal ||
			isolatedNamespaces.length > 0 ||
			terminalError === 'sync-schema-update-required'
	);
	if (
		terminalError !== null &&
		conflicts.length === 0 &&
		!hasPendingJournal &&
		isolatedNamespaces.length === 0
	) {
		accountStore.shared.sync.canRetry.set(false);
		accountStore.shared.sync.lastError.set(terminalError);
		accountStore.shared.sync.lastResult.set('failed');
	}
	updatePendingCount(entries);
}

async function resetAccountSyncCloudStateAfterDeleteUnlocked({
	deleteStartedAt,
	generationToken,
	resetOperationId,
	stateEpoch,
	userId,
}: {
	deleteStartedAt?: number;
	generationToken: string;
	resetOperationId: string;
	stateEpoch: number;
	userId: string;
}) {
	const generation = syncClientGeneration;
	if (
		!checkNonNegativeSafeInteger(stateEpoch) ||
		!checkCurrentSyncRun(generation, userId) ||
		!checkAccountSyncOperationOwnedByCurrentTab(userId)
	) {
		return null;
	}

	const currentMeta = readAccountSyncMeta(userId);
	const currentUser = accountStore.shared.user.get();
	const currentMetaHash = createSnapshotHash(currentMeta);
	const currentUserStateEpoch = currentUser?.state_epoch;
	const latestKnownEpoch = Math.max(
		currentMeta?.state_epoch ?? 0,
		currentUser?.id === userId ? currentUser.state_epoch : 0
	);
	if (
		stateEpoch < latestKnownEpoch ||
		(currentMeta?.clearedStateEpoch !== undefined &&
			stateEpoch < currentMeta.clearedStateEpoch)
	) {
		return null;
	}
	const resetNamespaceHashes = new Map<TSyncNamespace, string>();
	const createResetNamespaceHash = (namespace: TSyncNamespace) =>
		createSnapshotHash({
			baseSnapshot: readAccountSyncBaseSnapshot(
				userId,
				namespace,
				undefined,
				getAccountSyncSerializer(namespace)
			),
			dirtyGeneration: createDirtyQueueNamespaceGenerationHash(
				userId,
				namespace
			),
			entry: readDirtyQueueEntry(userId, namespace),
			isIsolated:
				readIsolatedDirtyQueueNamespaces(userId).includes(namespace),
			journal: readAccountSyncConflictResolutionJournal(
				userId,
				namespace
			),
		});

	let converged = false;
	for (let pass = 0; pass < 3 && !converged; pass += 1) {
		resetNamespaceHashes.clear();
		for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
			if (!checkAccountSyncOperationOwnedByCurrentTab(userId)) {
				break;
			}
			const transitionResult =
				await withAccountSyncNamespaceTransitionLock(
					userId,
					namespace,
					() => {
						const resetGeneration =
							readAccountSyncResetGeneration(userId);
						if (
							resetGeneration.status !== 'current' ||
							resetGeneration.marker.phase !== 'prepared' ||
							resetGeneration.marker.operationId !==
								resetOperationId ||
							resetGeneration.marker.state_epoch !== stateEpoch
						) {
							return false;
						}
						const journal =
							readAccountSyncConflictResolutionJournal(
								userId,
								namespace
							);
						const entry = readDirtyQueueEntry(userId, namespace);
						const isIsolated =
							readIsolatedDirtyQueueNamespaces(userId).includes(
								namespace
							) ||
							(journal !== null && journal.status !== 'current');
						if (isIsolated) {
							if (
								entry === null &&
								readDirtyQueueCollisionState(
									userId,
									namespace
								) === null &&
								!writeDirtyQueueNullTombstoneIfCurrent({
									generationToken,
									namespace,
									resetOperationId,
									userId,
								})
							) {
								return false;
							}
							return removeAccountSyncBaseSnapshot(
								userId,
								namespace,
								generationToken,
								resetOperationId
							)
								? createResetNamespaceHash(namespace)
								: false;
						}
						if (entry !== null) {
							const shouldPreserve =
								deleteStartedAt !== undefined &&
								deleteStartedAt > 0 &&
								entry.dirtyAt >= deleteStartedAt;
							const alreadyRebased =
								entry.baseRevision === 0 &&
								entry.conflict === null &&
								entry.lastError === null &&
								entry.paused === null;
							const didRemove =
								!shouldPreserve &&
								removeDirtyQueueEntryIfCurrent({
									expectedEntry: entry,
									generationToken,
									resetOperationId,
									userId,
								});
							if (!didRemove && !alreadyRebased) {
								const latestEntry = readDirtyQueueEntry(
									userId,
									namespace
								);
								if (
									latestEntry !== null &&
									!writeDirtyQueueEntryIfCurrent({
										expectedEntry: latestEntry,
										generationToken,
										nextEntry: {
											...latestEntry,
											attempts: 0,
											baseRevision: 0,
											clientMutationId:
												createAccountClientId(),
											conflict: null,
											lastError: null,
											paused: null,
										},
										resetOperationId,
										userId,
									})
								) {
									return false;
								}
							}
						}
						if (
							readDirtyQueueEntry(userId, namespace) === null &&
							!writeDirtyQueueNullTombstoneIfCurrent({
								generationToken,
								namespace,
								resetOperationId,
								userId,
							})
						) {
							return false;
						}

						if (
							journal?.status === 'current' &&
							!removeAccountSyncConflictResolutionJournal({
								generationToken,
								namespace,
								operationId: journal.journal.operationId,
								resetOperationId,
								userId,
							})
						) {
							return false;
						}
						if (
							!removeAccountSyncBaseSnapshot(
								userId,
								namespace,
								generationToken,
								resetOperationId
							)
						) {
							return false;
						}
						return createResetNamespaceHash(namespace);
					}
				);
			if (typeof transitionResult !== 'string') {
				break;
			}
			resetNamespaceHashes.set(namespace, transitionResult);
		}
		converged =
			resetNamespaceHashes.size ===
				Object.values(SYNC_NAMESPACE_MAP).length &&
			[...resetNamespaceHashes].every(
				([namespace, expectedHash]) =>
					createResetNamespaceHash(namespace) === expectedHash
			);
	}
	if (!converged) {
		return null;
	}
	const latestUser = accountStore.shared.user.get();
	if (
		!checkCurrentSyncRun(generation, userId) ||
		!checkAccountSyncOperationOwnedByCurrentTab(userId) ||
		latestUser?.state_epoch !== currentUserStateEpoch ||
		createSnapshotHash(readAccountSyncMeta(userId)) !== currentMetaHash
	) {
		return null;
	}
	writeAccountSyncMeta(
		userId,
		{
			clearedStateEpoch: stateEpoch,
			lastAppliedRemoteHash: {},
			revisions: {},
			state_epoch: stateEpoch,
		},
		{ generationToken, resetOperationId, suppressRuntime: true }
	);
	const prepared = readAccountSyncResetGeneration(userId);
	const committedGenerationToken =
		prepared.status === 'current' &&
		prepared.marker.operationId === resetOperationId
			? commitAccountSyncResetGeneration({
					expectedRaw: prepared.raw,
					marker: prepared.marker,
				})
			: false;
	if (
		typeof committedGenerationToken !== 'string' ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: committedGenerationToken,
			userId,
		})
	) {
		return null;
	}
	const hasPendingEntries = readDirtyQueueEntries(userId).length > 0;
	if (!checkCurrentAccountUser(userId)) {
		return hasPendingEntries;
	}
	setCurrentAccountUserStateEpoch(userId, stateEpoch);
	restoreAccountSyncRuntimeState(userId);

	return hasPendingEntries;
}

export async function resetAccountSyncCloudStateAfterDelete({
	deleteStartedAt,
	operationId = createAccountClientId(),
	stateEpoch,
	userId,
}: {
	deleteStartedAt?: number;
	operationId?: string;
	stateEpoch: number;
	userId: string;
}): Promise<boolean | null> {
	if (!checkAccountSyncOperationOwnedByCurrentTab(userId)) {
		const leasedResult: boolean | null =
			await withAccountSyncOperationLease(userId, 'delete-data', () =>
				resetAccountSyncCloudStateAfterDelete({
					...(deleteStartedAt === undefined
						? {}
						: { deleteStartedAt }),
					operationId,
					stateEpoch,
					userId,
				})
			);
		return leasedResult ?? null;
	}
	const result = await withAccountSyncResetGenerationLock(
		userId,
		async () => {
			const current = readAccountSyncResetGeneration(userId);
			if (
				current.status === 'current' &&
				current.marker.phase === 'committed' &&
				current.marker.state_epoch >= stateEpoch
			) {
				const hasPendingEntries =
					readDirtyQueueEntries(userId).length > 0;
				if (checkCurrentAccountUser(userId)) {
					setCurrentAccountUserStateEpoch(
						userId,
						current.marker.state_epoch
					);
					restoreAccountSyncRuntimeState(userId);
				}
				return hasPendingEntries;
			}
			const effectiveOperationId =
				current.status === 'current' &&
				current.marker.phase === 'prepared' &&
				current.marker.state_epoch === stateEpoch
					? current.marker.operationId
					: operationId;
			const marker = prepareAccountSyncResetGeneration({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				operationId: effectiveOperationId,
				stateEpoch,
				userId,
			});
			if (marker?.phase !== 'prepared') {
				return null;
			}
			const preparedGeneration = readAccountSyncResetGeneration(userId);
			if (
				preparedGeneration.status !== 'current' ||
				preparedGeneration.marker.operationId !== marker.operationId ||
				preparedGeneration.marker.phase !== 'prepared'
			) {
				return null;
			}
			return resetAccountSyncCloudStateAfterDeleteUnlocked({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				generationToken: preparedGeneration.raw,
				resetOperationId: marker.operationId,
				stateEpoch,
				userId,
			});
		}
	);
	return result ?? null;
}

function pauseDirtyEntriesAfterRemoteClear({
	generationToken,
	stateEpoch,
	userId,
}: {
	generationToken: string | null;
	stateEpoch: number;
	userId: string;
}) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const dirtyEntries = readMigratedDirtyQueueEntries(userId, generationToken);
	if (dirtyEntries.length === 0) {
		return false;
	}

	writeAccountSyncMeta(
		userId,
		{
			clearedStateEpoch: stateEpoch,
			lastAppliedRemoteHash: {},
			revisions: {},
			state_epoch: stateEpoch,
		},
		{ generationToken }
	);
	for (const entry of dirtyEntries) {
		const { conflict } = mergeConflictFromDirtyEntry({
			entry,
			record: null,
			userId,
		});
		pauseDirtyEntryWithConflict({
			conflict,
			entry,
			generationToken,
			userId,
		});
	}
	accountStore.shared.sync.lastError.set('conflict');
	updatePendingCount();
	setCurrentAccountUserStateEpoch(userId, stateEpoch);

	return true;
}

async function handleSuccessfulUpload({
	entry,
	generationToken,
	revision,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	revision: number;
	stateEpoch: number;
	userId: string;
}) {
	if (
		!checkRemoteRevision(revision) ||
		!checkNonNegativeSafeInteger(stateEpoch)
	) {
		throw new Error('invalid-sync-result');
	}

	const result = await withAccountSyncMetaTransitionLock(
		userId,
		generationToken,
		() => {
			const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
			if (
				!checkCurrentAccountUser(userId) ||
				currentEntry === null ||
				!checkSnapshotHashesEquivalent(currentEntry, entry) ||
				!checkAccountSyncResetWriteAllowed({
					expectedGeneration: generationToken,
					userId,
				})
			) {
				return false;
			}

			const meta = readAccountSyncMeta(userId) ?? {
				lastAppliedRemoteHash: {},
				revisions: {},
				state_epoch: stateEpoch,
			};
			meta.lastAppliedRemoteHash[entry.namespace] = createSnapshotHash(
				entry.data
			);
			meta.revisions[entry.namespace] = revision;
			meta.state_epoch = stateEpoch;
			writeAccountSyncMeta(userId, meta, { generationToken });
			writeAccountSyncBaseSnapshot({
				data: entry.data,
				generationToken,
				namespace: entry.namespace,
				revision,
				userId,
			});
			const completion = completeDirtyQueueEntryUpload({
				entry,
				generationToken,
				nextBaseRevision: revision,
				userId,
			});
			return checkCurrentAccountUser(userId) &&
				checkAccountSyncResetWriteAllowed({
					expectedGeneration: generationToken,
					userId,
				})
				? completion
				: false;
		}
	);
	if (result === false || result === null) {
		return false;
	}
	restoreAccountSyncRuntimeState(userId);
	return true;
}

async function handleConflictUpload({
	entry,
	generationToken,
	result,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	result: ISyncStateItemConflict;
	stateEpoch: number;
	userId: string;
}) {
	if (checkSnapshotHashMatches(result.data, entry.snapshotHash)) {
		const didConfirm = await handleSuccessfulUpload({
			entry,
			generationToken,
			revision: result.revision,
			stateEpoch,
			userId,
		});
		return didConfirm ? ('confirmed' as const) : ('stale' as const);
	}

	const merged = mergeConflictFromDirtyEntry({
		entry,
		record:
			result.data === null
				? null
				: {
						data: result.data,
						namespace: result.namespace,
						revision: result.revision,
						schema_version: result.schema_version,
						updated_at: result.updated_at,
					},
		userId,
	});
	const canResolveAutomatically = checkSyncMergeCanApplyAutomatically(
		merged.mergeResult,
		merged.cloud
	);
	const didRoute = routePausedConflictMergeResult({
		cloud: merged.cloud,
		entry,
		generationToken,
		local: merged.conflict.local,
		mergeResult: merged.mergeResult,
		record:
			result.data === null
				? undefined
				: {
						data: result.data,
						namespace: result.namespace,
						revision: result.revision,
						schema_version: result.schema_version,
						updated_at: result.updated_at,
					},
		userId,
	});

	if (!didRoute) {
		return 'stale' as const;
	}

	return canResolveAutomatically
		? ('auto-resolving' as const)
		: ('paused' as const);
}

function createFlushResultMap({
	entries,
	results,
}: {
	entries: IDirtyQueueEntry[];
	results: TSyncStatePutResult[];
}) {
	const entryNamespaceSet = new Set(entries.map((entry) => entry.namespace));
	const resultMap = new Map<TSyncNamespace, TSyncStatePutResult>();

	for (const result of results) {
		if (
			!entryNamespaceSet.has(result.namespace) ||
			resultMap.has(result.namespace)
		) {
			return null;
		}

		resultMap.set(result.namespace, result);
	}

	return resultMap.size === entryNamespaceSet.size ? resultMap : null;
}

function checkSyncCapacityError(
	result: TSyncStatePutResult
): result is ISyncStateItemCapacityError {
	return (
		result.status === 'error' &&
		result.message === 'sync-account-capacity-exceeded'
	);
}

async function requestSyncEntryBatch({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}) {
	return validateSyncPutResponse(
		await putSyncState(
			{
				changes: entries.map((entry) => ({
					data: entry.data,
					namespace: entry.namespace,
					revision: entry.baseRevision,
					schema_version: entry.schema_version,
				})),
				state_epoch: stateEpoch,
			},
			csrfToken
		)
	);
}

async function requestSyncEntriesWithRequestLimitSplit({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}): Promise<ISyncStatePutResponse> {
	try {
		return await requestSyncEntryBatch({ csrfToken, entries, stateEpoch });
	} catch (error) {
		if (!(error instanceof AccountApiError) || error.status !== 413) {
			throw error;
		}
		const [entry] = entries;
		if (entry !== undefined && entries.length === 1) {
			return {
				results: [
					{
						message: 'sync-request-too-large',
						namespace: entry.namespace,
						status: 'error',
					},
				],
				state_epoch: stateEpoch,
			};
		}
	}

	const results: TSyncStatePutResult[] = [];
	let responseStateEpoch = stateEpoch;
	for (const entry of entries) {
		try {
			const response = await requestSyncEntryBatch({
				csrfToken,
				entries: [entry],
				stateEpoch,
			});
			responseStateEpoch = response.state_epoch;
			const [result] = response.results;
			if (result === undefined || response.results.length !== 1) {
				throw new Error('invalid-sync-result');
			}
			results.push(result);
		} catch (error) {
			if (error instanceof AccountApiError && error.status === 413) {
				results.push({
					message: 'sync-request-too-large',
					namespace: entry.namespace,
					status: 'error',
				});
				continue;
			}
			throw error;
		}
	}

	return { results, state_epoch: responseStateEpoch };
}

async function requestSyncEntriesWithCapacityRetry({
	csrfToken,
	entries,
	stateEpoch,
}: {
	csrfToken: string;
	entries: IDirtyQueueEntry[];
	stateEpoch: number;
}) {
	const initialResponse = await requestSyncEntriesWithRequestLimitSplit({
		csrfToken,
		entries,
		stateEpoch,
	});
	const initialMap = createFlushResultMap({
		entries,
		results: initialResponse.results,
	});
	if (initialMap === null) {
		throw new Error('invalid-sync-result');
	}
	const shrinkEntries = entries.filter((entry) => {
		const result = initialMap.get(entry.namespace);
		return (
			result !== undefined &&
			checkSyncCapacityError(result) &&
			result.candidate_namespace_bytes < result.current_namespace_bytes
		);
	});
	if (shrinkEntries.length === 0) {
		return initialResponse;
	}

	const finalMap = new Map(initialMap);
	const shrinkResponse = await requestSyncEntriesWithRequestLimitSplit({
		csrfToken,
		entries: shrinkEntries,
		stateEpoch,
	});
	const shrinkMap = createFlushResultMap({
		entries: shrinkEntries,
		results: shrinkResponse.results,
	});
	if (shrinkMap === null) {
		throw new Error('invalid-sync-result');
	}
	shrinkMap.forEach((result, namespace) => {
		finalMap.set(namespace, result);
	});
	const didShrink = [...shrinkMap.values()].some(
		(result) => result.status === 'ok'
	);
	const remainingEntries = entries.filter((entry) => {
		const result = initialMap.get(entry.namespace);
		return (
			result !== undefined &&
			checkSyncCapacityError(result) &&
			!shrinkMap.has(entry.namespace)
		);
	});
	let responseStateEpoch = shrinkResponse.state_epoch;
	if (didShrink && remainingEntries.length > 0) {
		const remainingResponse = await requestSyncEntriesWithRequestLimitSplit(
			{ csrfToken, entries: remainingEntries, stateEpoch }
		);
		const remainingMap = createFlushResultMap({
			entries: remainingEntries,
			results: remainingResponse.results,
		});
		if (remainingMap === null) {
			throw new Error('invalid-sync-result');
		}
		remainingMap.forEach((result, namespace) => {
			finalMap.set(namespace, result);
		});
		responseStateEpoch = remainingResponse.state_epoch;
	}

	return {
		results: entries.map((entry) => {
			const result = finalMap.get(entry.namespace);
			if (result === undefined) {
				throw new Error('invalid-sync-result');
			}
			return result;
		}),
		state_epoch: responseStateEpoch,
	} satisfies ISyncStatePutResponse;
}

async function handleStateEpochMismatch(
	userId: string,
	generation: number,
	shouldBroadcast = true
) {
	const generationToken = captureAccountSyncResetGeneration(userId);
	const remoteState = await fetchSyncStateForCurrentUser(userId, generation);
	if (remoteState === null) {
		return false;
	}
	if (
		!checkCurrentSyncRun(generation, userId) ||
		!checkRemoteStateFresh(userId, remoteState.state_epoch)
	) {
		return false;
	}
	if (
		checkRemoteStateCleared({
			records: remoteState.records,
			stateEpoch: remoteState.state_epoch,
			userId,
		})
	) {
		const pausedAfterClear = await withAccountSyncMetaTransitionLock(
			userId,
			generationToken,
			() => {
				if (
					!checkCurrentSyncRun(generation, userId) ||
					!checkRemoteStateFresh(userId, remoteState.state_epoch)
				) {
					return null;
				}
				return pauseDirtyEntriesAfterRemoteClear({
					generationToken,
					stateEpoch: remoteState.state_epoch,
					userId,
				});
			}
		);
		if (pausedAfterClear === null) {
			return false;
		}
		if (!pausedAfterClear) {
			const resetResult = await resetAccountSyncCloudStateAfterDelete({
				stateEpoch: remoteState.state_epoch,
				userId,
			});
			if (resetResult === null) {
				return false;
			}
		}
		setCurrentAccountUserStateEpoch(userId, remoteState.state_epoch);
		return true;
	}

	const recordsToApply = await applyRemoteStatePreservingDirty({
		generationToken,
		records: remoteState.records,
		stateEpoch: remoteState.state_epoch,
		userId,
	});
	if (recordsToApply === null) {
		return false;
	}
	if (shouldBroadcast) {
		postRemoteAppliedBroadcast({
			records: recordsToApply,
			stateEpoch: remoteState.state_epoch,
			userId,
		});
	}

	setCurrentAccountUserStateEpoch(userId, remoteState.state_epoch);

	return true;
}

export async function flushAccountSyncQueue() {
	const generation = syncClientGeneration;
	const context = getLoggedInAccountContext();
	if (context === null) {
		return true;
	}
	if (checkAccountSyncResetPrepared(context.user.id)) {
		return false;
	}
	const entryGenerationToken = captureAccountSyncResetGeneration(
		context.user.id
	);

	const allEntries = readMigratedDirtyQueueEntries(
		context.user.id,
		entryGenerationToken
	);
	let entries = allEntries.filter(
		(entry) =>
			entry.paused === null &&
			!readIsolatedDirtyQueueNamespaces(context.user.id).includes(
				entry.namespace
			) &&
			!checkDirtyQueueEntryTerminalError(entry)
	);
	updatePendingCount(allEntries);
	if (entries.length === 0) {
		clearSyncTimers();
		return allEntries.length === 0;
	}
	if (
		checkAccountSyncPaused() ||
		checkAccountSyncOperationActive(context.user.id)
	) {
		return false;
	}

	const flushRunId = createAccountClientId();
	if (activeFlushRun !== null) {
		if (
			activeFlushRun.generation === generation &&
			activeFlushRun.userId === context.user.id
		) {
			void activeFlushRun.promise.then((isFlushed) => {
				if (
					checkCurrentSyncRun(generation, context.user.id) &&
					(!isFlushed ||
						getFlushableEntries(
							context.user.id,
							entryGenerationToken
						).length > 0)
				) {
					// eslint-disable-next-line @typescript-eslint/no-use-before-define
					scheduleAccountSyncFlush();
				}
			});

			return activeFlushRun.promise;
		}

		activeFlushRun = null;
	}

	const flushPromise = (async () => {
		let didAcquireLease = false;
		let retryAfterFlushDelay = LEASE_BUSY_RETRY_DELAY;
		let shouldScheduleRetryAfterFlush = false;
		let shouldCheckLeaseBeforeWrite = false;

		try {
			const operationGenerationToken = entryGenerationToken;
			const leaseResult = await acquireAccountSyncLease(
				context.user.id,
				tabId,
				flushRunId
			);
			if (!leaseResult.acquired) {
				shouldScheduleRetryAfterFlush = true;
				return false;
			}
			didAcquireLease = true;
			shouldCheckLeaseBeforeWrite = !checkCrossTabNativeLockSupported();

			if (!checkCurrentSyncRun(generation, context.user.id)) {
				return false;
			}

			clearSyncTimers();
			startLeaseRenewal(context.user.id, generation, flushRunId);
			if (shouldCheckLeaseBeforeWrite) {
				const lease = readAccountSyncLease(context.user.id);
				if (
					lease === null ||
					lease.expiresAt <= Date.now() ||
					lease.ownerTabId !== tabId ||
					lease.ownerRunId !== flushRunId
				) {
					shouldScheduleRetryAfterFlush = true;
					return false;
				}
			}
			accountStore.shared.sync.isSyncing.set(true);
			const checkFlushTerminalPreflight = (
				entriesToCheck: IDirtyQueueEntry[] = entries
			) => {
				const lease = readAccountSyncLease(context.user.id);
				return (
					checkCurrentSyncRun(generation, context.user.id) &&
					!checkAccountSyncOperationActive(context.user.id) &&
					checkAccountSyncResetWriteAllowed({
						expectedGeneration: operationGenerationToken,
						userId: context.user.id,
					}) &&
					lease !== null &&
					lease.expiresAt > Date.now() &&
					lease.ownerTabId === tabId &&
					lease.ownerRunId === flushRunId &&
					checkFlushEntriesStillCurrent(
						context.user.id,
						entriesToCheck
					)
				);
			};
			entries = getFlushableEntries(
				context.user.id,
				operationGenerationToken
			);
			if (entries.length === 0) {
				return false;
			}
			if (!checkFlushTerminalPreflight()) {
				shouldScheduleRetryAfterFlush =
					getFlushableEntries(
						context.user.id,
						operationGenerationToken
					).length > 0;
				return false;
			}

			const response = await requestSyncEntriesWithCapacityRetry({
				csrfToken: context.csrfToken,
				entries,
				stateEpoch: context.user.state_epoch,
			});
			if (!checkFlushTerminalPreflight()) {
				return false;
			}
			const currentUser = accountStore.shared.user.get();
			if (
				currentUser?.id !== context.user.id ||
				response.state_epoch < currentUser.state_epoch
			) {
				return false;
			}

			const resultMap = createFlushResultMap({
				entries,
				results: response.results,
			});
			if (resultMap === null) {
				throw new Error('invalid-sync-result');
			}

			let unresolvedReason: string | null = null;
			const uploadedNamespaces: TSyncNamespace[] = [];
			const checkAfterFlushHandler = (
				remainingEntries: IDirtyQueueEntry[]
			) => {
				if (checkFlushTerminalPreflight(remainingEntries)) {
					return true;
				}
				restoreAccountSyncRuntimeState(context.user.id);
				shouldScheduleRetryAfterFlush = true;
				return false;
			};
			for (const [entryIndex, entry] of entries.entries()) {
				const remainingEntries = entries.slice(entryIndex + 1);
				if (!checkFlushTerminalPreflight(entries.slice(entryIndex))) {
					restoreAccountSyncRuntimeState(context.user.id);
					return false;
				}
				const result = resultMap.get(entry.namespace);
				if (result === undefined) {
					throw new Error('invalid-sync-result');
				}
				if (result.status === 'ok') {
					const didHandle = await handleSuccessfulUpload({
						entry,
						generationToken: operationGenerationToken,
						revision: result.revision,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					if (!didHandle) {
						shouldScheduleRetryAfterFlush = true;
						return false;
					}
					if (!checkAfterFlushHandler(remainingEntries)) {
						return false;
					}
					uploadedNamespaces.push(result.namespace);
					continue;
				}
				if (result.status === 'conflict') {
					const conflictResult = await handleConflictUpload({
						entry,
						generationToken: operationGenerationToken,
						result,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					if (!checkAfterFlushHandler(remainingEntries)) {
						return false;
					}
					if (conflictResult === 'confirmed') {
						uploadedNamespaces.push(result.namespace);
						continue;
					}
					if (conflictResult === 'auto-resolving') {
						continue;
					}
					if (conflictResult === 'stale') {
						shouldScheduleRetryAfterFlush = true;
					}
					unresolvedReason = 'conflict';
					continue;
				}
				if (result.message === 'sync-schema-update-required') {
					setAccountSyncFutureStateIsolated(context.user.id, true);
					accountStore.shared.sync.canRetry.set(false);
				}

				setDirtyQueueEntryError({
					entry,
					generationToken: operationGenerationToken,
					message: result.message,
					userId: context.user.id,
				});
				unresolvedReason ??= result.message;
				if (!checkAfterFlushHandler(remainingEntries)) {
					return false;
				}
			}
			if (!checkAfterFlushHandler([])) {
				return false;
			}
			setCurrentAccountUserStateEpoch(
				context.user.id,
				response.state_epoch
			);

			recordAccountSyncRefreshSuccess({
				unresolvedReason,
				userId: context.user.id,
			});
			if (uploadedNamespaces.length > 0) {
				void postAccountSyncBroadcastMessage({
					namespaces: uploadedNamespaces,
					operationId: createAccountClientId(),
					state_epoch: response.state_epoch,
					tabId,
					type: 'uploaded',
					userId: context.user.id,
				});
			}

			return unresolvedReason === null;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message === 'sync-client-update-required' &&
				checkCurrentSyncRun(generation, context.user.id)
			) {
				setAccountSyncFutureStateIsolated(context.user.id, true);
				accountStore.shared.sync.canRetry.set(false);
				accountStore.shared.sync.lastResult.set('failed');
				return false;
			}
			if (error instanceof AccountApiError && error.status === 429) {
				if (!checkCurrentSyncRun(generation, context.user.id)) {
					return false;
				}

				shouldScheduleRetryAfterFlush =
					getFlushableEntries(context.user.id, entryGenerationToken)
						.length > 0;
				retryAfterFlushDelay =
					getRateLimitRetryDelay(error) ?? retryAfterFlushDelay;
				accountStore.shared.sync.canRetry.set(false);
				accountStore.shared.sync.lastError.set(error.message);
				accountStore.shared.sync.lastResult.set('failed');
				return false;
			}
			if (error instanceof AccountApiError && error.status === 401) {
				if (checkCurrentSyncRun(generation, context.user.id)) {
					stopAccountSyncClient();
					resetExpiredAccountSession();
				}
				return false;
			}
			if (error instanceof AccountApiError && error.status === 403) {
				if (checkCurrentSyncRun(generation, context.user.id)) {
					handleForbiddenSyncError(error);
				}
				return false;
			}
			if (
				error instanceof Error &&
				error.message === 'state-epoch-mismatch'
			) {
				try {
					const didRefresh = await handleStateEpochMismatch(
						context.user.id,
						generation
					);
					if (
						!didRefresh ||
						!checkCurrentSyncRun(generation, context.user.id)
					) {
						return false;
					}

					shouldScheduleRetryAfterFlush =
						getFlushableEntries(
							context.user.id,
							entryGenerationToken
						).length > 0;
					accountStore.shared.sync.canRetry.set(false);
					accountStore.shared.sync.failedAttempts.set(0);
					accountStore.shared.sync.lastError.set(
						accountStore.shared.sync.conflicts.get().length > 0
							? 'conflict'
							: null
					);
					accountStore.shared.sync.lastResult.set('partial');
					return false;
				} catch (refreshError) {
					if (!checkCurrentSyncRun(generation, context.user.id)) {
						return false;
					}
					if (
						refreshError instanceof AccountApiError &&
						refreshError.status === 429
					) {
						shouldScheduleRetryAfterFlush =
							getFlushableEntries(
								context.user.id,
								entryGenerationToken
							).length > 0;
						retryAfterFlushDelay =
							getRateLimitRetryDelay(refreshError) ??
							retryAfterFlushDelay;
						accountStore.shared.sync.canRetry.set(false);
						accountStore.shared.sync.lastError.set(
							refreshError.message
						);
						accountStore.shared.sync.lastResult.set('failed');
						return false;
					}

					accountStore.shared.sync.lastError.set(
						refreshError instanceof Error
							? refreshError.message
							: 'sync-refresh-failed'
					);
					accountStore.shared.sync.lastResult.set('failed');
					return false;
				}
			}
			if (!checkCurrentSyncRun(generation, context.user.id)) {
				return false;
			}

			accountStore.shared.sync.canRetry.set(true);
			accountStore.shared.sync.failedAttempts.set(
				(attempts) => attempts + 1
			);
			accountStore.shared.sync.lastError.set(
				error instanceof Error ? error.message : 'sync-failed'
			);
			accountStore.shared.sync.lastResult.set('failed');
			return false;
		} finally {
			const isCurrentRun = checkCurrentSyncRun(
				generation,
				context.user.id
			);
			if (isCurrentRun) {
				accountStore.shared.sync.isSyncing.set(false);
				updatePendingCount();
			}
			if (didAcquireLease) {
				stopLeaseRenewal(generation);
				try {
					await releaseAccountSyncLease(
						context.user.id,
						tabId,
						flushRunId
					);
				} catch (error) {
					console.warn(
						'Failed to release account sync lease.',
						error
					);
				}
			}
			clearActiveFlushRun({
				generation,
				runId: flushRunId,
				userId: context.user.id,
			});
			if (didAcquireLease && isCurrentRun) {
				void postAccountSyncBroadcastMessage({
					namespaces: [],
					operationId: createAccountClientId(),
					state_epoch: context.user.state_epoch,
					tabId,
					type: 'lease-changed',
					userId: context.user.id,
				});
			}
			if (isCurrentRun && shouldScheduleRetryAfterFlush) {
				scheduleAccountSyncFlushAfter(retryAfterFlushDelay, () => {
					void flushAccountSyncQueue();
				});
			}
		}
	})();
	activeFlushRun = {
		generation,
		promise: flushPromise,
		runId: flushRunId,
		userId: context.user.id,
	};
	return flushPromise;
}

export function scheduleAccountSyncFlush() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return;
	}

	// Synchronous scheduler boundary; migrations use this one captured token.
	const generationToken = captureAccountSyncResetGeneration(context.user.id);
	const allEntries = readMigratedDirtyQueueEntries(
		context.user.id,
		generationToken
	);
	const entries = allEntries.filter(
		(entry) =>
			entry.paused === null && !checkDirtyQueueEntryTerminalError(entry)
	);
	updatePendingCount(allEntries);

	if (entries.length === 0) {
		clearSyncTimers();
		return;
	}
	if (checkAccountSyncPaused()) {
		return;
	}

	if (entries.length >= DIRTY_COUNT_FLUSH_THRESHOLD) {
		void flushAccountSyncQueue();
		return;
	}

	quietFlushTimer ??= setTimeout(() => {
		quietFlushTimer = null;
		void flushAccountSyncQueue();
	}, QUIET_FLUSH_DELAY);
	forceFlushTimer ??= setTimeout(() => {
		forceFlushTimer = null;
		void flushAccountSyncQueue();
	}, FORCE_FLUSH_DELAY);
}

export async function flushAccountSyncQueueUntilIdle() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return true;
	}
	const generationToken = captureAccountSyncResetGeneration(context.user.id);

	for (let pass = 0; pass < EXPLICIT_FLUSH_MAX_PASSES; pass += 1) {
		if (!checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const isFlushed = await flushAccountSyncQueue();
		if (!isFlushed || !checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const entries = readMigratedDirtyQueueEntries(
			context.user.id,
			generationToken
		);
		updatePendingCount(entries);
		if (entries.length === 0) {
			clearSyncTimers();
			return true;
		}
	}

	scheduleAccountSyncFlush();

	return false;
}

export function retryAccountSyncQueue() {
	const context = getLoggedInAccountContext();
	if (context !== null) {
		if (checkAccountSyncResetPrepared(context.user.id)) {
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			scheduleAccountSyncResetRecovery(
				context.user.id,
				undefined,
				undefined,
				true
			);
			accountStore.shared.sync.canRetry.set(false);
			return Promise.resolve(false);
		}
		clearTerminalDirtyQueueEntryErrors(context.user.id);
	}
	return flushAccountSyncQueue();
}

export async function takeOverLocalAccountData(
	resetOperationId?: string,
	deleteStartedAt?: number
): Promise<boolean> {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return false;
	}
	let generationToken = captureAccountSyncResetGeneration(context.user.id);
	const resetGeneration = readAccountSyncResetGeneration(context.user.id);
	if (
		resetGeneration.status === 'current' &&
		resetGeneration.marker.phase === 'deleted'
	) {
		if (context.user.state_epoch <= resetGeneration.marker.state_epoch) {
			return false;
		}
		if (!checkAccountSyncOperationOwnedByCurrentTab(context.user.id)) {
			const recovered = await withAccountSyncOperationLease(
				context.user.id,
				'delete-data',
				(leaseOperationId) =>
					takeOverLocalAccountData(
						resetOperationId ?? leaseOperationId,
						deleteStartedAt
					)
			);
			return recovered === true;
		}
		const prepared = await withAccountSyncResetGenerationLock(
			context.user.id,
			() =>
				prepareAccountSyncResetGeneration({
					accountRestorationStateEpoch: context.user.state_epoch,
					operationId: resetOperationId ?? createAccountClientId(),
					stateEpoch: context.user.state_epoch,
					userId: context.user.id,
				})
		);
		if (prepared?.phase !== 'prepared') {
			return false;
		}
		const preparedGeneration = readAccountSyncResetGeneration(
			context.user.id
		);
		if (
			preparedGeneration.status !== 'current' ||
			preparedGeneration.marker.phase !== 'prepared' ||
			preparedGeneration.marker.operationId !== prepared.operationId ||
			preparedGeneration.marker.restoredFromStateEpoch === undefined
		) {
			return false;
		}
		generationToken = preparedGeneration.raw;
	}
	if (
		checkAccountSyncResetPrepared(context.user.id) &&
		!checkAccountSyncOperationOwnedByCurrentTab(context.user.id)
	) {
		const recovered = await withAccountSyncOperationLease(
			context.user.id,
			'delete-data',
			(leaseOperationId) =>
				takeOverLocalAccountData(
					resetOperationId ?? leaseOperationId,
					deleteStartedAt
				)
		);
		return recovered === true;
	}

	const remoteState = await fetchSyncStateForCurrentUser(context.user.id);
	if (remoteState === null) {
		return false;
	}
	if (
		!checkCurrentAccountUser(context.user.id) ||
		!checkRemoteStateFresh(context.user.id, remoteState.state_epoch)
	) {
		return false;
	}
	const remoteResetGeneration = readAccountSyncResetGeneration(
		context.user.id
	);
	const shouldSupersedePreparedReset =
		remoteResetGeneration.status === 'current' &&
		remoteResetGeneration.marker.phase === 'prepared' &&
		remoteState.state_epoch >= remoteResetGeneration.marker.state_epoch;
	let didRestoreAccount = false;
	let shouldResumePreparedReset = false;
	if (shouldSupersedePreparedReset) {
		const preparedMarker = remoteResetGeneration.marker;
		const isAccountRestoration =
			preparedMarker.restoredFromStateEpoch !== undefined &&
			preparedMarker.restoredFromStateEpoch <
				preparedMarker.state_epoch &&
			preparedMarker.state_epoch === context.user.state_epoch &&
			remoteState.state_epoch === context.user.state_epoch;
		if (isAccountRestoration) {
			const resetResult = await resetAccountSyncCloudStateAfterDelete({
				operationId: preparedMarker.operationId,
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			});
			if (resetResult === null) {
				return false;
			}
			generationToken = captureAccountSyncResetGeneration(
				context.user.id
			);
			didRestoreAccount = true;
		} else if (remoteState.state_epoch === preparedMarker.state_epoch) {
			if (remoteState.records.length > 0) {
				return false;
			}
			shouldResumePreparedReset = true;
		} else {
			const committedGenerationToken =
				await withAccountSyncResetGenerationLock(context.user.id, () =>
					commitAccountSyncResetGeneration({
						expectedRaw: remoteResetGeneration.raw,
						marker: preparedMarker,
					})
				);
			if (typeof committedGenerationToken !== 'string') {
				return false;
			}
			generationToken = committedGenerationToken;
		}
		if (
			!checkCurrentAccountUser(context.user.id) ||
			!checkRemoteStateFresh(context.user.id, remoteState.state_epoch)
		) {
			return false;
		}
		if (
			!shouldResumePreparedReset &&
			!checkAccountSyncResetWriteAllowed({
				expectedGeneration: generationToken,
				userId: context.user.id,
			})
		) {
			return false;
		}
	}
	if (
		!didRestoreAccount &&
		(shouldResumePreparedReset ||
			checkRemoteStateCleared({
				records: remoteState.records,
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			}))
	) {
		const shouldFlushPreservedDirty =
			await resetAccountSyncCloudStateAfterDelete({
				...(deleteStartedAt === undefined ? {} : { deleteStartedAt }),
				...(resetOperationId === undefined
					? {}
					: { operationId: resetOperationId }),
				stateEpoch: remoteState.state_epoch,
				userId: context.user.id,
			});
		if (shouldFlushPreservedDirty === null) {
			return false;
		}
		if (shouldFlushPreservedDirty) {
			scheduleAccountSyncFlush();
		}
		recordAccountSyncRefreshSuccess({ userId: context.user.id });

		return true;
	}
	const recordMap = getRecordMap(remoteState.records);
	const dirtyNamespaceSet = new Set<TSyncNamespace>();
	const dirtyRemoteRecords: ISyncStateRecord[] = [];
	const recordsToApply: ISyncStateRecord[] = [];

	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		const deferredAutoResolutions: Array<() => void> = [];
		const lockResult = await withAccountSyncNamespaceTransitionLock(
			context.user.id,
			namespace,
			() => {
				if (!checkCurrentAccountUser(context.user.id)) {
					return false;
				}
				const dirtyEntry = readDirtyQueueEntry(
					context.user.id,
					namespace
				);
				if (dirtyEntry !== null) {
					dirtyNamespaceSet.add(namespace);
				}
				const storedConflict = dirtyEntry?.conflict ?? null;
				const pausedDirtyEntry =
					dirtyEntry?.paused === 'conflict' && storedConflict !== null
						? dirtyEntry
						: null;
				if (dirtyNamespaceSet.has(namespace)) {
					if (pausedDirtyEntry !== null && storedConflict !== null) {
						const serializer = getAccountSyncSerializer(namespace);
						const record = recordMap[namespace];
						const currentCloud =
							record === undefined
								? serializer.getDefaultSnapshot()
								: serializer.migrate(
										record.data,
										record.schema_version
									);
						const storedCloud = serializer.deserialize(
							storedConflict.cloud
						);
						if (
							storedConflict.revision ===
								(record?.revision ?? 0) &&
							checkSnapshotEqual(storedCloud, currentCloud)
						) {
							const restoredConflict = restoreAccountSyncConflict(
								storedConflict,
								context.user.id
							);
							if (restoredConflict !== null) {
								setAccountSyncConflict(restoredConflict);
							}
							return true;
						}
					} else {
						return true;
					}
				}

				const serializer = getAccountSyncSerializer(namespace);
				const local = serializer.deserialize(
					serializer.getLocalSnapshot()
				);
				const record = recordMap[namespace];
				const cloud =
					record === undefined
						? null
						: serializer.migrate(
								record.data,
								record.schema_version
							);
				const storedBase =
					dirtyEntry === null
						? null
						: readAccountSyncBaseSnapshot(
								context.user.id,
								namespace,
								dirtyEntry.baseRevision,
								serializer
							);
				const base = storedBase?.data ?? null;
				const mergeResult = serializer.merge({
					allowBaseNullAutoMerge: dirtyEntry === null,
					base,
					cloud,
					local,
					namespace,
				});
				if (pausedDirtyEntry !== null) {
					const didRoute = routePausedConflictMergeResult({
						cloud: cloud ?? serializer.getDefaultSnapshot(),
						deferredAutoResolutions,
						entry: pausedDirtyEntry,
						generationToken,
						local,
						mergeResult,
						record,
						userId: context.user.id,
					});
					return didRoute;
				}

				if (!checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
					const now = Date.now();
					const conflict =
						mergeResult.conflict === null
							? {
									cloud:
										cloud ??
										serializer.getDefaultSnapshot(),
									local,
									merged: mergeResult.data,
									namespace,
									revision: record?.revision ?? 0,
									userId: context.user.id,
								}
							: {
									...mergeResult.conflict,
									revision: record?.revision ?? 0,
									userId: context.user.id,
								};
					pauseDirtyEntryWithConflict({
						allowMissing: true,
						conflict,
						entry: {
							attempts: 0,
							baseRevision: conflict.revision,
							clientMutationId: createAccountClientId(),
							conflict,
							data: conflict.local,
							dirtyAt: now,
							lastError: 'conflict',
							namespace,
							paused: 'conflict',
							schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
							snapshotHash: createSnapshotHash(conflict.local),
						},
						generationToken,
						userId: context.user.id,
					});
					return true;
				}

				if (mergeResult.shouldUpload) {
					const markedEntry = markAccountSyncDirty({
						baseRevision: record?.revision ?? 0,
						data: mergeResult.data,
						generationToken,
						namespace,
						userId: context.user.id,
					});
					if (markedEntry?.paused !== null) {
						return false;
					}
					dirtyNamespaceSet.add(namespace);
					if (record !== undefined) {
						dirtyRemoteRecords.push(record);
					}
					withApplyingRemoteState(() => {
						serializer.setLocalSnapshot(mergeResult.data);
					});
					return true;
				}

				if (record !== undefined) {
					recordsToApply.push(record);
				}
				return true;
			}
		);
		if (!lockResult) {
			accountStore.shared.sync.lastError.set('conflict-reconcile-failed');
			return false;
		}
		deferredAutoResolutions.forEach((resolve) => {
			resolve();
		});
	}

	const appliedRecords: ISyncStateRecord[] = [];
	for (const record of recordsToApply) {
		const lockResult = await withAccountSyncNamespaceTransitionLock(
			context.user.id,
			record.namespace,
			async () => {
				if (
					!checkCurrentAccountUser(context.user.id) ||
					readDirtyQueueEntry(context.user.id, record.namespace) !==
						null
				) {
					return false;
				}
				const metaResult = await withAccountSyncMetaTransitionLock(
					context.user.id,
					generationToken,
					() => {
						if (
							!checkCurrentAccountUser(context.user.id) ||
							readDirtyQueueEntry(
								context.user.id,
								record.namespace
							) !== null
						) {
							return false;
						}
						return applyRemoteAccountRecords({
							generationToken,
							records: [record],
							replaceMeta: false,
							stateEpoch: remoteState.state_epoch,
							userId: context.user.id,
						});
					}
				);
				return metaResult !== null && metaResult !== false;
			}
		);
		if (lockResult) {
			appliedRecords.push(record);
		} else {
			dirtyNamespaceSet.add(record.namespace);
		}
	}
	if (dirtyRemoteRecords.length > 0) {
		const dirtyMetaResult = await withAccountSyncMetaTransitionLock(
			context.user.id,
			generationToken,
			() => {
				if (!checkCurrentAccountUser(context.user.id)) {
					return false;
				}
				const meta = readAccountSyncMeta(context.user.id) ?? {
					lastAppliedRemoteHash: {},
					revisions: {},
					state_epoch: remoteState.state_epoch,
				};
				for (const record of dirtyRemoteRecords) {
					if (
						readDirtyQueueEntry(
							context.user.id,
							record.namespace
						) === null
					) {
						return false;
					}
					const serializer = getAccountSyncSerializer(
						record.namespace
					);
					const data = serializer.migrate(
						record.data,
						record.schema_version
					);
					meta.lastAppliedRemoteHash[record.namespace] =
						createSnapshotHash(data);
					meta.revisions[record.namespace] = record.revision;
					writeAccountSyncBaseSnapshot({
						data,
						generationToken,
						namespace: record.namespace,
						revision: record.revision,
						userId: context.user.id,
					});
				}
				meta.state_epoch = remoteState.state_epoch;
				writeAccountSyncMeta(context.user.id, meta, {
					generationToken,
				});
				return true;
			}
		);
		if (dirtyMetaResult !== true) {
			accountStore.shared.sync.lastError.set('conflict-reconcile-failed');
			return false;
		}
	}
	postRemoteAppliedBroadcast({
		records: appliedRecords,
		stateEpoch: remoteState.state_epoch,
		userId: context.user.id,
	});
	setCurrentAccountUserStateEpoch(context.user.id, remoteState.state_epoch);
	scheduleAccountSyncFlush();
	recordAccountSyncRefreshSuccess({ userId: context.user.id });

	return true;
}

function createAccountSyncResetRecoveryKey(
	userId: string,
	stateEpoch: number | null,
	operationId: string
) {
	return `${userId}:${stateEpoch ?? 'pending'}:${operationId}`;
}

function scheduleAccountSyncResetRecovery(
	userId: string,
	operationId?: string,
	deleteStartedAt?: number,
	rearm = false
) {
	const resetGeneration = readAccountSyncResetGeneration(userId);
	if (
		resetGeneration.status === 'future' ||
		resetGeneration.status === 'invalid'
	) {
		clearAccountSyncResetRecoveries(userId);
		setAccountSyncFutureStateIsolated(userId, true);
		accountStore.shared.sync.lastError.set(
			resetGeneration.status === 'future'
				? 'sync-reset-marker-future'
				: 'sync-reset-marker-invalid'
		);
		accountStore.shared.sync.lastResult.set('failed');
		return;
	}
	if (
		resetGeneration.status === 'current' &&
		resetGeneration.marker.phase !== 'prepared'
	) {
		clearAccountSyncResetRecoveries(userId);
		clearAccountSyncResetRecoveryError(userId);
		return;
	}

	const preparedMarker =
		resetGeneration.status === 'current' ? resetGeneration.marker : null;
	const effectiveOperationId = preparedMarker?.operationId ?? operationId;
	if (effectiveOperationId === undefined) {
		return;
	}
	const effectiveDeleteStartedAt =
		preparedMarker?.deleteStartedAt ?? deleteStartedAt;
	const key = createAccountSyncResetRecoveryKey(
		userId,
		preparedMarker?.state_epoch ?? null,
		effectiveOperationId
	);

	for (const recovery of resetRecoveries.values()) {
		if (recovery.userId === userId && recovery.key !== key) {
			clearAccountSyncResetRecovery(recovery);
		}
	}

	let recovery = resetRecoveries.get(key);
	if (recovery === undefined) {
		recovery = {
			attempts: 0,
			...(effectiveDeleteStartedAt === undefined
				? {}
				: { deleteStartedAt: effectiveDeleteStartedAt }),
			failures: 0,
			key,
			operationId: effectiveOperationId,
			running: false,
			timer: null,
			userId,
		};
		resetRecoveries.set(key, recovery);
	} else if (effectiveDeleteStartedAt !== undefined) {
		recovery.deleteStartedAt = effectiveDeleteStartedAt;
	}

	if (recovery.running) {
		return;
	}
	if (recovery.timer !== null) {
		if (!rearm) {
			return;
		}
		clearTimeout(recovery.timer);
		recovery.timer = null;
	}

	const delay = rearm
		? 0
		: Math.min(
				RESET_RECOVERY_MAX_RETRY_DELAY,
				LEASE_BUSY_RETRY_DELAY * 2 ** Math.min(recovery.attempts, 5)
			);
	const scheduledRecovery = recovery;
	scheduledRecovery.timer = setTimeout(() => {
		scheduledRecovery.timer = null;
		if (resetRecoveries.get(key) !== scheduledRecovery) {
			return;
		}
		if (!checkCurrentAccountUser(userId)) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			return;
		}

		const currentGeneration = readAccountSyncResetGeneration(userId);
		if (
			currentGeneration.status === 'current' &&
			currentGeneration.marker.phase !== 'prepared'
		) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			clearAccountSyncResetRecoveryError(userId);
			return;
		}
		if (
			currentGeneration.status === 'current' &&
			(currentGeneration.marker.operationId !==
				scheduledRecovery.operationId ||
				createAccountSyncResetRecoveryKey(
					userId,
					currentGeneration.marker.state_epoch,
					currentGeneration.marker.operationId
				) !== key)
		) {
			clearAccountSyncResetRecovery(scheduledRecovery);
			scheduleAccountSyncResetRecovery(
				userId,
				undefined,
				undefined,
				true
			);
			return;
		}

		scheduledRecovery.running = true;
		scheduledRecovery.attempts += 1;
		let didRunRecovery = false;
		void withAccountSyncOperationLease(userId, 'delete-data', () => {
			didRunRecovery = true;
			return takeOverLocalAccountData(
				scheduledRecovery.operationId,
				scheduledRecovery.deleteStartedAt
			);
		})
			.then((recovered) => {
				if (recovered === true) {
					clearAccountSyncResetRecovery(scheduledRecovery);
					return;
				}
				if (didRunRecovery) {
					scheduledRecovery.failures += 1;
					recordAccountSyncResetRecoveryFailure(scheduledRecovery);
				}
			})
			.catch(() => {
				scheduledRecovery.failures += 1;
				recordAccountSyncResetRecoveryFailure(scheduledRecovery);
			})
			.finally(() => {
				scheduledRecovery.running = false;
				if (resetRecoveries.get(key) !== scheduledRecovery) {
					return;
				}
				scheduleAccountSyncResetRecovery(
					userId,
					scheduledRecovery.operationId,
					scheduledRecovery.deleteStartedAt
				);
			});
	}, delay);
}

export function flushAccountSyncQueueWithBeacon() {
	const context = getLoggedInAccountContext();
	if (
		context === null ||
		checkAccountSyncPaused() ||
		checkAccountSyncOperationActive(context.user.id) ||
		checkAccountSyncResetPrepared(context.user.id) ||
		visibilityOperationId !== null ||
		activeFlushRun !== null
	) {
		return;
	}

	const generationToken = captureAccountSyncResetGeneration(context.user.id);
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId: context.user.id,
		})
	) {
		return;
	}
	const entries = getFlushableEntries(context.user.id, generationToken).sort(
		(left, right) => left.namespace.localeCompare(right.namespace)
	);
	if (entries.length === 0) {
		return;
	}

	const lease = readAccountSyncLease(context.user.id);
	const now = Date.now();
	if (lease !== null && lease.expiresAt > now && lease.ownerTabId !== tabId) {
		return;
	}
	const currentEntries = getFlushableEntries(
		context.user.id,
		generationToken
	).sort((left, right) => left.namespace.localeCompare(right.namespace));
	const createBeaconBatchIdentity = (batch: IDirtyQueueEntry[]) =>
		batch.map((entry) => ({
			baseRevision: entry.baseRevision,
			clientMutationId: entry.clientMutationId,
			namespace: entry.namespace,
			schema_version: entry.schema_version,
			snapshotHash: entry.snapshotHash,
		}));
	const createBeaconBody = (batch: IDirtyQueueEntry[]) => ({
		changes: batch.map((entry) => ({
			data: entry.data,
			namespace: entry.namespace,
			revision: entry.baseRevision,
			schema_version: entry.schema_version,
		})),
		csrf_token: context.csrfToken,
		state_epoch: context.user.state_epoch,
	});
	const entryBatchHash = createSnapshotHash(
		createBeaconBatchIdentity(entries)
	);
	if (
		currentEntries.length !== entries.length ||
		!checkFlushEntriesStillCurrent(context.user.id, entries)
	) {
		return;
	}

	const bodyHash = createSnapshotHash(createBeaconBody(entries));
	const finalEntries = getFlushableEntries(
		context.user.id,
		generationToken
	).sort((left, right) => left.namespace.localeCompare(right.namespace));
	const finalBody = createBeaconBody(finalEntries);
	const finalPayload = JSON.stringify(finalBody);
	const operationId = createAccountClientId();
	if (
		checkAccountSyncOperationActive(context.user.id) ||
		checkAccountSyncResetPrepared(context.user.id) ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId: context.user.id,
		}) ||
		createSnapshotHash(createBeaconBatchIdentity(finalEntries)) !==
			entryBatchHash ||
		createSnapshotHash(finalBody) !== bodyHash ||
		new Blob([finalPayload]).size > SEND_BEACON_SYNC_BODY_BYTES ||
		!checkFlushEntriesStillCurrent(context.user.id, entries)
	) {
		return;
	}

	if (sendSyncPing(finalBody)) {
		visibilityOperationId = operationId;
	}
}

export function startAccountSyncClient() {
	syncClientGeneration += 1;
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
	const unsubscribeBroadcast = subscribeAccountSyncBroadcastMessage(
		(message) => {
			const context = getLoggedInAccountContext();
			if (message.tabId === tabId) {
				return;
			}
			if (message.type === 'account-updated') {
				if (message.accountRuntime !== undefined) {
					const signal = parseAccountRuntimeSignal({
						key: createAccountRuntimeSignalKey(message.userId),
						value: JSON.stringify({
							...message.accountRuntime,
							operationId: message.operationId,
							state_epoch: message.state_epoch,
							userId: message.userId,
						}),
					});
					if (signal === null) {
						return;
					}
				} else if (
					typeof message.operationId !== 'string' ||
					message.operationId === '' ||
					typeof message.userId !== 'string' ||
					message.userId === '' ||
					!checkNonNegativeSafeInteger(message.state_epoch)
				) {
					return;
				}
				if (
					!consumeAccountRuntimeInvalidationOperation(
						`${message.userId}:${message.operationId}`
					)
				) {
					return;
				}
				const expectedUserId = context?.user.id ?? message.userId;
				const generation = syncClientGeneration;
				void import('./session')
					.then(({ refreshAccountStateFromInvalidation }) =>
						refreshAccountStateFromInvalidation()
					)
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}
			if (message.type === 'profile-updated') {
				const expectedUserId = context?.user.id ?? message.userId;
				const generation = syncClientGeneration;
				void import('./session')
					.then(({ refreshAccountStateFromInvalidation }) =>
						refreshAccountStateFromInvalidation()
					)
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}
			if (context?.user.id !== message.userId) {
				return;
			}

			if (message.type === 'dirty' || message.type === 'lease-changed') {
				if (message.type === 'dirty') {
					restoreAccountSyncRuntimeState(context.user.id);
					if (message.runtimeReason === 'conflict-resolved') {
						removeAccountSyncRemoteConflictNotices(
							context.user.id,
							message.namespaces,
							message.runtimeMutationId ?? null
						);
					} else if (
						REMOTE_CONFLICT_NOTICE_REASONS.has(
							message.runtimeReason
						) &&
						getSafeStorageMode() !== 'local'
					) {
						const restoredNamespaces = new Set(
							accountStore.shared.sync.conflicts
								.get()
								.map(({ namespace }) => namespace)
						);
						const remoteNoticeNamespaces =
							message.namespaces.filter(
								(namespace) =>
									!restoredNamespaces.has(namespace)
							);
						addAccountSyncRemoteConflictNotices(
							context.user.id,
							remoteNoticeNamespaces,
							message.runtimeMutationId ?? null
						);
					} else if (getSafeStorageMode() === 'local') {
						removeAccountSyncRemoteConflictNotices(
							context.user.id,
							message.namespaces
						);
					}
				} else if (
					message.syncOperation === undefined ||
					!applyAccountSyncOperationLeaseSignal({
						expiresAt: message.syncOperation.expiresAt,
						operationId: message.operationId,
						status: message.syncOperation.status,
						userId: message.userId,
					})
				) {
					return;
				} else if (
					message.syncOperation.status === 'started' ||
					message.syncOperation.status === 'renewed'
				) {
					invalidateAccountSyncClientRuns();
					scheduleAccountSyncFlushAfter(
						ACCOUNT_SYNC_OPERATION_TTL + 100,
						() => {
							void flushAccountSyncQueue();
						}
					);
					return;
				} else {
					void reconcileAccountSyncPausedConflicts(
						context.user.id
					).finally(() => {
						scheduleAccountSyncFlush();
					});
					return;
				}
				scheduleAccountSyncFlush();
				return;
			}

			if (message.type === 'uploaded') {
				const expectedUserId = context.user.id;
				const generation = syncClientGeneration;
				const generationToken =
					captureAccountSyncResetGeneration(expectedUserId);
				updatePendingCount();
				void fetchValidatedSyncState(message.namespaces)
					.then(async (remoteState) => {
						if (
							!checkCurrentSyncRun(generation, expectedUserId) ||
							!checkRemoteStateFresh(
								expectedUserId,
								remoteState.state_epoch
							)
						) {
							return;
						}

						const applied = await applyRemoteStatePreservingDirty({
							generationToken,
							records: remoteState.records,
							replaceMeta: false,
							stateEpoch: remoteState.state_epoch,
							targetNamespaces: message.namespaces,
							userId: expectedUserId,
						});
						if (applied === null) {
							setTimeout(() => {
								void handleStateEpochMismatch(
									expectedUserId,
									generation,
									false
								).catch((error: unknown) => {
									handlePassiveSyncRefreshError(
										error,
										expectedUserId,
										generation
									);
								});
							}, LEASE_BUSY_RETRY_DELAY);
							return;
						}
						setCurrentAccountUserStateEpoch(
							expectedUserId,
							remoteState.state_epoch
						);
					})
					.catch((error: unknown) => {
						handlePassiveSyncRefreshError(
							error,
							expectedUserId,
							generation
						);
					});
				return;
			}

			if (message.type === 'data-deleted') {
				if (!checkBroadcastStateEpoch(message)) {
					return;
				}

				scheduleAccountSyncResetRecovery(
					context.user.id,
					message.operationId,
					message.deleteStartedAt
				);
				return;
			}

			const expectedUserId = context.user.id;
			const generation = syncClientGeneration;
			const generationToken =
				captureAccountSyncResetGeneration(expectedUserId);
			void fetchValidatedSyncState(message.namespaces)
				.then(async (remoteState) => {
					if (
						!checkCurrentSyncRun(generation, expectedUserId) ||
						!checkRemoteStateFresh(
							expectedUserId,
							remoteState.state_epoch
						)
					) {
						return;
					}

					const applied = await applyRemoteStatePreservingDirty({
						generationToken,
						records: remoteState.records,
						replaceMeta: false,
						stateEpoch: remoteState.state_epoch,
						targetNamespaces: message.namespaces,
						userId: expectedUserId,
					});
					if (applied === null) {
						setTimeout(() => {
							void handleStateEpochMismatch(
								expectedUserId,
								generation,
								false
							).catch((error: unknown) => {
								handlePassiveSyncRefreshError(
									error,
									expectedUserId,
									generation
								);
							});
						}, LEASE_BUSY_RETRY_DELAY);
						return;
					}
					setCurrentAccountUserStateEpoch(
						expectedUserId,
						remoteState.state_epoch
					);
				})
				.catch((error: unknown) => {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						generation
					);
				});
		}
	);
	let lastAccountStateResumeRefreshAt = 0;
	const scheduleAccountStateResumeRefresh = () => {
		const now = Date.now();
		if (
			now - lastAccountStateResumeRefreshAt <
			ACCOUNT_STATE_RESUME_REFRESH_DEDUPE_MS
		) {
			return;
		}
		lastAccountStateResumeRefreshAt = now;

		const expectedUserId = accountStore.shared.user.get()?.id ?? null;
		const generation = syncClientGeneration;
		void import('./session')
			.then(({ refreshAccountStateFromInvalidation }) =>
				refreshAccountStateFromInvalidation()
			)
			.catch((error: unknown) => {
				if (expectedUserId !== null) {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						generation
					);
				}
			});
	};
	const onVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			visibilityOperationId = null;
			scheduleAccountStateResumeRefresh();
			scheduleAccountSyncFlush();
		} else {
			flushAccountSyncQueueWithBeacon();
		}
	};
	const conflictHeartbeat = setInterval(() => {
		const context = getLoggedInAccountContext();
		if (context === null) {
			return;
		}
		const conflicts = accountStore.shared.sync.conflicts
			.get()
			.filter(({ userId }) => userId === context.user.id);
		for (const conflict of conflicts) {
			const entry = readDirtyQueueEntry(
				context.user.id,
				conflict.namespace
			);
			if (entry?.paused !== 'conflict') {
				continue;
			}
			void postAccountSyncBroadcastMessage({
				namespaces: [conflict.namespace],
				operationId: createAccountClientId(),
				runtimeMutationId: entry.clientMutationId,
				runtimeReason: 'conflict-heartbeat',
				state_epoch: context.user.state_epoch,
				tabId,
				type: 'dirty',
				userId: context.user.id,
			});
		}
	}, CONFLICT_HEARTBEAT_INTERVAL);
	const onPageHide = () => {
		flushAccountSyncQueueWithBeacon();
	};
	const onRetrySignal = () => {
		scheduleAccountStateResumeRefresh();
		const context = getLoggedInAccountContext();
		if (context !== null) {
			if (checkAccountSyncResetPrepared(context.user.id)) {
				scheduleAccountSyncResetRecovery(
					context.user.id,
					undefined,
					undefined,
					true
				);
			}
			restoreAccountSyncRuntimeState(context.user.id);
			void reconcileAccountSyncPausedConflicts(context.user.id).finally(
				() => {
					scheduleAccountSyncFlush();
				}
			);
			return;
		}
		scheduleAccountSyncFlush();
	};
	const onStorage = (event: StorageEvent) => {
		const context = getLoggedInAccountContext();
		if (
			context !== null &&
			event.key ===
				`${ACCOUNT_STORAGE_KEY_MAP.resetGeneration}:${context.user.id}`
		) {
			if (checkAccountSyncResetPrepared(context.user.id)) {
				scheduleAccountSyncResetRecovery(
					context.user.id,
					undefined,
					undefined,
					true
				);
			}
			return;
		}
		if (
			context !== null &&
			event.key ===
				`${ACCOUNT_STORAGE_KEY_MAP.syncOperation}:${context.user.id}`
		) {
			if (checkAccountSyncOperationActive(context.user.id)) {
				invalidateAccountSyncClientRuns();
				scheduleAccountSyncFlushAfter(
					ACCOUNT_SYNC_OPERATION_TTL + 100,
					() => {
						void flushAccountSyncQueue();
					}
				);
			} else {
				void reconcileAccountSyncPausedConflicts(
					context.user.id
				).finally(() => {
					scheduleAccountSyncFlush();
				});
			}
			return;
		}
		const runtimeSignalPrefix = createAccountStorageKey(
			ACCOUNT_STORAGE_KEY_MAP.runtimeSignal,
			''
		);
		if (event.key?.startsWith(runtimeSignalPrefix) === true) {
			const signal = parseAccountRuntimeSignal({
				key: event.key,
				value: event.newValue,
			});
			if (
				signal === null ||
				!consumeAccountRuntimeInvalidationOperation(
					`${signal.userId}:${signal.operationId}`
				)
			) {
				return;
			}
			const expectedUserId = context?.user.id ?? signal.userId;
			void import('./session')
				.then(({ refreshAccountStateFromInvalidation }) =>
					refreshAccountStateFromInvalidation()
				)
				.catch((error: unknown) => {
					handlePassiveSyncRefreshError(
						error,
						expectedUserId,
						syncClientGeneration
					);
				});
			return;
		}
		if (
			context !== null &&
			event.key !== null &&
			(event.key.startsWith('account-sync-dirty:') ||
				event.key.startsWith('account-sync-dirty-v2:') ||
				event.key.startsWith('account-sync-dirty-transition:'))
		) {
			const namespace = Object.values(SYNC_NAMESPACE_MAP).find(
				(item) =>
					createDirtyQueueKey(context.user.id, item) === event.key ||
					(item === SYNC_NAMESPACE_MAP.customerRarePlans &&
						createLegacyDirtyQueueKey(context.user.id, item) ===
							event.key) ||
					event.key?.startsWith(
						`${ACCOUNT_STORAGE_KEY_MAP.dirtyTransition}:${context.user.id}:${item}:`
					) === true
			);
			if (namespace !== undefined) {
				recordAccountSyncDirtyQueueExternalMutation({
					isLegacyKey:
						createLegacyDirtyQueueKey(
							context.user.id,
							namespace
						) === event.key &&
						namespace === SYNC_NAMESPACE_MAP.customerRarePlans,
					namespace,
					newValue: event.newValue,
					oldValue: event.oldValue,
					userId: context.user.id,
				});
			}
			restoreAccountSyncRuntimeState(context.user.id);
			scheduleAccountSyncFlush();
		}
	};

	document.addEventListener('visibilitychange', onVisibilityChange);
	globalThis.addEventListener('focus', onRetrySignal);
	globalThis.addEventListener('online', onRetrySignal);
	globalThis.addEventListener('pageshow', onRetrySignal);
	globalThis.addEventListener('pagehide', onPageHide);
	globalThis.addEventListener('storage', onStorage);

	const initialContext = getLoggedInAccountContext();
	if (initialContext !== null) {
		if (checkAccountSyncResetPrepared(initialContext.user.id)) {
			scheduleAccountSyncResetRecovery(initialContext.user.id);
		}
		restoreAccountSyncRuntimeState(initialContext.user.id);
		void reconcileAccountSyncPausedConflicts(
			initialContext.user.id
		).finally(() => {
			scheduleAccountSyncFlush();
		});
	}

	return () => {
		stopAccountSyncClient();
		clearInterval(conflictHeartbeat);
		visibilityOperationId = null;
		unsubscribeBroadcast();
		document.removeEventListener('visibilitychange', onVisibilityChange);
		globalThis.removeEventListener('focus', onRetrySignal);
		globalThis.removeEventListener('online', onRetrySignal);
		globalThis.removeEventListener('pageshow', onRetrySignal);
		globalThis.removeEventListener('pagehide', onPageHide);
		globalThis.removeEventListener('storage', onStorage);
	};
}
