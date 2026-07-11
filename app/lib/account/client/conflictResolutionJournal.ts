import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { checkAccountSyncResetWriteAllowed } from './resetGeneration';
import { SYNC_NAMESPACE_MAP, type TSyncNamespace } from '@/lib/account/sync';

export type TAccountSyncConflictResolution =
	| 'cloud'
	| `collision:${string}`
	| 'local'
	| 'merged';
export type TAccountSyncConflictResolutionJournalStage =
	| 'committed'
	| 'prepared'
	| 'runtime'
	| 'snapshot'
	| 'state';

export interface IAccountSyncConflictResolutionJournal {
	clientMutationId: string;
	cloudHash: string;
	createdAt: number;
	localHash: string;
	mergedHash: string;
	namespace: TSyncNamespace;
	operationId: string;
	resolution: TAccountSyncConflictResolution;
	generationToken: string | null;
	resetGeneration: string | null;
	resultBaseRevision: number | null;
	resultClientMutationId: string | null;
	resultQueueOperationId: string | null;
	resultSchemaVersion: number | null;
	revision: number;
	selectedHash: string;
	sourceLocalCollisionHash: string;
	sourceLocalCollisionToken: string | null;
	sourceSnapshotHash: string;
	stage: TAccountSyncConflictResolutionJournalStage;
	userId: string;
	version: 2;
}

type TAccountSyncConflictResolutionJournalReadResult =
	| { journal: IAccountSyncConflictResolutionJournal; status: 'current' }
	| { status: 'invalid'; version: number | null }
	| { status: 'legacy'; version: 1 }
	| { status: 'future'; version: number };

type TAccountSyncConflictResolutionQueueObservation =
	| {
			clientMutationId: string;
			cloudHash: string;
			kind: 'conflict';
			localHash: string;
			mergedHash: string;
			revision: number;
			sourceLocalCollisionHash: string;
			sourceLocalCollisionToken: string | null;
			sourceSnapshotHash: string;
	  }
	| {
			baseRevision: number;
			clientMutationId: string;
			dataHash: string;
			kind: 'dirty';
			queueOperationId: string | null;
			schemaVersion: number;
	  }
	| { kind: 'none' };

export type TAccountSyncConflictResolutionRecoveryAction =
	| 'accept-committed'
	| 'finalize-selection'
	| 'isolate'
	| 'resume-conflict';

const JOURNAL_VERSION = 2;
const MAX_JOURNAL_STRING_LENGTH = 256;
const MAX_GENERATION_TOKEN_LENGTH = 1024;
const NAMESPACE_SET = new Set<string>(Object.values(SYNC_NAMESPACE_MAP));
const RESOLUTION_SET = new Set<TAccountSyncConflictResolution>([
	'cloud',
	'local',
	'merged',
]);

function checkConflictResolution(
	value: unknown
): value is TAccountSyncConflictResolution {
	return (
		RESOLUTION_SET.has(value as TAccountSyncConflictResolution) ||
		(typeof value === 'string' &&
			value.startsWith('collision:') &&
			value.length > 'collision:'.length &&
			value.length <= MAX_JOURNAL_STRING_LENGTH)
	);
}
const STAGE_ORDER: Record<TAccountSyncConflictResolutionJournalStage, number> =
	{ committed: 4, prepared: 0, runtime: 3, snapshot: 1, state: 2 };

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkBoundedString(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length > 0 &&
		value.length <= MAX_JOURNAL_STRING_LENGTH
	);
}

function checkNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

export function getAccountSyncConflictResolutionRecoveryAction({
	journal,
	localHash,
	metaHash,
	metaRevision,
	queue,
}: {
	journal: IAccountSyncConflictResolutionJournal;
	localHash: string;
	metaHash: null | string;
	metaRevision: null | number;
	queue: TAccountSyncConflictResolutionQueueObservation;
}): TAccountSyncConflictResolutionRecoveryAction {
	if (queue.kind === 'conflict') {
		const matchesSource =
			queue.clientMutationId === journal.clientMutationId &&
			queue.sourceSnapshotHash === journal.sourceSnapshotHash &&
			queue.cloudHash === journal.cloudHash &&
			queue.localHash === journal.localHash &&
			queue.mergedHash === journal.mergedHash &&
			queue.revision === journal.revision;
		const matchesCollisionSource =
			queue.sourceLocalCollisionHash ===
				journal.sourceLocalCollisionHash &&
			queue.sourceLocalCollisionToken ===
				journal.sourceLocalCollisionToken;
		if (!matchesSource || !matchesCollisionSource) {
			return 'isolate';
		}

		return localHash === journal.selectedHash
			? 'finalize-selection'
			: 'resume-conflict';
	}
	if (queue.kind === 'dirty') {
		return queue.dataHash === journal.selectedHash &&
			queue.baseRevision === journal.resultBaseRevision &&
			queue.clientMutationId === journal.resultClientMutationId &&
			queue.queueOperationId === journal.resultQueueOperationId &&
			queue.schemaVersion === journal.resultSchemaVersion
			? 'accept-committed'
			: 'isolate';
	}
	if (
		metaRevision !== null &&
		metaRevision >= journal.revision &&
		(localHash === journal.selectedHash ||
			metaHash === journal.selectedHash)
	) {
		return 'accept-committed';
	}

	return 'isolate';
}

export function createAccountSyncConflictResolutionJournalKey(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.conflictResolution,
		userId,
		namespace
	);
}

export function parseAccountSyncConflictResolutionJournalValue({
	namespace,
	userId,
	value,
}: {
	namespace: TSyncNamespace;
	userId: string;
	value: string;
}): TAccountSyncConflictResolutionJournalReadResult | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return { status: 'invalid', version: null };
	}
	if (!checkPlainObject(parsed)) {
		return { status: 'invalid', version: null };
	}
	if (parsed['version'] === 1) {
		return { status: 'legacy', version: 1 };
	}
	if (
		checkNonNegativeSafeInteger(parsed['version']) &&
		parsed['version'] > JOURNAL_VERSION
	) {
		return { status: 'future', version: parsed['version'] };
	}

	const {
		clientMutationId,
		cloudHash,
		createdAt,
		generationToken,
		localHash,
		mergedHash,
		namespace: storedNamespace,
		operationId,
		resetGeneration,
		resolution,
		resultBaseRevision,
		resultClientMutationId,
		resultQueueOperationId,
		resultSchemaVersion,
		revision,
		selectedHash,
		sourceLocalCollisionHash,
		sourceLocalCollisionToken,
		sourceSnapshotHash,
		stage,
		userId: storedUserId,
		version,
	} = parsed;

	if (
		version !== JOURNAL_VERSION ||
		storedNamespace !== namespace ||
		storedUserId !== userId ||
		!NAMESPACE_SET.has(storedNamespace as string) ||
		!checkBoundedString(clientMutationId) ||
		!checkBoundedString(cloudHash) ||
		!checkBoundedString(localHash) ||
		!checkBoundedString(mergedHash) ||
		!checkBoundedString(operationId) ||
		(generationToken !== null &&
			(typeof generationToken !== 'string' ||
				generationToken.length === 0 ||
				generationToken.length > MAX_GENERATION_TOKEN_LENGTH)) ||
		!checkBoundedString(selectedHash) ||
		!checkBoundedString(sourceLocalCollisionHash) ||
		(sourceLocalCollisionToken !== null &&
			!checkBoundedString(sourceLocalCollisionToken)) ||
		!checkBoundedString(sourceSnapshotHash) ||
		!checkConflictResolution(resolution) ||
		(resetGeneration !== null && !checkBoundedString(resetGeneration)) ||
		(resultBaseRevision !== null &&
			!checkNonNegativeSafeInteger(resultBaseRevision)) ||
		(resultClientMutationId !== null &&
			!checkBoundedString(resultClientMutationId)) ||
		(resultQueueOperationId !== null &&
			!checkBoundedString(resultQueueOperationId)) ||
		(resultSchemaVersion !== null &&
			!checkNonNegativeSafeInteger(resultSchemaVersion)) ||
		typeof stage !== 'string' ||
		!(stage in STAGE_ORDER) ||
		!checkNonNegativeSafeInteger(createdAt) ||
		!checkNonNegativeSafeInteger(revision)
	) {
		return {
			status: 'invalid',
			version: checkNonNegativeSafeInteger(version) ? version : null,
		};
	}

	return {
		journal: {
			clientMutationId,
			cloudHash,
			createdAt,
			generationToken,
			localHash,
			mergedHash,
			namespace,
			operationId,
			resetGeneration,
			resolution,
			resultBaseRevision,
			resultClientMutationId,
			resultQueueOperationId,
			resultSchemaVersion,
			revision,
			selectedHash,
			sourceLocalCollisionHash,
			sourceLocalCollisionToken,
			sourceSnapshotHash,
			stage: stage as TAccountSyncConflictResolutionJournalStage,
			userId,
			version: 2,
		},
		status: 'current',
	};
}

export function readAccountSyncConflictResolutionJournal(
	userId: string,
	namespace: TSyncNamespace
): TAccountSyncConflictResolutionJournalReadResult | null {
	const key = createAccountSyncConflictResolutionJournalKey(
		userId,
		namespace
	);

	const value = readAccountStorage(key);
	if (value === null) {
		return null;
	}

	const result = parseAccountSyncConflictResolutionJournalValue({
		namespace,
		userId,
		value,
	});
	return result;
}

export function writeAccountSyncConflictResolutionJournal(
	journal: IAccountSyncConflictResolutionJournal,
	generationToken: string | null,
	resetOperationId?: string
) {
	if (journal.generationToken !== generationToken) {
		return false;
	}
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId: journal.userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	const key = createAccountSyncConflictResolutionJournalKey(
		journal.userId,
		journal.namespace
	);
	if (readAccountStorage(key) !== null) {
		return false;
	}

	writeAccountJsonStorage(key, journal);

	return checkGeneration();
}

export function advanceAccountSyncConflictResolutionJournal({
	generationToken,
	namespace,
	operationId,
	resetOperationId,
	stage,
	userId,
}: {
	generationToken: string | null;
	namespace: TSyncNamespace;
	operationId: string;
	stage: TAccountSyncConflictResolutionJournalStage;
	resetOperationId?: string;
	userId: string;
}) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	const current = readAccountSyncConflictResolutionJournal(userId, namespace);
	if (
		current?.status !== 'current' ||
		current.journal.generationToken !== generationToken ||
		current.journal.operationId !== operationId ||
		STAGE_ORDER[stage] < STAGE_ORDER[current.journal.stage]
	) {
		return false;
	}

	writeAccountJsonStorage(
		createAccountSyncConflictResolutionJournalKey(userId, namespace),
		{ ...current.journal, stage }
	);

	return checkGeneration();
}

export function removeAccountSyncConflictResolutionJournal({
	generationToken,
	namespace,
	operationId,
	resetOperationId,
	userId,
}: {
	generationToken: string | null;
	namespace: TSyncNamespace;
	operationId: string;
	resetOperationId?: string;
	userId: string;
}) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	const current = readAccountSyncConflictResolutionJournal(userId, namespace);
	if (
		current?.status !== 'current' ||
		current.journal.generationToken !== generationToken ||
		current.journal.operationId !== operationId
	) {
		return false;
	}

	removeAccountStorage(
		createAccountSyncConflictResolutionJournalKey(userId, namespace)
	);

	return checkGeneration();
}

export function removeAccountSyncConflictResolutionJournals(userId: string) {
	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		removeAccountStorage(
			createAccountSyncConflictResolutionJournalKey(userId, namespace)
		);
	}
}

function waitForAccountSyncStorageMutationDelivery() {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, 0);
	});
}

export async function runAccountSyncConflictResolutionJournalTransaction({
	checkCurrent,
	execute,
	generationToken,
	journal,
}: {
	checkCurrent?: () => boolean;
	execute: (
		advance: (stage: TAccountSyncConflictResolutionJournalStage) => void
	) => boolean;
	generationToken: string | null;
	journal: IAccountSyncConflictResolutionJournal;
}) {
	if (!writeAccountSyncConflictResolutionJournal(journal, generationToken)) {
		return false;
	}

	const advance = (stage: TAccountSyncConflictResolutionJournalStage) => {
		if (
			!advanceAccountSyncConflictResolutionJournal({
				generationToken,
				namespace: journal.namespace,
				operationId: journal.operationId,
				stage,
				userId: journal.userId,
			})
		) {
			throw new Error('conflict-resolution-journal-stale');
		}
	};

	const didExecute = execute(advance);
	if (!didExecute) {
		const current = readAccountSyncConflictResolutionJournal(
			journal.userId,
			journal.namespace
		);
		if (
			current?.status === 'current' &&
			current.journal.operationId === journal.operationId &&
			current.journal.stage === 'prepared'
		) {
			removeAccountSyncConflictResolutionJournal({
				generationToken,
				namespace: journal.namespace,
				operationId: journal.operationId,
				userId: journal.userId,
			});
		}

		return false;
	}

	await waitForAccountSyncStorageMutationDelivery();
	if (checkCurrent?.() === false) {
		return false;
	}

	advance('committed');
	removeAccountSyncConflictResolutionJournal({
		generationToken,
		namespace: journal.namespace,
		operationId: journal.operationId,
		userId: journal.userId,
	});

	return true;
}
