import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { accountStore } from '@/features/account/client/state/accountStore';
import { readAccountSyncBaseSnapshot } from '@/features/account/client/sync/baseSnapshot';
import {
	getAccountSyncConflictResolutionRecoveryAction,
	readAccountSyncConflictResolutionJournal,
	removeAccountSyncConflictResolutionJournalIfRawCurrent,
} from '@/features/account/client/sync/conflictResolutionJournal';
import {
	createDirtyQueueNamespaceGenerationHash,
	readDirtyQueueCollisionState,
	readDirtyQueueEntry,
	readIsolatedDirtyQueueNamespaces,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import {
	checkSnapshotHashMatches,
	createSnapshotHash,
} from '@/features/account/client/sync/dirtyQueue/snapshotHash';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationIdFromToken,
} from '@/features/account/client/sync/resetGeneration';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
} from '@/features/account/client/sync/snapshot';
import type {
	IDirtyQueueEntry,
	ISyncNamespaceSerializer,
} from '@/features/account/sync/types';

import { resolveAccountSyncConflictUnlocked } from './resolution';
import { withAccountSyncNamespaceTransitionLock } from './transitionLock';

export type TAccountSyncConflictJournalRecoveryStatus =
	| 'busy'
	| 'none'
	| 'recovered'
	| 'stale'
	| 'storage-unavailable'
	| 'unsupported';

export interface IAccountSyncConflictJournalRecoveryResult {
	recoveredCount: number;
	status: TAccountSyncConflictJournalRecoveryStatus;
}

export interface IAccountSyncConflictJournalRecoverySummary {
	hasIsolatedJournal: boolean;
	recoveredCount: number;
	results: Partial<
		Record<TSyncNamespace, IAccountSyncConflictJournalRecoveryResult>
	>;
}

interface IStaleJournalRetirementEvidence {
	baseHash: string;
	entry: IDirtyQueueEntry;
	entryHash: string;
	metaHash: string;
	queueGenerationHash: string;
}

const activeJournalRecoveries = new Map<
	string,
	Promise<IAccountSyncConflictJournalRecoverySummary>
>();

function createRecoveryResult(
	status: TAccountSyncConflictJournalRecoveryStatus,
	recoveredCount = 0
): IAccountSyncConflictJournalRecoveryResult {
	return { recoveredCount, status };
}

function checkSnapshotSupported(
	serializer: ISyncNamespaceSerializer<unknown>,
	data: unknown,
	schemaVersion?: number
) {
	try {
		const snapshot =
			schemaVersion === undefined
				? serializer.deserialize(data)
				: serializer.migrate(data, schemaVersion);
		return serializer.validate(snapshot);
	} catch {
		return false;
	}
}

function captureStaleJournalRetirementEvidence({
	generationToken,
	namespace,
	userId,
}: {
	generationToken: string | null;
	namespace: TSyncNamespace;
	userId: string;
}): IStaleJournalRetirementEvidence | null {
	if (
		accountStore.shared.user.get()?.id !== userId ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return null;
	}

	const entry = readDirtyQueueEntry(userId, namespace);
	if (
		entry?.paused !== 'conflict' ||
		entry.conflict === null ||
		readIsolatedDirtyQueueNamespaces(userId).includes(namespace) ||
		readDirtyQueueCollisionState(userId, namespace) !== null
	) {
		return null;
	}

	const serializer = getAccountSyncSerializer(namespace);
	const {
		baseRevision,
		conflict,
		data,
		schema_version: schemaVersion,
		snapshotHash,
	} = entry;
	const local = serializer.getLocalSnapshot();
	if (
		!serializer.validate(local) ||
		!checkSnapshotSupported(serializer, data, schemaVersion) ||
		!checkSnapshotSupported(serializer, conflict.cloud) ||
		!checkSnapshotSupported(serializer, conflict.local) ||
		(conflict.merged !== null &&
			!checkSnapshotSupported(serializer, conflict.merged)) ||
		!checkSnapshotHashMatches(conflict.local, snapshotHash) ||
		conflict.localCollision?.candidates.some(
			(candidate) =>
				!checkSnapshotSupported(
					serializer,
					candidate.data,
					candidate.schemaVersion
				)
		) === true
	) {
		return null;
	}

	const meta = readAccountSyncMeta(userId);
	const base = readAccountSyncBaseSnapshot(
		userId,
		namespace,
		baseRevision,
		serializer
	);
	return {
		baseHash: createSnapshotHash(base),
		entry,
		entryHash: createSnapshotHash(entry),
		metaHash: createSnapshotHash(meta),
		queueGenerationHash: createDirtyQueueNamespaceGenerationHash(
			userId,
			namespace
		),
	};
}

function checkStaleJournalRetirementEvidenceCurrent({
	evidence,
	generationToken,
	namespace,
	userId,
}: {
	evidence: IStaleJournalRetirementEvidence;
	generationToken: string | null;
	namespace: TSyncNamespace;
	userId: string;
}) {
	if (
		accountStore.shared.user.get()?.id !== userId ||
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		}) ||
		readIsolatedDirtyQueueNamespaces(userId).includes(namespace) ||
		readDirtyQueueCollisionState(userId, namespace) !== null ||
		createDirtyQueueNamespaceGenerationHash(userId, namespace) !==
			evidence.queueGenerationHash ||
		createSnapshotHash(readAccountSyncMeta(userId)) !== evidence.metaHash
	) {
		return false;
	}

	const currentEntry = readDirtyQueueEntry(userId, namespace);
	if (
		currentEntry?.paused !== 'conflict' ||
		currentEntry.conflict === null ||
		createSnapshotHash(currentEntry) !== evidence.entryHash
	) {
		return false;
	}
	const serializer = getAccountSyncSerializer(namespace);
	const currentBase = readAccountSyncBaseSnapshot(
		userId,
		namespace,
		currentEntry.baseRevision,
		serializer
	);
	const currentLocal = serializer.getLocalSnapshot();
	return (
		createSnapshotHash(currentBase) === evidence.baseHash &&
		serializer.validate(currentLocal)
	);
}

async function retireStaleJournal({
	generationToken,
	namespace,
	raw,
	userId,
}: {
	generationToken: string | null;
	namespace: TSyncNamespace;
	raw: string;
	userId: string;
}) {
	const evidence = captureStaleJournalRetirementEvidence({
		generationToken,
		namespace,
		userId,
	});
	if (evidence === null) {
		return createRecoveryResult('unsupported');
	}
	if (
		readAccountSyncConflictResolutionJournal(userId, namespace)?.raw !==
			raw ||
		!checkStaleJournalRetirementEvidenceCurrent({
			evidence,
			generationToken,
			namespace,
			userId,
		})
	) {
		return createRecoveryResult('stale');
	}

	const removal =
		await removeAccountSyncConflictResolutionJournalIfRawCurrent({
			expectedRaw: raw,
			generationToken,
			namespace,
			userId,
		});
	if (removal !== 'removed') {
		return createRecoveryResult(removal);
	}
	if (
		readAccountSyncConflictResolutionJournal(userId, namespace) !== null ||
		!checkStaleJournalRetirementEvidenceCurrent({
			evidence,
			generationToken,
			namespace,
			userId,
		})
	) {
		return createRecoveryResult('stale');
	}

	return createRecoveryResult('recovered', 1);
}

export async function recoverAccountSyncConflictResolutionJournalUnlocked(
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
): Promise<IAccountSyncConflictJournalRecoveryResult> {
	const result = readAccountSyncConflictResolutionJournal(userId, namespace);

	if (result === null) {
		return createRecoveryResult('none');
	}
	if (result.status === 'future') {
		return createRecoveryResult('unsupported');
	}
	if (result.status !== 'current') {
		return retireStaleJournal({
			generationToken,
			namespace,
			raw: result.raw,
			userId,
		});
	}

	const { journal, raw } = result;
	const canRecoverNormally =
		journal.generationToken === generationToken &&
		journal.resetGeneration ===
			getAccountSyncResetGenerationIdFromToken(generationToken) &&
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		});
	if (!canRecoverNormally) {
		return retireStaleJournal({ generationToken, namespace, raw, userId });
	}

	const entry = readDirtyQueueEntry(userId, namespace);
	if (readIsolatedDirtyQueueNamespaces(userId).includes(namespace)) {
		return createRecoveryResult('unsupported');
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

	if (action === 'isolate') {
		return retireStaleJournal({ generationToken, namespace, raw, userId });
	}
	if (action === 'finalize-selection') {
		if (conflict === null || entry === null) {
			return createRecoveryResult('stale');
		}
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
			return createRecoveryResult('stale');
		}
	}

	const removal =
		await removeAccountSyncConflictResolutionJournalIfRawCurrent({
			expectedRaw: raw,
			generationToken,
			namespace,
			userId,
		});
	return removal === 'removed'
		? createRecoveryResult('recovered', 1)
		: createRecoveryResult(removal);
}

export function checkAccountSyncConflictResolutionJournalsPending(
	userId: string
) {
	return Object.values(SYNC_NAMESPACE_MAP).some(
		(namespace) =>
			readAccountSyncConflictResolutionJournal(userId, namespace) !== null
	);
}

export function readAccountSyncConflictResolutionJournalNamespaces(
	userId: string
) {
	return Object.values(SYNC_NAMESPACE_MAP).filter(
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
		Object.values(SYNC_NAMESPACE_MAP).map(async (namespace) => ({
			namespace,
			result: await withAccountSyncNamespaceTransitionLock(
				userId,
				namespace,
				() =>
					recoverAccountSyncConflictResolutionJournalUnlocked(
						generationToken,
						userId,
						namespace
					)
			),
		}))
	).then((namespaceResults) => {
		const results: IAccountSyncConflictJournalRecoverySummary['results'] =
			{};
		let recoveredCount = 0;
		let hasIsolatedJournal = false;
		for (const { namespace, result } of namespaceResults) {
			const resolvedResult = result ?? createRecoveryResult('busy');
			results[namespace] = resolvedResult;
			recoveredCount += resolvedResult.recoveredCount;
			hasIsolatedJournal ||= !['none', 'recovered'].includes(
				resolvedResult.status
			);
		}
		return { hasIsolatedJournal, recoveredCount, results };
	});
	activeJournalRecoveries.set(userId, recovery);
	void recovery
		.finally(() => {
			if (activeJournalRecoveries.get(userId) === recovery) {
				activeJournalRecoveries.delete(userId);
			}
		})
		.catch(() => {});

	return recovery;
}
