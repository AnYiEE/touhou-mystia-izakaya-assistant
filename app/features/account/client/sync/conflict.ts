import type { ISyncConflictItem } from '@/features/account/sync/types';

import { readAccountSyncBaseSnapshot } from './baseSnapshot';
import { type TAccountSyncConflictResolution } from './conflictResolutionJournal';
import { recoverAccountSyncConflictResolutionJournalUnlocked } from './conflicts/journalRecovery';
import { commitAccountSyncConflictResolution } from './conflicts/resolution';
import {
	CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL,
	withAccountSyncNamespaceTransitionLock,
} from './conflicts/transitionLock';
import { readDirtyQueueEntry } from './dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from './dirtyQueue/snapshotHash';
import { updatePausedConflictEntryIfCurrent } from './queue';
import { captureAccountSyncResetGeneration } from './resetGeneration';
import {
	ACCOUNT_SYNC_OPERATION_TTL,
	checkAccountSyncOperationActive,
} from './syncOperationLease';
import { getAccountSyncSerializer } from './snapshot';
import {
	completeAccountSyncConflictResolutionRuntime,
	setAccountSyncConflictResolutionReadiness,
	upsertAccountSyncConflict,
} from './syncRuntimeState';

export type TSyncConflictResolution = TAccountSyncConflictResolution;

export type TAccountSyncConflictResolutionResultStatus =
	| 'busy'
	| 'resolved'
	| 'resolved-elsewhere'
	| 'stale'
	| 'storage-unavailable'
	| 'unsupported';

export interface IAccountSyncConflictResolutionResult {
	status: TAccountSyncConflictResolutionResultStatus;
}

const scheduledBusyReadinessRetries = new Set<string>();

function createResolutionResult(
	status: TAccountSyncConflictResolutionResultStatus
): IAccountSyncConflictResolutionResult {
	return { status };
}

function checkConflictSnapshotsEqual(
	left: ISyncConflictItem,
	right: ISyncConflictItem
) {
	return (
		left.userId === right.userId &&
		left.namespace === right.namespace &&
		left.revision === right.revision &&
		checkSnapshotHashMatches(left.cloud, createSnapshotHash(right.cloud)) &&
		checkSnapshotHashMatches(left.local, createSnapshotHash(right.local)) &&
		checkSnapshotHashMatches(
			left.localCollision,
			createSnapshotHash(right.localCollision)
		) &&
		checkSnapshotHashMatches(left.merged, createSnapshotHash(right.merged))
	);
}

function createBusyReadinessRetryKey(conflict: ISyncConflictItem) {
	return createSnapshotHash({
		cloud: conflict.cloud,
		local: conflict.local,
		localCollision: conflict.localCollision,
		merged: conflict.merged,
		namespace: conflict.namespace,
		revision: conflict.revision,
		userId: conflict.userId,
	});
}

function classifyCurrentConflictState({
	conflict,
	userId,
}: {
	conflict: ISyncConflictItem;
	userId: string;
}) {
	const entry = readDirtyQueueEntry(userId, conflict.namespace);
	if (entry?.paused !== 'conflict' || entry.conflict === null) {
		completeAccountSyncConflictResolutionRuntime(
			userId,
			conflict.namespace
		);
		return createResolutionResult('resolved-elsewhere');
	}
	if (!checkConflictSnapshotsEqual(entry.conflict, conflict)) {
		upsertAccountSyncConflict(entry.conflict);
		setAccountSyncConflictResolutionReadiness(
			userId,
			conflict.namespace,
			'stale'
		);
		return createResolutionResult('stale');
	}

	return null;
}

function scheduleBusyReadinessRetry(
	conflict: ISyncConflictItem,
	userId: string
) {
	const key = createBusyReadinessRetryKey(conflict);
	if (scheduledBusyReadinessRetries.has(key)) {
		return;
	}
	scheduledBusyReadinessRetries.add(key);
	const retryDelay = checkAccountSyncOperationActive(userId)
		? ACCOUNT_SYNC_OPERATION_TTL + 100
		: CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL + 100;
	setTimeout(() => {
		scheduledBusyReadinessRetries.delete(key);
		if (
			checkAccountSyncOperationActive(userId) ||
			classifyCurrentConflictState({ conflict, userId }) !== null
		) {
			return;
		}
		setAccountSyncConflictResolutionReadiness(
			userId,
			conflict.namespace,
			'ready'
		);
	}, retryDelay);
}

export async function resolveAccountSyncConflict({
	conflict,
	generationToken: providedGenerationToken,
	resolution,
	userId,
}: {
	conflict: ISyncConflictItem;
	generationToken?: string | null;
	resolution: TSyncConflictResolution;
	userId: string;
}): Promise<IAccountSyncConflictResolutionResult> {
	const generationToken =
		providedGenerationToken === undefined
			? captureAccountSyncResetGeneration(userId)
			: providedGenerationToken;
	if (checkAccountSyncOperationActive(userId)) {
		setAccountSyncConflictResolutionReadiness(
			userId,
			conflict.namespace,
			'busy'
		);
		scheduleBusyReadinessRetry(conflict, userId);
		return createResolutionResult('busy');
	}

	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		conflict.namespace,
		async () => {
			if (checkAccountSyncOperationActive(userId)) {
				return createResolutionResult('busy');
			}

			const recovery =
				await recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					conflict.namespace
				);
			if (recovery.status !== 'none' && recovery.status !== 'recovered') {
				return createResolutionResult(recovery.status);
			}

			const currentState = classifyCurrentConflictState({
				conflict,
				userId,
			});
			if (currentState !== null) {
				return currentState;
			}
			let entry = readDirtyQueueEntry(userId, conflict.namespace);
			if (entry?.paused !== 'conflict' || entry.conflict === null) {
				return createResolutionResult('resolved-elsewhere');
			}
			let activeConflict = entry.conflict;
			const serializer = getAccountSyncSerializer(conflict.namespace);
			const currentLocal = serializer.getLocalSnapshot();
			if (!checkSnapshotHashMatches(currentLocal, entry.snapshotHash)) {
				if (resolution === 'merged') {
					if (activeConflict.localCollision !== undefined) {
						return createResolutionResult('stale');
					}
					const cloud = serializer.deserialize(activeConflict.cloud);
					const storedBase = readAccountSyncBaseSnapshot(
						userId,
						conflict.namespace,
						entry.baseRevision,
						serializer
					);
					const mergeResult = serializer.merge({
						base: storedBase?.data ?? null,
						cloud,
						local: currentLocal,
						namespace: conflict.namespace,
					});
					const latestConflict =
						mergeResult.conflict === null
							? {
									cloud,
									local: currentLocal,
									merged: mergeResult.data,
									namespace: conflict.namespace,
									revision: activeConflict.revision,
									userId,
								}
							: {
									...mergeResult.conflict,
									revision: activeConflict.revision,
									userId,
								};
					const latestEntry = updatePausedConflictEntryIfCurrent({
						conflict: latestConflict,
						data: currentLocal,
						expectedEntry: entry,
						generationToken,
						userId,
					});
					if (latestEntry !== null) {
						upsertAccountSyncConflict(latestConflict);
					}
					return createResolutionResult('stale');
				}
				if (
					resolution.startsWith('collision:') ||
					activeConflict.localCollision !== undefined
				) {
					return createResolutionResult('stale');
				}
				if (resolution === 'cloud') {
					return (await commitAccountSyncConflictResolution({
						conflict: activeConflict,
						entry,
						generationToken,
						resolution,
						userId,
					}))
						? createResolutionResult('resolved')
						: (classifyCurrentConflictState({ conflict, userId }) ??
								createResolutionResult('storage-unavailable'));
				}
				const latestConflict = {
					...activeConflict,
					local: currentLocal,
					merged: null,
				};
				delete latestConflict.automaticResolution;
				const latestEntry = updatePausedConflictEntryIfCurrent({
					conflict: latestConflict,
					data: currentLocal,
					expectedEntry: entry,
					generationToken,
					userId,
				});
				if (latestEntry === null) {
					return createResolutionResult('stale');
				}
				entry = latestEntry;
				activeConflict = latestConflict;
			}

			const didResolve = await commitAccountSyncConflictResolution({
				conflict: activeConflict,
				entry,
				generationToken,
				resolution,
				userId,
			});
			if (didResolve) {
				return createResolutionResult('resolved');
			}

			return (
				classifyCurrentConflictState({ conflict, userId }) ??
				createResolutionResult('storage-unavailable')
			);
		}
	);
	const resolvedResult =
		result ??
		classifyCurrentConflictState({ conflict, userId }) ??
		createResolutionResult('busy');
	if (
		resolvedResult.status !== 'resolved' &&
		resolvedResult.status !== 'resolved-elsewhere'
	) {
		setAccountSyncConflictResolutionReadiness(
			userId,
			conflict.namespace,
			resolvedResult.status
		);
	}
	if (resolvedResult.status === 'busy') {
		scheduleBusyReadinessRetry(conflict, userId);
	} else {
		scheduledBusyReadinessRetries.delete(
			createBusyReadinessRetryKey(conflict)
		);
	}

	return resolvedResult;
}
