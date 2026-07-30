import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	readAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
} from '@/features/account/client/sync/baseSnapshot';
import { postAccountSyncBroadcastMessage } from '@/features/account/client/sync/broadcast';
import { readAccountSyncConflictResolutionJournal } from '@/features/account/client/sync/conflictResolutionJournal';
import {
	migrateLegacyCustomerRarePlansDirtyQueueEntry,
	quarantineInvalidDirtyQueueIntents,
	readDirtyQueueCollisionState,
	readDirtyQueueEntry,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from '@/features/account/client/sync/dirtyQueue/snapshotHash';
import { replaceDirtyQueueCollisionIfCurrent } from '@/features/account/client/sync/dirtyQueue/storageTransition';
import { updatePausedConflictEntryIfCurrent } from '@/features/account/client/sync/queue';
import { captureAccountSyncResetGeneration } from '@/features/account/client/sync/resetGeneration';
import {
	getAccountSyncSerializer,
	withApplyingRemoteState,
} from '@/features/account/client/sync/snapshot';
import { checkAccountSyncOperationActive } from '@/features/account/client/sync/syncOperationLease';
import {
	refreshAccountSyncQueueRuntime,
	upsertAccountSyncConflict,
} from '@/features/account/client/sync/syncRuntimeState';
import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import { checkSyncMergeCanApplyAutomatically } from '@/features/account/sync/serializers/utils';
import type {
	IDirtyQueueEntry,
	ISyncConflictItem,
} from '@/features/account/sync/types';

import { recoverAccountSyncConflictResolutionJournalUnlocked } from './journalRecovery';
import {
	checkActiveConflictUser,
	commitAccountSyncConflictResolution,
} from './resolution';
import { withAccountSyncNamespaceTransitionLock } from './transitionLock';

function publishPausedConflictRuntimeChange({
	mutationId,
	namespace,
	reason,
	userId,
}: {
	mutationId: string;
	namespace: TSyncNamespace;
	reason:
		| 'conflict-changed'
		| 'conflict-created'
		| 'conflict-resolved'
		| 'queue-changed';
	userId: string;
}) {
	const user = accountStore.shared.user.get();
	if (user?.id !== userId) {
		return;
	}

	void postAccountSyncBroadcastMessage({
		namespaces: [namespace],
		operationId: createAccountClientId(),
		runtimeMutationId: mutationId,
		runtimeReason: reason,
		state_epoch: user.state_epoch,
		tabId: 'conflict-reconcile',
		type: 'dirty',
		userId,
	});
}

async function reconcileAccountSyncDirtyQueueCollision({
	namespace,
	userId,
}: {
	namespace: TSyncNamespace;
	userId: string;
}) {
	const generationToken = captureAccountSyncResetGeneration(userId);
	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		namespace,
		() => {
			if (!checkActiveConflictUser(userId)) {
				return 'stale' as const;
			}
			if (
				readAccountSyncConflictResolutionJournal(userId, namespace) !==
				null
			) {
				return 'journal-pending' as const;
			}
			if (namespace === SYNC_NAMESPACE_MAP.customerRarePlans) {
				migrateLegacyCustomerRarePlansDirtyQueueEntry(
					generationToken,
					userId
				);
			}
			if (
				!quarantineInvalidDirtyQueueIntents(
					generationToken,
					userId,
					namespace
				)
			) {
				return 'isolated' as const;
			}
			const collision = readDirtyQueueCollisionState(userId, namespace);
			if (collision === null) {
				return 'none' as const;
			}
			if (collision.candidates.length === 0) {
				return 'isolated' as const;
			}

			const serializer = getAccountSyncSerializer(namespace);
			let migrationInvalidEvidenceCount = 0;
			const migratedCandidates = collision.candidates.flatMap(
				(candidate) => {
					try {
						const data = serializer.migrate(
							candidate.entry.data,
							candidate.entry.schema_version
						);
						if (!serializer.validate(data)) {
							migrationInvalidEvidenceCount += 1;
							return [];
						}
						return [
							{
								...candidate,
								data,
								entry: collision.requiresResetRebase
									? { ...candidate.entry, baseRevision: 0 }
									: candidate.entry,
							},
						];
					} catch {
						migrationInvalidEvidenceCount += 1;
						return [];
					}
				}
			);
			const normalizedCandidates = new Map<
				string,
				(typeof migratedCandidates)[number]
			>();
			for (const candidate of migratedCandidates) {
				const id = createSnapshotHash(candidate.data);
				const current = normalizedCandidates.get(id);
				if (
					current === undefined ||
					candidate.entry.baseRevision > current.entry.baseRevision
				) {
					normalizedCandidates.set(id, { ...candidate, id });
				}
			}
			const candidates = [...normalizedCandidates.values()];
			const invalidEvidenceCount =
				collision.invalidEvidenceCount + migrationInvalidEvidenceCount;
			if (candidates.length === 0) {
				return 'isolated' as const;
			}
			const now = Date.now();
			if (candidates.length === 1 && invalidEvidenceCount === 0) {
				const [candidate] = candidates;
				if (candidate === undefined) {
					return 'isolated' as const;
				}
				const nextEntry = {
					...candidate.entry,
					attempts: 0,
					baseRevision: candidate.entry.baseRevision,
					clientMutationId: createAccountClientId(),
					conflict: null,
					data: candidate.data,
					dirtyAt: now,
					lastError: null,
					paused: null,
					schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
					snapshotHash: createSnapshotHash(candidate.data),
				} satisfies IDirtyQueueEntry;
				if (
					!replaceDirtyQueueCollisionIfCurrent({
						generationToken,
						nextEntry,
						token: collision.token,
						userId,
					})
				) {
					return 'stale' as const;
				}
				if (
					readAccountSyncBaseSnapshot(
						userId,
						namespace,
						candidate.entry.baseRevision,
						serializer
					) === null
				) {
					removeAccountSyncBaseSnapshot(
						userId,
						namespace,
						generationToken
					);
				}
				withApplyingRemoteState(() => {
					serializer.setLocalSnapshot(candidate.data);
				});
				refreshAccountSyncQueueRuntime(userId);
				publishPausedConflictRuntimeChange({
					mutationId: nextEntry.clientMutationId,
					namespace,
					reason: 'queue-changed',
					userId,
				});
				return 'resolved' as const;
			}

			const [first] = candidates;
			if (first === undefined) {
				return 'isolated' as const;
			}
			const second = candidates[1] ?? first;
			const conflict = {
				cloud: first.data,
				local: second.data,
				localCollision: {
					candidates: candidates.map((candidate) => ({
						baseRevision: candidate.entry.baseRevision,
						data: candidate.data,
						id: candidate.id,
						label: candidate.label,
						schemaVersion: candidate.entry.schema_version,
						snapshotHash: createSnapshotHash(candidate.data),
					})),
					invalidEvidenceCount,
					token: collision.token,
					version: 1 as const,
				},
				merged: null,
				namespace,
				revision: first.entry.baseRevision,
				userId,
			} satisfies ISyncConflictItem;
			const nextEntry = {
				...first.entry,
				attempts: 0,
				baseRevision: first.entry.baseRevision,
				clientMutationId: createAccountClientId(),
				conflict,
				data: first.data,
				dirtyAt: now,
				lastError: 'conflict',
				paused: 'conflict' as const,
				schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
				snapshotHash: createSnapshotHash(first.data),
			} satisfies IDirtyQueueEntry;
			if (
				!replaceDirtyQueueCollisionIfCurrent({
					generationToken,
					nextEntry,
					token: collision.token,
					userId,
				})
			) {
				return 'stale' as const;
			}
			upsertAccountSyncConflict(conflict);
			refreshAccountSyncQueueRuntime(userId);
			publishPausedConflictRuntimeChange({
				mutationId: nextEntry.clientMutationId,
				namespace,
				reason: 'conflict-created',
				userId,
			});
			return 'conflict' as const;
		}
	);
	return result ?? ('busy' as const);
}

export async function reconcileAccountSyncDirtyQueueCollisions(userId: string) {
	return Promise.all(
		Object.values(SYNC_NAMESPACE_MAP).map((namespace) =>
			reconcileAccountSyncDirtyQueueCollision({ namespace, userId })
		)
	);
}

export async function reconcileAccountSyncPausedConflictLocalChange({
	generationToken: providedGenerationToken,
	namespace,
	userId,
}: {
	generationToken?: string | null;
	namespace: TSyncNamespace;
	userId: string;
}) {
	const generationToken =
		providedGenerationToken === undefined
			? captureAccountSyncResetGeneration(userId)
			: providedGenerationToken;
	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		namespace,
		async () => {
			if (!checkActiveConflictUser(userId)) {
				return 'stale' as const;
			}
			if (
				recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					namespace
				).hasIsolatedJournal
			) {
				return 'stale' as const;
			}

			const entry = readDirtyQueueEntry(userId, namespace);
			if (entry?.paused !== 'conflict' || entry.conflict === null) {
				return 'not-conflict' as const;
			}

			const serializer = getAccountSyncSerializer(namespace);
			const local = serializer.getLocalSnapshot();
			if (checkSnapshotHashMatches(local, entry.snapshotHash)) {
				return checkAccountSyncOperationActive(userId)
					? ('busy' as const)
					: ('unchanged' as const);
			}

			const { baseRevision, conflict } = entry;
			if (checkAccountSyncOperationActive(userId)) {
				const nextConflict = { ...conflict, local, merged: null };
				delete nextConflict.automaticResolution;
				const nextEntry = updatePausedConflictEntryIfCurrent({
					conflict: nextConflict,
					data: local,
					expectedEntry: entry,
					generationToken,
					userId,
				});
				if (nextEntry === null) {
					return 'stale' as const;
				}
				upsertAccountSyncConflict(nextConflict);
				refreshAccountSyncQueueRuntime(userId);
				return {
					conflictChangedMutationId: nextEntry.clientMutationId,
				} as const;
			}

			if (
				checkSnapshotHashMatches(
					local,
					createSnapshotHash(conflict.cloud)
				)
			) {
				return (await commitAccountSyncConflictResolution({
					conflict,
					entry,
					generationToken,
					resolution: 'cloud',
					userId,
				}))
					? ('resolved' as const)
					: ('stale' as const);
			}

			const storedBase = readAccountSyncBaseSnapshot(
				userId,
				namespace,
				baseRevision,
				serializer
			);
			const base = storedBase?.data ?? null;
			const cloud = serializer.deserialize(conflict.cloud);
			const mergeResult = serializer.merge({
				base,
				cloud,
				local,
				namespace,
			});

			if (checkSyncMergeCanApplyAutomatically(mergeResult, cloud)) {
				if (!mergeResult.shouldUpload) {
					return (await commitAccountSyncConflictResolution({
						conflict: { ...conflict, cloud },
						entry,
						generationToken,
						resolution: 'cloud',
						userId,
					}))
						? ('resolved' as const)
						: ('stale' as const);
				}

				return (await commitAccountSyncConflictResolution({
					conflict: {
						...conflict,
						cloud,
						local,
						merged: mergeResult.data,
					},
					entry,
					generationToken,
					resolution: 'merged',
					userId,
				}))
					? ('rebased' as const)
					: ('stale' as const);
			}

			const nextConflict =
				mergeResult.conflict === null
					? {
							cloud,
							local,
							merged: mergeResult.data,
							namespace,
							revision: conflict.revision,
							userId,
						}
					: {
							...mergeResult.conflict,
							revision: conflict.revision,
							userId,
						};
			const nextEntry = updatePausedConflictEntryIfCurrent({
				conflict: nextConflict,
				data: local,
				expectedEntry: entry,
				generationToken,
				userId,
			});

			if (nextEntry === null) {
				return 'stale' as const;
			}

			upsertAccountSyncConflict(nextConflict);
			refreshAccountSyncQueueRuntime(userId);

			return {
				conflictChangedMutationId: nextEntry.clientMutationId,
			} as const;
		}
	);

	if (result === null) {
		return 'busy' as const;
	}
	if (typeof result === 'object') {
		publishPausedConflictRuntimeChange({
			mutationId: result.conflictChangedMutationId,
			namespace,
			reason: 'conflict-changed',
			userId,
		});
		return 'conflict-changed' as const;
	}

	return result;
}

export async function reconcileAccountSyncPausedConflicts(userId: string) {
	const results = await Promise.all(
		Object.values(SYNC_NAMESPACE_MAP).map((namespace) =>
			reconcileAccountSyncPausedConflictLocalChange({ namespace, userId })
		)
	);

	return results.includes('rebased');
}
