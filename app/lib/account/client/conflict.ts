import {
	readAccountSyncBaseSnapshot,
	removeAccountSyncBaseSnapshot,
	writeAccountSyncBaseSnapshot,
} from './baseSnapshot';
import { postAccountSyncBroadcastMessage } from './broadcast';
import {
	type TAccountSyncConflictResolution,
	type TAccountSyncConflictResolutionJournalStage,
	getAccountSyncConflictResolutionRecoveryAction,
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournal,
	runAccountSyncConflictResolutionJournalTransaction,
} from './conflictResolutionJournal';
import {
	checkSnapshotHashMatches,
	clearDirtyQueueCollisionEvidence,
	createSnapshotHash,
	migrateLegacyCustomerRarePlansDirtyQueueEntry,
	quarantineInvalidDirtyQueueIntents,
	readDirtyQueueCollisionState,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
	removePausedConflictEntryIfCurrent,
	replaceDirtyQueueCollisionIfCurrent,
	replacePausedConflictWithDirtyIfCurrent,
	updatePausedConflictEntryIfCurrent,
} from './queue';
import { createAccountClientId } from './random';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationIdFromToken,
} from './resetGeneration';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
	removeAccountSyncMetaIfCurrent,
	withAccountSyncMetaTransitionLock,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';
import { checkAccountSyncOperationActive } from './syncOperationLease';
import {
	completeAccountSyncConflictResolutionRuntime,
	refreshAccountSyncQueueRuntime,
	upsertAccountSyncConflict,
} from './syncRuntimeState';
import { withCrossTabLock } from '@/utilities/crossTabLock';
import {
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { checkSyncMergeCanApplyAutomatically } from '@/lib/account/sync/serializers/utils';
import { accountStore as store } from '@/stores';

export type TSyncConflictResolution = TAccountSyncConflictResolution;

const CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL = 5 * 1000;
const activeJournalRecoveries = new Map<
	string,
	Promise<{ hasIsolatedJournal: boolean; recoveredCount: number }>
>();

export function withAccountSyncNamespaceTransitionLock<T>(
	userId: string,
	namespace: TSyncNamespace,
	callback: () => Promise<T> | T
) {
	return withCrossTabLock(
		`account-sync-conflict:${userId}:${namespace}`,
		callback,
		{
			fallbackTtl: CONFLICT_RESOLUTION_FALLBACK_LOCK_TTL,
			ifAvailable: true,
		}
	);
}

function recoverAccountSyncConflictResolutionJournalUnlocked(
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
) {
	const result = readAccountSyncConflictResolutionJournal(userId, namespace);

	if (result === null) {
		return { hasIsolatedJournal: false, recoveredCount: 0 };
	}
	if (result.status !== 'current') {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}

	const { journal } = result;
	if (
		journal.generationToken !== generationToken ||
		journal.resetGeneration !==
			getAccountSyncResetGenerationIdFromToken(generationToken) ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}
	const entry = readDirtyQueueEntry(userId, namespace);

	if (readIsolatedDirtyQueueNamespaces(userId).includes(namespace)) {
		return { hasIsolatedJournal: true, recoveredCount: 0 };
	}

	const serializer = getAccountSyncSerializer(namespace);
	const localHash = createSnapshotHash(serializer.getLocalSnapshot());
	const meta = readAccountSyncMeta(userId);
	const conflict = entry?.paused === 'conflict' ? entry.conflict : null;
	const action = getAccountSyncConflictResolutionRecoveryAction({
		journal,
		localHash,
		metaHash: meta?.lastAppliedRemoteHash[namespace] ?? null,
		metaRevision: meta?.revisions[namespace] ?? null,
		queue:
			entry === null
				? { kind: 'none' }
				: conflict === null
					? {
							baseRevision: entry.baseRevision,
							clientMutationId: entry.clientMutationId,
							dataHash: createSnapshotHash(entry.data),
							kind: 'dirty',
							queueOperationId: entry.queueOperationId ?? null,
							schemaVersion: entry.schema_version,
						}
					: {
							clientMutationId: entry.clientMutationId,
							cloudHash: createSnapshotHash(conflict.cloud),
							kind: 'conflict',
							localHash: createSnapshotHash(conflict.local),
							mergedHash: createSnapshotHash(conflict.merged),
							revision: conflict.revision,
							sourceLocalCollisionHash: createSnapshotHash(
								conflict.localCollision
							),
							sourceLocalCollisionToken:
								conflict.localCollision?.token ?? null,
							sourceSnapshotHash: entry.snapshotHash,
						},
	});

	if (action === 'finalize-selection') {
		if (conflict === null || entry === null) {
			return { hasIsolatedJournal: true, recoveredCount: 0 };
		}
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		const didFinalize = resolveAccountSyncConflictUnlocked({
			conflict,
			expectedEntry: entry,
			generationToken,
			...(journal.resultClientMutationId === null
				? {}
				: { resultClientMutationId: journal.resultClientMutationId }),
			resolution: journal.resolution,
			userId,
		});
		if (!didFinalize) {
			return { hasIsolatedJournal: true, recoveredCount: 0 };
		}
	}

	if (
		['accept-committed', 'finalize-selection', 'resume-conflict'].includes(
			action
		)
	) {
		removeAccountSyncConflictResolutionJournal({
			generationToken,
			namespace,
			operationId: journal.operationId,
			userId,
		});
		return { hasIsolatedJournal: false, recoveredCount: 1 };
	}

	return { hasIsolatedJournal: true, recoveredCount: 0 };
}

export function checkAccountSyncConflictResolutionJournalsPending(
	userId: string
) {
	return Object.values(SYNC_NAMESPACE_MAP).some(
		(namespace) =>
			readAccountSyncConflictResolutionJournal(userId, namespace) !== null
	);
}

export function recoverAccountSyncConflictResolutionJournals(userId: string) {
	const active = activeJournalRecoveries.get(userId);
	if (active !== undefined) {
		return active;
	}

	const generationToken = captureAccountSyncResetGeneration(userId);
	const recovery = Promise.all(
		Object.values(SYNC_NAMESPACE_MAP).map((namespace) =>
			withAccountSyncNamespaceTransitionLock(userId, namespace, () =>
				recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					namespace
				)
			)
		)
	).then((results) => ({
		hasIsolatedJournal: results.some(
			(result) => result === null || result.hasIsolatedJournal
		),
		recoveredCount: results.reduce(
			(count, result) => count + (result?.recoveredCount ?? 0),
			0
		),
	}));
	activeJournalRecoveries.set(userId, recovery);
	void recovery.finally(() => {
		if (activeJournalRecoveries.get(userId) === recovery) {
			activeJournalRecoveries.delete(userId);
		}
	});

	return recovery;
}

function getConflictResolutionData(
	conflict: ISyncConflictItem,
	resolution: TSyncConflictResolution
) {
	if (resolution.startsWith('collision:')) {
		const candidateId = resolution.slice('collision:'.length);
		return conflict.localCollision?.candidates.find(
			(candidate) => candidate.id === candidateId
		)?.data;
	}
	if (resolution === 'cloud') {
		return conflict.cloud;
	}
	if (resolution === 'merged' && conflict.merged !== null) {
		return conflict.merged;
	}

	return conflict.local;
}

function getCollisionResolutionCandidate(
	conflict: ISyncConflictItem,
	resolution: TSyncConflictResolution
) {
	if (!resolution.startsWith('collision:')) {
		return;
	}
	const candidateId = resolution.slice('collision:'.length);
	return conflict.localCollision?.candidates.find(
		(candidate) => candidate.id === candidateId
	);
}

function checkConflictSnapshotsEqual(
	left: ISyncConflictItem,
	right: ISyncConflictItem
) {
	return (
		left.revision === right.revision &&
		createSnapshotHash(left.cloud) === createSnapshotHash(right.cloud) &&
		createSnapshotHash(left.local) === createSnapshotHash(right.local) &&
		createSnapshotHash(left.localCollision) ===
			createSnapshotHash(right.localCollision) &&
		createSnapshotHash(left.merged) === createSnapshotHash(right.merged)
	);
}

function rollbackConflictSnapshot(
	serializer: ReturnType<typeof getAccountSyncSerializer>,
	previousSnapshot: unknown
) {
	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(previousSnapshot);
	});
}

function checkActiveConflictUser(userId: string) {
	return store.shared.user.get()?.id === userId;
}

function resolveAccountSyncConflictUnlocked({
	conflict,
	expectedEntry,
	generationToken,
	onStage,
	resolution,
	resultClientMutationId,
	userId,
}: {
	conflict: ISyncConflictItem;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	onStage?: (stage: TAccountSyncConflictResolutionJournalStage) => void;
	resultClientMutationId?: string;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	if (conflict.userId !== userId) {
		return false;
	}
	if (resolution === 'merged' && conflict.merged === null) {
		return false;
	}
	if (
		resolution.startsWith('collision:') &&
		getConflictResolutionData(conflict, resolution) === undefined
	) {
		return false;
	}
	if (!checkActiveConflictUser(userId)) {
		return false;
	}

	const data = getConflictResolutionData(conflict, resolution);
	const collisionCandidate = getCollisionResolutionCandidate(
		conflict,
		resolution
	);
	const resultBaseRevision =
		collisionCandidate?.baseRevision ?? conflict.revision;
	const serializer = getAccountSyncSerializer(conflict.namespace);
	const previousSnapshot = serializer.getLocalSnapshot();

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});
	onStage?.('snapshot');

	if (!checkActiveConflictUser(userId)) {
		rollbackConflictSnapshot(serializer, previousSnapshot);
		return false;
	}

	if (resolution === 'cloud' && conflict.localCollision === undefined) {
		const previousMeta = readAccountSyncMeta(userId);
		const currentUser = store.shared.user.get();
		const currentMeta = store.shared.sync.meta.get();
		const metaSource =
			previousMeta ??
			(currentUser?.id === userId &&
			currentMeta !== null &&
			currentMeta.state_epoch === currentUser.state_epoch &&
			checkAccountSyncResetWriteAllowed({
				expectedGeneration: generationToken,
				userId,
			})
				? currentMeta
				: null);

		if (metaSource === null) {
			withApplyingRemoteState(() => {
				serializer.setLocalSnapshot(previousSnapshot);
			});
			return false;
		}

		const meta = {
			...metaSource,
			lastAppliedRemoteHash: { ...metaSource.lastAppliedRemoteHash },
			revisions: { ...metaSource.revisions },
		};
		const rollbackMeta = () => {
			if (previousMeta === null) {
				return removeAccountSyncMetaIfCurrent(userId, generationToken);
			}
			writeAccountSyncMeta(userId, previousMeta, { generationToken });
			return true;
		};

		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			return false;
		}

		try {
			meta.lastAppliedRemoteHash[conflict.namespace] = createSnapshotHash(
				serializer.getLocalSnapshot()
			);
			meta.revisions[conflict.namespace] = conflict.revision;
			writeAccountSyncMeta(userId, meta, { generationToken });
			onStage?.('state');
		} catch (error) {
			withApplyingRemoteState(() => {
				try {
					serializer.setLocalSnapshot(previousSnapshot);
				} catch {
					/* best-effort rollback */
				}
			});

			try {
				rollbackMeta();
			} catch (writeError) {
				console.warn(
					'Failed to restore account sync meta after conflict rollback.',
					writeError
				);
			}

			throw error;
		}

		if (
			!removePausedConflictEntryIfCurrent({
				expectedEntry,
				generationToken,
				userId,
			})
		) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			try {
				rollbackMeta();
			} catch (writeError) {
				console.warn(
					'Failed to restore account sync meta after stale conflict resolution.',
					writeError
				);
			}
			return false;
		}

		writeAccountSyncBaseSnapshot({
			data,
			generationToken,
			namespace: conflict.namespace,
			revision: conflict.revision,
			userId,
		});
		completeAccountSyncConflictResolutionRuntime(
			userId,
			conflict.namespace,
			expectedEntry.clientMutationId
		);
		onStage?.('runtime');

		return true;
	}

	let entry;
	try {
		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);
			return false;
		}

		entry = replacePausedConflictWithDirtyIfCurrent({
			baseRevision: resultBaseRevision,
			...(resultClientMutationId === undefined
				? {}
				: { clientMutationId: resultClientMutationId }),
			data,
			expectedEntry,
			generationToken,
			userId,
		});
	} catch (error) {
		withApplyingRemoteState(() => {
			serializer.setLocalSnapshot(previousSnapshot);
		});
		throw error;
	}

	if (entry === null) {
		withApplyingRemoteState(() => {
			serializer.setLocalSnapshot(previousSnapshot);
		});
		return false;
	}
	if (
		conflict.localCollision !== undefined &&
		!clearDirtyQueueCollisionEvidence(
			generationToken,
			userId,
			conflict.namespace
		)
	) {
		throw new Error('dirty-collision-evidence-cleanup-failed');
	}

	if (conflict.localCollision === undefined) {
		writeAccountSyncBaseSnapshot({
			data: conflict.cloud,
			generationToken,
			namespace: conflict.namespace,
			revision: conflict.revision,
			userId,
		});
	} else if (
		readAccountSyncBaseSnapshot(
			userId,
			conflict.namespace,
			resultBaseRevision,
			serializer
		) === null
	) {
		removeAccountSyncBaseSnapshot(
			userId,
			conflict.namespace,
			generationToken
		);
	}
	onStage?.('state');

	completeAccountSyncConflictResolutionRuntime(
		userId,
		conflict.namespace,
		expectedEntry.clientMutationId
	);
	onStage?.('runtime');

	return true;
}

async function commitAccountSyncConflictResolution({
	conflict,
	entry,
	generationToken,
	resolution,
	userId,
}: {
	conflict: ISyncConflictItem;
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	readDirtyQueueEntry(userId, conflict.namespace);

	if (readIsolatedDirtyQueueNamespaces(userId).includes(conflict.namespace)) {
		return false;
	}
	if (
		readAccountSyncConflictResolutionJournal(userId, conflict.namespace) !==
		null
	) {
		return false;
	}

	const operationId = createAccountClientId();
	const selected = getConflictResolutionData(conflict, resolution);
	const selectedHash = createSnapshotHash(selected);
	const resultBaseRevision =
		getCollisionResolutionCandidate(conflict, resolution)?.baseRevision ??
		conflict.revision;
	const willCreateDirty =
		resolution !== 'cloud' || conflict.localCollision !== undefined;
	const resultClientMutationId = willCreateDirty
		? createAccountClientId()
		: null;
	const journal = {
		clientMutationId: entry.clientMutationId,
		cloudHash: createSnapshotHash(conflict.cloud),
		createdAt: Date.now(),
		generationToken,
		localHash: createSnapshotHash(conflict.local),
		mergedHash: createSnapshotHash(conflict.merged),
		namespace: conflict.namespace,
		operationId,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		resolution,
		resultBaseRevision: willCreateDirty ? resultBaseRevision : null,
		resultClientMutationId,
		resultQueueOperationId:
			resultClientMutationId === null
				? null
				: `queue-${resultClientMutationId}`,
		resultSchemaVersion: willCreateDirty
			? SYNC_SCHEMA_VERSION_MAP[conflict.namespace]
			: null,
		revision: conflict.revision,
		selectedHash,
		sourceLocalCollisionHash: createSnapshotHash(conflict.localCollision),
		sourceLocalCollisionToken: conflict.localCollision?.token ?? null,
		sourceSnapshotHash: entry.snapshotHash,
		stage: 'prepared' as const,
		userId,
		version: 2 as const,
	};

	const transactionResult = await withAccountSyncMetaTransitionLock(
		userId,
		generationToken,
		() =>
			runAccountSyncConflictResolutionJournalTransaction({
				checkCurrent: () => {
					if (
						!checkActiveConflictUser(userId) ||
						readIsolatedDirtyQueueNamespaces(userId).includes(
							conflict.namespace
						)
					) {
						return false;
					}
					const currentEntry = readDirtyQueueEntry(
						userId,
						conflict.namespace
					);
					return resolution === 'cloud'
						? currentEntry === null
						: currentEntry?.paused === null &&
								currentEntry.baseRevision ===
									resultBaseRevision &&
								checkSnapshotHashMatches(
									currentEntry.data,
									selectedHash
								);
				},
				execute: (advanceJournal) => {
					const advance = (
						stage: TAccountSyncConflictResolutionJournalStage
					) => {
						const currentEntry = readDirtyQueueEntry(
							userId,
							conflict.namespace
						);
						if (
							readIsolatedDirtyQueueNamespaces(userId).includes(
								conflict.namespace
							)
						) {
							throw new Error('dirty-storage-generation-changed');
						}
						const matchesSourceConflict =
							currentEntry?.paused === 'conflict' &&
							currentEntry.clientMutationId ===
								entry.clientMutationId &&
							currentEntry.snapshotHash === entry.snapshotHash &&
							currentEntry.conflict !== null &&
							checkConflictSnapshotsEqual(
								currentEntry.conflict,
								conflict
							);
						const matchesSelectedDirty =
							currentEntry?.paused === null &&
							currentEntry.baseRevision === resultBaseRevision &&
							checkSnapshotHashMatches(
								currentEntry.data,
								selectedHash
							);
						const hasExpectedState =
							stage === 'snapshot' ||
							(stage === 'state' && resolution === 'cloud')
								? matchesSourceConflict
								: resolution === 'cloud'
									? currentEntry === null
									: matchesSelectedDirty;
						if (!hasExpectedState) {
							throw new Error('dirty-storage-generation-changed');
						}
						advanceJournal(stage);
					};
					return resolveAccountSyncConflictUnlocked({
						conflict,
						expectedEntry: entry,
						generationToken,
						onStage: advance,
						...(resultClientMutationId === null
							? {}
							: { resultClientMutationId }),
						resolution,
						userId,
					});
				},
				generationToken,
				journal,
			})
	);

	return transactionResult === true;
}

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
	const user = store.shared.user.get();
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

export async function reconcileAccountSyncDirtyQueueCollision({
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
}) {
	const generationToken =
		providedGenerationToken === undefined
			? captureAccountSyncResetGeneration(userId)
			: providedGenerationToken;
	if (checkAccountSyncOperationActive(userId)) {
		return false;
	}
	const result = await withAccountSyncNamespaceTransitionLock(
		userId,
		conflict.namespace,
		async () => {
			if (checkAccountSyncOperationActive(userId)) {
				return false;
			}

			const recovery =
				recoverAccountSyncConflictResolutionJournalUnlocked(
					generationToken,
					userId,
					conflict.namespace
				);
			if (recovery.hasIsolatedJournal) {
				return false;
			}

			const entry = readDirtyQueueEntry(userId, conflict.namespace);
			if (
				entry?.paused !== 'conflict' ||
				entry.conflict === null ||
				!checkSnapshotHashMatches(
					entry.conflict.cloud,
					createSnapshotHash(conflict.cloud)
				) ||
				!checkSnapshotHashMatches(
					entry.conflict.local,
					createSnapshotHash(conflict.local)
				) ||
				!checkSnapshotHashMatches(
					entry.conflict.merged,
					createSnapshotHash(conflict.merged)
				) ||
				entry.conflict.userId !== userId ||
				entry.conflict.revision !== conflict.revision
			) {
				return false;
			}

			return commitAccountSyncConflictResolution({
				conflict,
				entry,
				generationToken,
				resolution,
				userId,
			});
		}
	);

	return result === true;
}
