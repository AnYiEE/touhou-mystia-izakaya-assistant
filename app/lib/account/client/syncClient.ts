import {
	AccountApiError,
	fetchSyncState,
	putSyncState,
	sendSyncPing,
} from './api';
import {
	ACCOUNT_SYNC_LEASE_RENEW_INTERVAL,
	acquireAccountSyncLease,
	checkAccountSyncLeaseSupported,
	createAccountTabId,
	readAccountSyncLease,
	releaseAccountSyncLease,
	renewAccountSyncLease,
} from './lease';
import {
	checkSnapshotHashMatches,
	checkSnapshotHashesEquivalent,
	completeDirtyQueueEntryUpload,
	createSnapshotHash,
	markAccountSyncDirty,
	readDirtyQueueEntries,
	readDirtyQueueEntry,
	removeDirtyQueueEntries,
	removeDirtyQueueEntry,
	writeDirtyQueueEntry,
} from './queue';
import {
	postAccountSyncBroadcastMessage,
	subscribeAccountSyncBroadcastMessage,
} from './broadcast';
import { resolveAccountSyncConflict } from './conflict';
import { createAccountClientId } from './random';
import {
	applyRemoteAccountRecords,
	checkAccountSyncPaused,
	createLocalAccountSnapshot,
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';
import {
	type IAccountSyncBroadcastMessage,
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	type ISyncStateGetResponse,
	type ISyncStateItemConflict,
	type ISyncStatePutResponse,
	type ISyncStateRecord,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
	type TSyncStatePutResult,
} from '@/lib/account/sync';
import {
	type IGlobalPreferencesSnapshot,
	globalPreferencesSerializer,
} from '@/lib/account/sync/serializers/globalPreferences';
import { getLogSafeErrorCode } from '@/lib/logging';
import { accountStore } from '@/stores/account';

const DIRTY_COUNT_FLUSH_THRESHOLD = 10;
const FORCE_FLUSH_DELAY = 30 * 1000;
const QUIET_FLUSH_DELAY = 2 * 1000;
const LEASE_BUSY_RETRY_DELAY = QUIET_FLUSH_DELAY;
const SEND_BEACON_BYTE_LIMIT = 48 * 1024;
const EXPLICIT_FLUSH_MAX_PASSES = 8;
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
		schemaVersion !== SYNC_SCHEMA_VERSION_MAP[namespace] ||
		!checkRemoteRevision(revision) ||
		!checkNonNegativeSafeInteger(updatedAt)
	) {
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
	if (schemaVersion !== SYNC_SCHEMA_VERSION_MAP[namespace]) {
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

	accountStore.shared.sync.pendingCount.set(
		pendingEntries.filter((e) => e.paused === null).length
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

function resetExpiredAccountSession() {
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.shared.passwordMustChange.set(false);
	accountStore.shared.sync.canRetry.set(false);
	accountStore.shared.sync.conflicts.set([]);
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

export function invalidateAccountSyncClientRuns() {
	syncClientGeneration += 1;
	activeFlushRun = null;
	visibilityOperationId = null;
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
}

export function stopAccountSyncClient() {
	invalidateAccountSyncClientRuns();
}

function handleForbiddenSyncError(error: AccountApiError) {
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
		.then(({ refreshAccountState }) => refreshAccountState())
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

	if (error instanceof AccountApiError && error.status === 401) {
		stopAccountSyncClient();
		resetExpiredAccountSession();
		return;
	}
	if (error instanceof AccountApiError && error.status === 403) {
		handleForbiddenSyncError(error);
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

function getFlushableEntries(userId: string) {
	return readDirtyQueueEntries(userId).filter(
		(entry) => entry.paused === null
	);
}

function checkFlushEntriesStillCurrent(
	userId: string,
	entries: IDirtyQueueEntry[]
) {
	return entries.every((entry) => {
		const currentEntry = readDirtyQueueEntry(userId, entry.namespace);

		return (
			currentEntry !== null &&
			currentEntry.paused === null &&
			currentEntry.clientMutationId === entry.clientMutationId &&
			checkSnapshotHashesEquivalent(currentEntry, entry)
		);
	});
}

function setAccountSyncConflict(conflict: ISyncConflictItem) {
	accountStore.shared.sync.conflicts.set((conflicts) => [
		...conflicts.filter(
			(item) =>
				item.userId !== conflict.userId ||
				item.namespace !== conflict.namespace
		),
		conflict,
	]);
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
	try {
		cloud = globalPreferencesSerializer.deserialize(conflict.cloud);
		local = globalPreferencesSerializer.deserialize(conflict.local);
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

	return { ...conflict, cloud, local, merged: null };
}

function tryResolveInteractionCountOnlyConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	const cloudConflict = getInteractionCountOnlyCloudConflict(conflict);
	if (cloudConflict === null) {
		return false;
	}

	try {
		return resolveAccountSyncConflict({
			conflict: cloudConflict,
			resolution: 'cloud',
			userId,
		});
	} catch (error) {
		console.warn(
			'Failed to auto-resolve interactionCount-only account sync conflict.',
			{ errorCode: getLogSafeErrorCode(error) }
		);

		return false;
	}
}

function restoreAccountSyncConflict(
	conflict: ISyncConflictItem,
	userId: string
) {
	if (tryResolveInteractionCountOnlyConflict(conflict, userId)) {
		return false;
	}

	setAccountSyncConflict(conflict);

	return true;
}

function createConflictFromDirtyEntry({
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
			? serializer.getDefaultSnapshot()
			: serializer.migrate(record.data, record.schema_version);
	const local = serializer.deserialize(entry.data);
	const mergeResult = serializer.merge({
		base: null,
		cloud,
		local,
		namespace: entry.namespace,
	});

	return {
		cloud,
		local,
		merged:
			mergeResult.conflict === null
				? mergeResult.data
				: mergeResult.conflict.merged,
		namespace: entry.namespace,
		revision: record?.revision ?? 0,
		userId,
	} satisfies ISyncConflictItem;
}

function pauseDirtyEntryWithConflict({
	conflict,
	entry,
	incrementAttempts = false,
	requireCurrentMatch = false,
	userId,
}: {
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	incrementAttempts?: boolean;
	requireCurrentMatch?: boolean;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	const isCurrentEntryMatch =
		currentEntry?.clientMutationId === entry.clientMutationId &&
		checkSnapshotHashesEquivalent(currentEntry, entry);
	if (requireCurrentMatch && !isCurrentEntryMatch) {
		return false;
	}

	const entryToPause = currentEntry ?? entry;
	writeDirtyQueueEntry(userId, {
		...entryToPause,
		attempts: entryToPause.attempts + (incrementAttempts ? 1 : 0),
		conflict,
		lastError: 'conflict',
		paused: 'conflict',
	});
	setAccountSyncConflict(conflict);

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

function applyRemoteStatePreservingDirty({
	keepDirtyBaseRevision = false,
	records,
	replaceMeta = true,
	stateEpoch,
	targetNamespaces,
	userId,
}: {
	keepDirtyBaseRevision?: boolean;
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
	const dirtyEntries = readDirtyQueueEntries(userId).filter(
		(entry) =>
			targetNamespaceSet === null ||
			targetNamespaceSet.has(entry.namespace)
	);
	const preserveNamespaceSet = new Set<TSyncNamespace>();
	const dirtyRemoteRecords: ISyncStateRecord[] = [];
	const recordMap = getRecordMap(targetRecords);

	dirtyEntries.forEach((entry) => {
		if (entry.paused === 'conflict' && entry.conflict !== null) {
			if (restoreAccountSyncConflict(entry.conflict, userId)) {
				preserveNamespaceSet.add(entry.namespace);
			}
			return;
		}

		const serializer = getAccountSyncSerializer(entry.namespace);
		const record = recordMap[entry.namespace];
		const cloud =
			record === undefined
				? null
				: serializer.migrate(record.data, record.schema_version);
		const local = serializer.deserialize(entry.data);
		const mergeResult = serializer.merge({
			base: null,
			cloud,
			local,
			namespace: entry.namespace,
		});

		if (mergeResult.conflict === null) {
			if (mergeResult.shouldUpload) {
				writeDirtyQueueEntry(userId, {
					...entry,
					baseRevision: keepDirtyBaseRevision
						? entry.baseRevision
						: (record?.revision ?? 0),
					clientMutationId: createAccountClientId(),
					conflict: null,
					data: mergeResult.data,
					dirtyAt: Date.now(),
					lastError: null,
					paused: null,
					schema_version: SYNC_SCHEMA_VERSION_MAP[entry.namespace],
					snapshotHash: createSnapshotHash(mergeResult.data),
				});
				withApplyingRemoteState(() => {
					serializer.setLocalSnapshot(mergeResult.data);
				});
				if (record !== undefined) {
					dirtyRemoteRecords.push(record);
				}
				preserveNamespaceSet.add(entry.namespace);
				return;
			}

			removeDirtyQueueEntry(userId, entry.namespace);
			if (record === undefined) {
				withApplyingRemoteState(() => {
					serializer.setLocalSnapshot(mergeResult.data);
				});
			}
			return;
		}

		pauseDirtyEntryWithConflict({
			conflict: {
				...mergeResult.conflict,
				revision: record?.revision ?? 0,
				userId,
			},
			entry,
			userId,
		});
		preserveNamespaceSet.add(entry.namespace);
	});

	const recordsToApply = targetRecords.filter(
		(record) => !preserveNamespaceSet.has(record.namespace)
	);
	const meta = applyRemoteAccountRecords({
		preserveNamespaces: [...preserveNamespaceSet],
		records: recordsToApply,
		replaceMeta,
		stateEpoch,
		userId,
	});
	dirtyRemoteRecords.forEach((record) => {
		const serializer = getAccountSyncSerializer(record.namespace);
		const data = serializer.migrate(record.data, record.schema_version);
		meta.lastAppliedRemoteHash[record.namespace] = createSnapshotHash(data);
		meta.revisions[record.namespace] = record.revision;
	});
	if (dirtyRemoteRecords.length > 0) {
		writeAccountSyncMeta(userId, meta);
	}
	updatePendingCount();

	return recordsToApply;
}

export function restoreAccountSyncRuntimeState(userId: string) {
	const entries = readDirtyQueueEntries(userId);
	accountStore.shared.sync.conflicts.set(
		entries
			.map((entry) =>
				entry.paused === 'conflict' && entry.conflict !== null
					? restoreAccountSyncConflict(entry.conflict, userId)
						? entry.conflict
						: null
					: null
			)
			.filter(
				(conflict): conflict is ISyncConflictItem => conflict !== null
			)
	);
	updatePendingCount(entries);
}

export function resetAccountSyncCloudStateAfterDelete({
	deleteStartedAt,
	stateEpoch,
	userId,
}: {
	deleteStartedAt?: number;
	stateEpoch: number;
	userId: string;
}) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const currentMeta = readAccountSyncMeta(userId);
	const currentUser = accountStore.shared.user.get();
	const latestKnownEpoch = Math.max(
		currentMeta?.state_epoch ?? 0,
		currentUser?.id === userId ? currentUser.state_epoch : 0
	);
	if (
		stateEpoch < latestKnownEpoch ||
		(currentMeta?.clearedStateEpoch !== undefined &&
			stateEpoch <= currentMeta.clearedStateEpoch)
	) {
		return false;
	}

	const dirtyEntries = readDirtyQueueEntries(userId);
	const preservedDirtyEntries =
		deleteStartedAt === undefined || deleteStartedAt <= 0
			? []
			: dirtyEntries.filter((entry) => entry.dirtyAt > deleteStartedAt);

	removeDirtyQueueEntries(userId);
	preservedDirtyEntries.forEach((entry) => {
		writeDirtyQueueEntry(userId, {
			...entry,
			attempts: 0,
			baseRevision: 0,
			clientMutationId: createAccountClientId(),
			conflict: null,
			lastError: null,
			paused: null,
		});
	});
	writeAccountSyncMeta(userId, {
		clearedStateEpoch: stateEpoch,
		lastAppliedRemoteHash: {},
		revisions: {},
		state_epoch: stateEpoch,
	});
	accountStore.shared.sync.conflicts.set((conflicts) =>
		conflicts.filter((conflict) => conflict.userId !== userId)
	);
	accountStore.shared.sync.lastError.set(null);
	updatePendingCount(preservedDirtyEntries);
	setCurrentAccountUserStateEpoch(userId, stateEpoch);

	return preservedDirtyEntries.length > 0;
}

function pauseDirtyEntriesAfterRemoteClear({
	stateEpoch,
	userId,
}: {
	stateEpoch: number;
	userId: string;
}) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		return false;
	}

	const dirtyEntries = readDirtyQueueEntries(userId);
	if (dirtyEntries.length === 0) {
		return false;
	}

	writeAccountSyncMeta(userId, {
		clearedStateEpoch: stateEpoch,
		lastAppliedRemoteHash: {},
		revisions: {},
		state_epoch: stateEpoch,
	});
	for (const entry of dirtyEntries) {
		pauseDirtyEntryWithConflict({
			conflict: createConflictFromDirtyEntry({
				entry,
				record: null,
				userId,
			}),
			entry,
			userId,
		});
	}
	accountStore.shared.sync.lastError.set('conflict');
	updatePendingCount();
	setCurrentAccountUserStateEpoch(userId, stateEpoch);

	return true;
}

function handleSuccessfulUpload({
	entry,
	revision,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
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
	writeAccountSyncMeta(userId, meta);
	completeDirtyQueueEntryUpload({
		entry,
		nextBaseRevision: revision,
		userId,
	});
}

function handleConflictUpload({
	entry,
	result,
	stateEpoch,
	userId,
}: {
	entry: IDirtyQueueEntry;
	result: ISyncStateItemConflict;
	stateEpoch: number;
	userId: string;
}) {
	if (checkSnapshotHashMatches(result.data, entry.snapshotHash)) {
		handleSuccessfulUpload({
			entry,
			revision: result.revision,
			stateEpoch,
			userId,
		});
		return 'confirmed' as const;
	}

	const didPause = pauseDirtyEntryWithConflict({
		conflict: createConflictFromDirtyEntry({
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
		}),
		entry,
		incrementAttempts: true,
		requireCurrentMatch: true,
		userId,
	});

	return didPause ? ('paused' as const) : ('stale' as const);
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

async function handleStateEpochMismatch(
	userId: string,
	generation: number,
	shouldBroadcast = true
) {
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
		if (
			!pauseDirtyEntriesAfterRemoteClear({
				stateEpoch: remoteState.state_epoch,
				userId,
			})
		) {
			resetAccountSyncCloudStateAfterDelete({
				stateEpoch: remoteState.state_epoch,
				userId,
			});
		}
		setCurrentAccountUserStateEpoch(userId, remoteState.state_epoch);
		return true;
	}

	const recordsToApply = applyRemoteStatePreservingDirty({
		keepDirtyBaseRevision: true,
		records: remoteState.records,
		stateEpoch: remoteState.state_epoch,
		userId,
	});
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

	const entries = getFlushableEntries(context.user.id);
	updatePendingCount(entries);
	if (entries.length === 0) {
		clearSyncTimers();
		return true;
	}
	if (checkAccountSyncPaused()) {
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
						getFlushableEntries(context.user.id).length > 0)
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
		let shouldScheduleRetryAfterFlush = false;
		let shouldCheckLeaseBeforeWrite = false;

		try {
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
			shouldCheckLeaseBeforeWrite = !checkAccountSyncLeaseSupported();

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
			if (!checkFlushEntriesStillCurrent(context.user.id, entries)) {
				shouldScheduleRetryAfterFlush =
					getFlushableEntries(context.user.id).length > 0;
				return false;
			}

			const response = validateSyncPutResponse(
				await putSyncState(
					{
						changes: entries.map((entry) => ({
							data: entry.data,
							namespace: entry.namespace,
							revision: entry.baseRevision,
							schema_version: entry.schema_version,
						})),
						state_epoch: context.user.state_epoch,
					},
					context.csrfToken
				)
			);
			if (!checkCurrentSyncRun(generation, context.user.id)) {
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

			let hasUnresolvedResult = false;
			const uploadedNamespaces: TSyncNamespace[] = [];
			for (const entry of entries) {
				const result = resultMap.get(entry.namespace);
				if (result === undefined) {
					throw new Error('invalid-sync-result');
				}
				if (result.status === 'ok') {
					handleSuccessfulUpload({
						entry,
						revision: result.revision,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					uploadedNamespaces.push(result.namespace);
					continue;
				}
				if (result.status === 'conflict') {
					const conflictResult = handleConflictUpload({
						entry,
						result,
						stateEpoch: response.state_epoch,
						userId: context.user.id,
					});
					if (conflictResult === 'confirmed') {
						uploadedNamespaces.push(result.namespace);
						continue;
					}
					if (conflictResult === 'stale') {
						shouldScheduleRetryAfterFlush = true;
					}
					hasUnresolvedResult = true;
					continue;
				}

				hasUnresolvedResult = true;
			}
			setCurrentAccountUserStateEpoch(
				context.user.id,
				response.state_epoch
			);

			accountStore.shared.sync.failedAttempts.set(0);
			accountStore.shared.sync.lastError.set(null);
			accountStore.shared.sync.canRetry.set(false);
			accountStore.shared.sync.lastResult.set(
				hasUnresolvedResult ? 'partial' : 'success'
			);
			accountStore.shared.sync.lastSyncedAt.set(Date.now());
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

			return !hasUnresolvedResult;
		} catch (error) {
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
						getFlushableEntries(context.user.id).length > 0;
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
				quietFlushTimer ??= setTimeout(() => {
					quietFlushTimer = null;
					void flushAccountSyncQueue();
				}, LEASE_BUSY_RETRY_DELAY);
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

	const entries = getFlushableEntries(context.user.id);
	updatePendingCount(entries);

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

	for (let pass = 0; pass < EXPLICIT_FLUSH_MAX_PASSES; pass += 1) {
		if (!checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const isFlushed = await flushAccountSyncQueue();
		if (!isFlushed || !checkCurrentAccountUser(context.user.id)) {
			return false;
		}

		const entries = getFlushableEntries(context.user.id);
		updatePendingCount(entries);
		if (entries.length === 0) {
			clearSyncTimers();
			return true;
		}
	}

	scheduleAccountSyncFlush();

	return false;
}

export async function takeOverLocalAccountData() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return false;
	}

	const localSnapshot = createLocalAccountSnapshot();
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

	if (
		checkRemoteStateCleared({
			records: remoteState.records,
			stateEpoch: remoteState.state_epoch,
			userId: context.user.id,
		})
	) {
		const shouldFlushPreservedDirty = resetAccountSyncCloudStateAfterDelete(
			{ stateEpoch: remoteState.state_epoch, userId: context.user.id }
		);
		if (shouldFlushPreservedDirty) {
			scheduleAccountSyncFlush();
		}

		return true;
	}
	const recordMap = getRecordMap(remoteState.records);
	const dirtyEntries = readDirtyQueueEntries(context.user.id);
	const dirtyNamespaceSet = new Set(
		dirtyEntries.map((entry) => entry.namespace)
	);
	const dirtyRemoteRecords: ISyncStateRecord[] = [];
	const recordsToApply: ISyncStateRecord[] = [];

	Object.values(SYNC_NAMESPACE_MAP).forEach((namespace) => {
		if (dirtyNamespaceSet.has(namespace)) {
			const dirtyEntry = dirtyEntries.find(
				(entry) => entry.namespace === namespace
			);
			if (
				dirtyEntry?.paused === 'conflict' &&
				dirtyEntry.conflict !== null
			) {
				if (
					restoreAccountSyncConflict(
						dirtyEntry.conflict,
						context.user.id
					)
				) {
					return;
				}
			} else {
				return;
			}
		}

		const serializer = getAccountSyncSerializer(namespace);
		const local = serializer.deserialize(localSnapshot[namespace]);
		const record = recordMap[namespace];
		const cloud =
			record === undefined
				? null
				: serializer.migrate(record.data, record.schema_version);
		const mergeResult = serializer.merge({
			allowBaseNullAutoMerge: true,
			base: null,
			cloud,
			local,
			namespace,
		});

		if (mergeResult.conflict !== null) {
			const now = Date.now();
			const conflict = {
				...mergeResult.conflict,
				revision: record?.revision ?? 0,
				userId: context.user.id,
			} satisfies ISyncConflictItem;
			pauseDirtyEntryWithConflict({
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
				userId: context.user.id,
			});
			return;
		}

		if (mergeResult.shouldUpload) {
			if (record !== undefined) {
				dirtyRemoteRecords.push(record);
			}
			markAccountSyncDirty({
				baseRevision: record?.revision ?? 0,
				data: mergeResult.data,
				namespace,
				userId: context.user.id,
			});
			withApplyingRemoteState(() => {
				serializer.setLocalSnapshot(mergeResult.data);
			});
			return;
		}

		if (record !== undefined) {
			recordsToApply.push(record);
		}
	});

	const meta = applyRemoteAccountRecords({
		preserveNamespaces: [...dirtyNamespaceSet],
		records: recordsToApply,
		stateEpoch: remoteState.state_epoch,
		userId: context.user.id,
	});
	dirtyRemoteRecords.forEach((record) => {
		const serializer = getAccountSyncSerializer(record.namespace);
		const data = serializer.migrate(record.data, record.schema_version);
		meta.lastAppliedRemoteHash[record.namespace] = createSnapshotHash(data);
		meta.revisions[record.namespace] = record.revision;
	});
	if (dirtyRemoteRecords.length > 0) {
		writeAccountSyncMeta(context.user.id, meta);
	}
	postRemoteAppliedBroadcast({
		records: recordsToApply,
		stateEpoch: remoteState.state_epoch,
		userId: context.user.id,
	});
	setCurrentAccountUserStateEpoch(context.user.id, remoteState.state_epoch);
	scheduleAccountSyncFlush();

	return true;
}

export function flushAccountSyncQueueWithBeacon() {
	const context = getLoggedInAccountContext();
	if (
		context === null ||
		checkAccountSyncPaused() ||
		visibilityOperationId !== null ||
		activeFlushRun !== null
	) {
		return;
	}

	const entries = getFlushableEntries(context.user.id);
	if (entries.length === 0) {
		return;
	}

	const lease = readAccountSyncLease(context.user.id);
	const now = Date.now();
	if (lease !== null && lease.expiresAt > now && lease.ownerTabId !== tabId) {
		return;
	}

	const body = {
		changes: entries.map((entry) => ({
			data: entry.data,
			namespace: entry.namespace,
			revision: entry.baseRevision,
			schema_version: entry.schema_version,
		})),
		csrf_token: context.csrfToken,
		state_epoch: context.user.state_epoch,
	};
	const payload = JSON.stringify(body);

	if (new Blob([payload]).size > SEND_BEACON_BYTE_LIMIT) {
		return;
	}

	const operationId = createAccountClientId();
	if (sendSyncPing(body)) {
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
			if (
				context?.user.id !== message.userId ||
				message.tabId === tabId
			) {
				return;
			}

			if (message.type === 'dirty' || message.type === 'lease-changed') {
				scheduleAccountSyncFlush();
				return;
			}

			if (message.type === 'uploaded') {
				const expectedUserId = context.user.id;
				const generation = syncClientGeneration;
				updatePendingCount();
				void fetchValidatedSyncState(message.namespaces)
					.then((remoteState) => {
						if (
							!checkCurrentSyncRun(generation, expectedUserId) ||
							!checkRemoteStateFresh(
								expectedUserId,
								remoteState.state_epoch
							)
						) {
							return;
						}

						applyRemoteStatePreservingDirty({
							records: remoteState.records,
							replaceMeta: false,
							stateEpoch: remoteState.state_epoch,
							targetNamespaces: message.namespaces,
							userId: expectedUserId,
						});
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

				const shouldFlushPreservedDirty =
					resetAccountSyncCloudStateAfterDelete({
						...(message.deleteStartedAt === undefined
							? {}
							: { deleteStartedAt: message.deleteStartedAt }),
						stateEpoch: message.state_epoch,
						userId: context.user.id,
					});
				if (shouldFlushPreservedDirty) {
					scheduleAccountSyncFlush();
				}
				return;
			}

			const expectedUserId = context.user.id;
			const generation = syncClientGeneration;
			void fetchValidatedSyncState(message.namespaces)
				.then((remoteState) => {
					if (
						!checkCurrentSyncRun(generation, expectedUserId) ||
						!checkRemoteStateFresh(
							expectedUserId,
							remoteState.state_epoch
						)
					) {
						return;
					}

					applyRemoteStatePreservingDirty({
						records: remoteState.records,
						replaceMeta: false,
						stateEpoch: remoteState.state_epoch,
						targetNamespaces: message.namespaces,
						userId: expectedUserId,
					});
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
	const onVisibilityChange = () => {
		if (document.visibilityState === 'visible') {
			visibilityOperationId = null;
			scheduleAccountSyncFlush();
		} else {
			flushAccountSyncQueueWithBeacon();
		}
	};
	const onPageHide = () => {
		flushAccountSyncQueueWithBeacon();
	};
	const onRetrySignal = () => {
		scheduleAccountSyncFlush();
	};

	document.addEventListener('visibilitychange', onVisibilityChange);
	globalThis.addEventListener('focus', onRetrySignal);
	globalThis.addEventListener('online', onRetrySignal);
	globalThis.addEventListener('pagehide', onPageHide);

	return () => {
		stopAccountSyncClient();
		visibilityOperationId = null;
		unsubscribeBroadcast();
		document.removeEventListener('visibilitychange', onVisibilityChange);
		globalThis.removeEventListener('focus', onRetrySignal);
		globalThis.removeEventListener('online', onRetrySignal);
		globalThis.removeEventListener('pagehide', onPageHide);
	};
}
