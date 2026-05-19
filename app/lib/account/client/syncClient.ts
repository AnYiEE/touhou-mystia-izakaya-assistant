import {
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	type ISyncStateItemConflict,
	type ISyncStateRecord,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import {
	AccountApiError,
	fetchSyncState,
	putSyncState,
	sendSyncPing,
} from './api';
import {
	acquireAccountSyncLease,
	createAccountTabId,
	releaseAccountSyncLease,
	renewAccountSyncLease,
} from './lease';
import {
	completeDirtyQueueEntryUpload,
	createSnapshotHash,
	markAccountSyncDirty,
	readDirtyQueueEntries,
	removeDirtyQueueEntries,
	removeDirtyQueueEntry,
	writeDirtyQueueEntry,
} from './queue';
import {
	postAccountSyncBroadcastMessage,
	subscribeAccountSyncBroadcastMessage,
} from './broadcast';
import { createAccountClientId } from './random';
import {
	applyRemoteAccountRecords,
	createLocalAccountSnapshot,
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';

const DIRTY_COUNT_FLUSH_THRESHOLD = 10;
const FORCE_FLUSH_DELAY = 30 * 1000;
const QUIET_FLUSH_DELAY = 2 * 1000;
const SEND_BEACON_BYTE_LIMIT = 48 * 1024;

let activeFlushRunId: string | null = null;
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

function setCurrentAccountUserStateEpoch(userId: string, stateEpoch: number) {
	const user = accountStore.shared.user.get();
	if (user?.id !== userId) {
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

	accountStore.shared.sync.pendingCount.set(pendingEntries.length);
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

export function stopAccountSyncClient() {
	syncClientGeneration += 1;
	activeFlushRunId = null;
	clearSyncTimers();
	stopLeaseRenewal();
	accountStore.shared.sync.isSyncing.set(false);
}

function handlePassiveSyncRefreshError(error: unknown, expectedUserId: string) {
	if (!checkCurrentAccountUser(expectedUserId)) {
		return;
	}

	if (error instanceof AccountApiError && error.status === 401) {
		stopAccountSyncClient();
		resetExpiredAccountSession();
		return;
	}

	accountStore.shared.sync.canRetry.set(true);
	accountStore.shared.sync.lastError.set(
		error instanceof Error ? error.message : 'sync-refresh-failed'
	);
}

function handleActiveSyncRefreshUnauthorized(
	error: unknown,
	expectedUserId: string
) {
	if (
		!(error instanceof AccountApiError) ||
		error.status !== 401 ||
		!checkCurrentAccountUser(expectedUserId)
	) {
		return false;
	}

	stopAccountSyncClient();
	resetExpiredAccountSession();
	return true;
}

async function fetchSyncStateForCurrentUser(userId: string) {
	try {
		return await fetchSyncState();
	} catch (error) {
		if (handleActiveSyncRefreshUnauthorized(error, userId)) {
			return null;
		}

		throw error;
	}
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
	}, 5 * 1000);
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
		merged: mergeResult.conflict?.merged ?? mergeResult.data,
		namespace: entry.namespace,
		revision: record?.revision ?? 0,
		userId,
	} satisfies ISyncConflictItem;
}

function pauseDirtyEntryWithConflict({
	conflict,
	entry,
	incrementAttempts = false,
	userId,
}: {
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	incrementAttempts?: boolean;
	userId: string;
}) {
	writeDirtyQueueEntry(userId, {
		...entry,
		attempts: entry.attempts + (incrementAttempts ? 1 : 0),
		conflict,
		lastError: 'conflict',
		paused: 'conflict',
	});
	setAccountSyncConflict(conflict);
}

function applyRemoteStatePreservingDirty({
	records,
	replaceMeta = true,
	stateEpoch,
	targetNamespaces,
	userId,
}: {
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	targetNamespaces?: TSyncNamespace[];
	userId: string;
}) {
	const targetNamespaceSet =
		targetNamespaces === undefined ? null : new Set(targetNamespaces);
	const dirtyEntries = readDirtyQueueEntries(userId).filter(
		(entry) =>
			targetNamespaceSet === null ||
			targetNamespaceSet.has(entry.namespace)
	);
	const preserveNamespaceSet = new Set<TSyncNamespace>();
	const dirtyRemoteRecords: ISyncStateRecord[] = [];
	const recordMap = getRecordMap(records);

	dirtyEntries.forEach((entry) => {
		if (entry.paused === 'conflict' && entry.conflict !== null) {
			setAccountSyncConflict(entry.conflict);
			preserveNamespaceSet.add(entry.namespace);
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
				withApplyingRemoteState(() => {
					serializer.setLocalSnapshot(mergeResult.data);
				});
				writeDirtyQueueEntry(userId, {
					...entry,
					baseRevision: record?.revision ?? 0,
					clientMutationId: createAccountClientId(),
					conflict: null,
					data: mergeResult.data,
					dirtyAt: Date.now(),
					lastError: null,
					paused: null,
					schema_version: SYNC_SCHEMA_VERSION_MAP[entry.namespace],
					snapshotHash: createSnapshotHash(mergeResult.data),
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

	const recordsToApply = records.filter(
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
				entry.paused === 'conflict' ? (entry.conflict ?? null) : null
			)
			.filter(
				(conflict): conflict is ISyncConflictItem => conflict !== null
			)
	);
	updatePendingCount(entries);
}

export function resetAccountSyncCloudStateAfterDelete({
	stateEpoch,
	userId,
}: {
	stateEpoch: number;
	userId: string;
}) {
	removeDirtyQueueEntries(userId);
	writeAccountSyncMeta(userId, {
		clearedStateEpoch: stateEpoch,
		lastAppliedRemoteHash: {},
		revisions: {},
		state_epoch: stateEpoch,
	});
	accountStore.shared.sync.conflicts.set((conflicts) =>
		conflicts.filter((conflict) => conflict.userId !== userId)
	);
	accountStore.shared.sync.pendingCount.set(0);
	const user = accountStore.shared.user.get();
	if (user?.id === userId) {
		accountStore.shared.user.set({ ...user, state_epoch: stateEpoch });
	}
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
	completeDirtyQueueEntryUpload({
		entry,
		nextBaseRevision: revision,
		userId,
	});
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
	if (createSnapshotHash(result.data) === entry.snapshotHash) {
		handleSuccessfulUpload({
			entry,
			revision: result.revision,
			stateEpoch,
			userId,
		});
		return true;
	}

	pauseDirtyEntryWithConflict({
		conflict: createConflictFromDirtyEntry({
			entry,
			record:
				result.data === null
					? null
					: {
							data: result.data,
							namespace: result.namespace,
							revision: result.revision,
							schema_version: entry.schema_version,
							updated_at: result.updated_at,
						},
			userId,
		}),
		entry,
		incrementAttempts: true,
		userId,
	});
	return false;
}

async function handleStateEpochMismatch(
	userId: string,
	shouldBroadcast = true
) {
	const remoteState = await fetchSyncStateForCurrentUser(userId);
	if (remoteState === null) {
		return false;
	}
	if (!checkCurrentAccountUser(userId)) {
		return false;
	}

	const recordsToApply = applyRemoteStatePreservingDirty({
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

	const flushRunId = createAccountClientId();
	if (activeFlushRunId !== null) {
		return false;
	}
	activeFlushRunId = flushRunId;

	let didAcquireLease = false;
	let shouldScheduleRetryAfterFlush = false;

	try {
		if (
			!(await acquireAccountSyncLease(context.user.id, tabId, flushRunId))
		) {
			return false;
		}
		didAcquireLease = true;

		if (!checkCurrentSyncRun(generation, context.user.id)) {
			return false;
		}

		clearSyncTimers();
		startLeaseRenewal(context.user.id, generation, flushRunId);
		accountStore.shared.sync.isSyncing.set(true);

		const response = await putSyncState(
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
		);
		if (!checkCurrentSyncRun(generation, context.user.id)) {
			return false;
		}

		const entryMap = new Map(
			entries.map((entry) => [entry.namespace, entry] as const)
		);
		const uploadedNamespaces: TSyncNamespace[] = [];
		response.results.forEach((result) => {
			const entry = entryMap.get(result.namespace);
			if (entry === undefined) {
				return;
			}
			if (result.status === 'ok') {
				handleSuccessfulUpload({
					entry,
					revision: result.revision,
					stateEpoch: response.state_epoch,
					userId: context.user.id,
				});
				uploadedNamespaces.push(result.namespace);
				return;
			}
			if (result.status === 'conflict') {
				const isConfirmed = handleConflictUpload({
					entry,
					result,
					stateEpoch: response.state_epoch,
					userId: context.user.id,
				});
				if (isConfirmed) {
					uploadedNamespaces.push(result.namespace);
				}
			}
		});
		setCurrentAccountUserStateEpoch(context.user.id, response.state_epoch);

		accountStore.shared.sync.failedAttempts.set(0);
		accountStore.shared.sync.lastError.set(null);
		accountStore.shared.sync.lastResult.set(
			response.results.some((result) => result.status !== 'ok')
				? 'partial'
				: 'success'
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

		return response.results.every((result) => result.status === 'ok');
	} catch (error) {
		if (error instanceof AccountApiError && error.status === 401) {
			if (checkCurrentSyncRun(generation, context.user.id)) {
				resetExpiredAccountSession();
			}
			return false;
		}
		if (
			error instanceof Error &&
			error.message === 'state-epoch-mismatch'
		) {
			try {
				const didRefresh = await handleStateEpochMismatch(
					context.user.id
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
			}
		}
		if (!checkCurrentSyncRun(generation, context.user.id)) {
			return false;
		}

		accountStore.shared.sync.canRetry.set(true);
		accountStore.shared.sync.failedAttempts.set((attempts) => attempts + 1);
		accountStore.shared.sync.lastError.set(
			error instanceof Error ? error.message : 'sync-failed'
		);
		accountStore.shared.sync.lastResult.set('failed');
		return false;
	} finally {
		const isCurrentRun = checkCurrentSyncRun(generation, context.user.id);
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
				console.warn('Failed to release account sync lease.', error);
			}
		}
		if (activeFlushRunId === flushRunId) {
			activeFlushRunId = null;
		}
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
			}, 0);
		}
	}
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

export async function takeOverLocalAccountData() {
	const context = getLoggedInAccountContext();
	if (context === null) {
		return;
	}

	const localSnapshot = createLocalAccountSnapshot();
	const remoteState = await fetchSyncStateForCurrentUser(context.user.id);
	if (remoteState === null) {
		return;
	}
	if (!checkCurrentAccountUser(context.user.id)) {
		return;
	}

	const currentMeta = readAccountSyncMeta(context.user.id);
	const hasRemoteClearedState =
		remoteState.records.length === 0 &&
		(currentMeta?.clearedStateEpoch === remoteState.state_epoch ||
			remoteState.state_epoch > (currentMeta?.state_epoch ?? 0));
	if (hasRemoteClearedState) {
		resetAccountSyncCloudStateAfterDelete({
			stateEpoch: remoteState.state_epoch,
			userId: context.user.id,
		});
		return;
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
				setAccountSyncConflict(dirtyEntry.conflict);
			}
			return;
		}

		const serializer = getAccountSyncSerializer(namespace);
		const local = serializer.deserialize(localSnapshot[namespace]);
		const record = recordMap[namespace];
		const cloud =
			record === undefined
				? null
				: serializer.migrate(record.data, record.schema_version);
		const mergeResult = serializer.merge({
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
			withApplyingRemoteState(() => {
				serializer.setLocalSnapshot(mergeResult.data);
			});
			markAccountSyncDirty({
				baseRevision: record?.revision ?? 0,
				data: mergeResult.data,
				ignorePause: true,
				namespace,
				userId: context.user.id,
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
}

export function flushAccountSyncQueueWithBeacon() {
	const context = getLoggedInAccountContext();
	if (context === null || visibilityOperationId !== null) {
		return;
	}

	const entries = getFlushableEntries(context.user.id);
	if (entries.length === 0) {
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
	activeFlushRunId = null;
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
				updatePendingCount();
				void fetchSyncState(message.namespaces)
					.then((remoteState) => {
						if (!checkCurrentAccountUser(expectedUserId)) {
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
						handlePassiveSyncRefreshError(error, expectedUserId);
					});
				return;
			}

			if (message.type === 'data-deleted') {
				resetAccountSyncCloudStateAfterDelete({
					stateEpoch: message.state_epoch,
					userId: context.user.id,
				});
				return;
			}

			const expectedUserId = context.user.id;
			void fetchSyncState(message.namespaces)
				.then((remoteState) => {
					if (!checkCurrentAccountUser(expectedUserId)) {
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
					handlePassiveSyncRefreshError(error, expectedUserId);
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
