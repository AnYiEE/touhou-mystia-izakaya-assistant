import { sha1 } from 'js-sha1';

import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	getAccountStorageKeys,
	readAccountJsonStorage,
	readAccountStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from '@/features/account/client/storage';
import {
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationId,
	getAccountSyncResetGenerationIdFromToken,
} from '@/features/account/client/sync/resetGeneration';
import { checkSupportedSyncSchemaVersion } from '@/features/account/sync/constants';
import type {
	IDirtyQueueEntry,
	TSyncPausedReason,
} from '@/features/account/sync/types';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import {
	createDirtyQueueEvidencePrefix,
	createDirtyQueueIntentKey,
	createDirtyQueueIntentPrefix,
	createDirtyQueueKey,
	createLegacyDirtyQueueKey,
} from './keys';
import { checkSnapshotHashMatches, createSnapshotHash } from './snapshotHash';
import {
	type IDirtyQueueEvidence,
	type IDirtyQueueIntent,
	MAX_LOCAL_COLLISION_STRING_LENGTH,
	SYNC_PAUSED_REASON_SET,
	type TDirtyQueueIntentPayload,
	checkDirtyQueueConflict,
	checkFutureSchemaDirtyQueueEntry,
	checkSyncRevision,
	createDirtyQueueIntentHash,
	parseDirtyQueueEvidence,
	parseDirtyQueueIntent,
} from './validation';

export const isolatedFutureSchemaNamespaces = new Map<
	string,
	Set<TSyncNamespace>
>();

const dirtyIntentCollisionNamespaces = new Map<string, Set<TSyncNamespace>>();

const DIRTY_QUEUE_COLLISION_SOURCE_LABEL_MAP = {
	canonicalQueue: '兼容队列版本',
	legacyQueue: '旧标签页版本',
	nextClient: '新客户端保留版本',
	preMigration: '转换前保留版本',
} as const;

function setDirtyIntentCollisionDetected(
	userId: string,
	namespace: TSyncNamespace,
	isDetected: boolean
) {
	const namespaces =
		dirtyIntentCollisionNamespaces.get(userId) ?? new Set<TSyncNamespace>();
	if (isDetected) {
		namespaces.add(namespace);
		dirtyIntentCollisionNamespaces.set(userId, namespaces);
		return;
	}

	namespaces.delete(namespace);
	if (namespaces.size === 0) {
		dirtyIntentCollisionNamespaces.delete(userId);
	}
}

function setFutureSchemaIsolationDetected(
	userId: string,
	namespace: TSyncNamespace,
	isDetected: boolean
) {
	const namespaces =
		isolatedFutureSchemaNamespaces.get(userId) ?? new Set<TSyncNamespace>();
	if (isDetected) {
		namespaces.add(namespace);
		isolatedFutureSchemaNamespaces.set(userId, namespaces);
		return;
	}

	namespaces.delete(namespace);
	if (namespaces.size === 0) {
		isolatedFutureSchemaNamespaces.delete(userId);
	}
}

function sanitizeDirtyQueueEntry({
	entry,
	namespace,
	userId,
}: {
	entry: unknown;
	namespace: TSyncNamespace;
	userId: string;
}) {
	const rejectInvalidEntry = () => {
		setDirtyIntentCollisionDetected(userId, namespace, true);
		return { status: 'invalid' as const };
	};
	if (checkFutureSchemaDirtyQueueEntry(entry, namespace)) {
		return { status: 'future' as const };
	}

	if (
		!isObjectTagRecord(entry) ||
		!('data' in entry) ||
		entry['namespace'] !== namespace ||
		!checkSupportedSyncSchemaVersion(namespace, entry['schema_version']) ||
		!isNonNegativeSafeInteger(entry['attempts']) ||
		!checkSyncRevision(entry['baseRevision']) ||
		!isNonNegativeSafeInteger(entry['dirtyAt']) ||
		typeof entry['clientMutationId'] !== 'string' ||
		entry['clientMutationId'] === '' ||
		typeof entry['snapshotHash'] !== 'string' ||
		entry['snapshotHash'] === '' ||
		(entry['lastError'] !== null &&
			typeof entry['lastError'] !== 'string') ||
		!SYNC_PAUSED_REASON_SET.has(
			entry['paused'] as TSyncPausedReason | null
		) ||
		(entry['queueOperationId'] !== undefined &&
			(typeof entry['queueOperationId'] !== 'string' ||
				entry['queueOperationId'].length === 0 ||
				entry['queueOperationId'].length >
					MAX_LOCAL_COLLISION_STRING_LENGTH))
	) {
		return rejectInvalidEntry();
	}

	if (!checkSnapshotHashMatches(entry['data'], entry['snapshotHash'])) {
		return rejectInvalidEntry();
	}

	if (entry['paused'] === 'conflict') {
		if (!checkDirtyQueueConflict(entry['conflict'], namespace, userId)) {
			return rejectInvalidEntry();
		}
	} else if (entry['conflict'] !== null) {
		return rejectInvalidEntry();
	}

	return {
		entry: entry as unknown as IDirtyQueueEntry,
		status: 'current' as const,
	};
}

function sanitizeDirtyQueueRawValue({
	namespace,
	rawValue,
	userId,
}: {
	namespace: TSyncNamespace;
	rawValue: string | null;
	userId: string;
}) {
	if (rawValue === null) {
		return { status: 'none' as const };
	}

	let entry: unknown;
	try {
		entry = JSON.parse(rawValue);
	} catch {
		entry = null;
	}
	return sanitizeDirtyQueueEntry({ entry, namespace, userId });
}

function readDirtyQueueEvidence(userId: string, namespace: TSyncNamespace) {
	const evidence: IDirtyQueueEvidence[] = [];
	let invalidCount = 0;
	for (const key of getAccountStorageKeys(
		createDirtyQueueEvidencePrefix(userId, namespace)
	)) {
		const rawValue = readAccountStorage(key);
		let value: unknown = null;
		try {
			value = rawValue === null ? null : JSON.parse(rawValue);
		} catch {
			invalidCount += 1;
			continue;
		}
		const parsed = parseDirtyQueueEvidence(value, userId, namespace);
		if (parsed === null) {
			invalidCount += 1;
			continue;
		}
		evidence.push(parsed);
	}
	return { evidence, invalidCount };
}

export function readDirtyQueueIntents(
	userId: string,
	namespace: TSyncNamespace
) {
	const intents: IDirtyQueueIntent[] = [];
	const invalidIntents: Array<{ key: string; value: string }> = [];
	const quarantinedEvidence = readDirtyQueueEvidence(userId, namespace);
	const checkAlreadyQuarantined = (key: string, value: string) =>
		quarantinedEvidence.evidence.some(
			(item) =>
				item.sourceKey === key &&
				item.rawHash === createSnapshotHash(value)
		);
	for (const key of getAccountStorageKeys(
		createDirtyQueueIntentPrefix(userId, namespace)
	)) {
		const value = readAccountStorage(key);
		const intent =
			value === null
				? null
				: parseDirtyQueueIntent(value, userId, namespace);
		if (
			intent === null ||
			key !==
				createDirtyQueueIntentKey(userId, namespace, intent.operationId)
		) {
			if (value !== null && !checkAlreadyQuarantined(key, value)) {
				invalidIntents.push({ key, value });
			}
			continue;
		}
		intents.push(intent);
	}

	const covered = new Set(intents.flatMap((intent) => intent.covers));
	const activeIntents = intents.filter(
		(intent) => !covered.has(intent.operationId)
	);
	return {
		activeIntents,
		hasInvalidIntent: invalidIntents.length > 0,
		intents,
		invalidIntents,
	};
}

export function quarantineInvalidDirtyQueueIntents(
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
) {
	const failQuarantineStorage = (): never => {
		setDirtyIntentCollisionDetected(userId, namespace, true);
		throw new Error('quarantine-storage-failed');
	};
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	const { invalidIntents } = readDirtyQueueIntents(userId, namespace);
	for (const invalid of invalidIntents) {
		const rawHash = createSnapshotHash(invalid.value);
		const evidence = {
			createdAt: Date.now(),
			namespace,
			rawHash,
			rawValue: invalid.value,
			sourceKey: invalid.key,
			userId,
			version: 1 as const,
		} satisfies IDirtyQueueEvidence;
		const evidenceKey = `${createDirtyQueueEvidencePrefix(
			userId,
			namespace
		)}${sha1(`${invalid.key}\u0000${invalid.value}`)}`;
		try {
			writeAccountJsonStorage(evidenceKey, evidence);
		} catch {
			failQuarantineStorage();
		}
		if (!checkGeneration()) {
			return false;
		}
		if (
			createSnapshotHash(
				readAccountJsonStorage<unknown>(evidenceKey, null)
			) !== createSnapshotHash(evidence) ||
			readAccountStorage(invalid.key) !== invalid.value
		) {
			failQuarantineStorage();
		}
		if (readAccountStorage(invalid.key) !== invalid.value) {
			return false;
		}
	}
	const fixedKeys = [
		createDirtyQueueKey(userId, namespace),
		...(namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
			? [createLegacyDirtyQueueKey(userId, namespace)]
			: []),
	];
	for (const fixedKey of fixedKeys) {
		const rawValue = readAccountStorage(fixedKey);
		if (rawValue === null) {
			continue;
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(rawValue);
		} catch {
			parsed = null;
		}
		const sanitized = sanitizeDirtyQueueEntry({
			entry: parsed,
			namespace,
			userId,
		});
		if (sanitized.status === 'future') {
			setFutureSchemaIsolationDetected(userId, namespace, true);
			continue;
		}
		if (sanitized.status === 'current') {
			continue;
		}
		const rawHash = createSnapshotHash(rawValue);
		const evidence = {
			createdAt: Date.now(),
			namespace,
			rawHash,
			rawValue,
			sourceKey: fixedKey,
			userId,
			version: 1 as const,
		} satisfies IDirtyQueueEvidence;
		const evidenceKey = `${createDirtyQueueEvidencePrefix(
			userId,
			namespace
		)}${sha1(`${fixedKey}\u0000${rawValue}`)}`;
		try {
			writeAccountJsonStorage(evidenceKey, evidence);
		} catch {
			failQuarantineStorage();
		}
		if (!checkGeneration()) {
			return false;
		}
		if (
			createSnapshotHash(
				readAccountJsonStorage<unknown>(evidenceKey, null)
			) !== createSnapshotHash(evidence) ||
			readAccountStorage(fixedKey) !== rawValue
		) {
			failQuarantineStorage();
		}
		if (readAccountStorage(fixedKey) !== rawValue) {
			return false;
		}
	}
	return (
		checkGeneration() &&
		readDirtyQueueIntents(userId, namespace).invalidIntents.length === 0
	);
}

export function clearDirtyQueueCollisionEvidence(
	generationToken: string | null,
	userId: string,
	namespace: TSyncNamespace
) {
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return false;
	}
	const prefix = createDirtyQueueEvidencePrefix(userId, namespace);
	for (const key of getAccountStorageKeys(prefix)) {
		const rawValue = readAccountStorage(key);
		if (rawValue === null) {
			continue;
		}
		let value: unknown = null;
		try {
			value = JSON.parse(rawValue);
		} catch {
			/* Invalid internal evidence is retired below. */
		}
		const evidence = parseDirtyQueueEvidence(value, userId, namespace);
		if (readAccountStorage(key) !== rawValue) {
			return false;
		}
		if (evidence === null) {
			removeAccountStorage(key);
			continue;
		}
		const resolvedEvidence = { ...evidence, resolvedAt: Date.now() };
		writeAccountJsonStorage(key, resolvedEvidence);
		if (
			createSnapshotHash(readAccountJsonStorage<unknown>(key, null)) !==
			createSnapshotHash(resolvedEvidence)
		) {
			return false;
		}
	}
	setDirtyIntentCollisionDetected(userId, namespace, false);
	return checkAccountSyncResetWriteAllowed({
		expectedGeneration: generationToken,
		userId,
	});
}

export function readActiveDirtyQueueIntent(
	userId: string,
	namespace: TSyncNamespace
) {
	const result = readDirtyQueueIntents(userId, namespace);
	if (
		result.hasInvalidIntent ||
		result.activeIntents.length > 1 ||
		(result.intents.length > 0 && result.activeIntents.length === 0)
	) {
		setDirtyIntentCollisionDetected(userId, namespace, true);
		return { ...result, status: 'collision' as const };
	}
	const [intent] = result.activeIntents;
	if (intent === undefined) {
		setDirtyIntentCollisionDetected(userId, namespace, false);
		return { ...result, status: 'none' as const };
	}

	const canonicalValue = readAccountStorage(
		createDirtyQueueKey(userId, namespace)
	);
	const canonicalMatches = [
		intent.canonicalSourceValue,
		intent.expectedValue,
		intent.resultValue,
	].includes(canonicalValue);
	const legacyValue =
		namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
			? readAccountStorage(createLegacyDirtyQueueKey(userId, namespace))
			: null;
	const legacyMatches =
		intent.legacySourceValue === undefined ||
		legacyValue === null ||
		legacyValue === intent.legacySourceValue;
	const isCollision =
		intent.isolationReason !== null ||
		!canonicalMatches ||
		!legacyMatches ||
		(intent.resetGeneration ?? null) !==
			getAccountSyncResetGenerationId(userId);
	setDirtyIntentCollisionDetected(userId, namespace, isCollision);
	return {
		...result,
		intent,
		status: isCollision ? ('collision' as const) : ('current' as const),
	};
}

export function writeDirtyQueueIntent(intent: IDirtyQueueIntent) {
	writeAccountJsonStorage(
		createDirtyQueueIntentKey(
			intent.userId,
			intent.namespace,
			intent.operationId
		),
		intent
	);
}

export function migrateLegacySpecialGuestPlansDirtyQueueEntry(
	generationToken: string | null,
	userId: string
) {
	const namespace = SYNC_NAMESPACE_MAP.specialGuestPlans;
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return;
	}
	const legacyKey = createLegacyDirtyQueueKey(userId, namespace);
	const nextKey = createDirtyQueueKey(userId, namespace);
	const intentState = readActiveDirtyQueueIntent(userId, namespace);
	if (intentState.status !== 'none') {
		return;
	}

	const legacyValue = readAccountStorage(legacyKey);
	if (legacyValue === null) {
		return;
	}
	const canonicalValue = readAccountStorage(nextKey);
	const sanitizedLegacyEntry = sanitizeDirtyQueueRawValue({
		namespace,
		rawValue: legacyValue,
		userId,
	});
	const sanitizedCanonicalEntry = sanitizeDirtyQueueRawValue({
		namespace,
		rawValue: canonicalValue,
		userId,
	});
	if (
		sanitizedLegacyEntry.status === 'future' ||
		sanitizedCanonicalEntry.status === 'future'
	) {
		setFutureSchemaIsolationDetected(userId, namespace, true);
		return;
	}
	setFutureSchemaIsolationDetected(userId, namespace, false);
	const validLegacyEntry =
		sanitizedLegacyEntry.status === 'current'
			? sanitizedLegacyEntry.entry
			: null;
	const operationId = `legacy-${sha1(
		`${canonicalValue ?? 'null'}\u0000${legacyValue}`
	)}`;
	const intentPayload = {
		canonicalSourceValue: canonicalValue,
		covers: [],
		createdAt: Date.now(),
		expectedValue: canonicalValue,
		isolationReason:
			validLegacyEntry === null
				? ('corrupt-legacy' as const)
				: canonicalValue !== null && canonicalValue !== legacyValue
					? ('legacy-canonical-collision' as const)
					: null,
		legacySourceValue: legacyValue,
		namespace,
		operationId,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		resultValue:
			canonicalValue ?? (validLegacyEntry === null ? null : legacyValue),
		userId,
		version: 1 as const,
	} satisfies TDirtyQueueIntentPayload;
	const intent = {
		...intentPayload,
		intentHash: createDirtyQueueIntentHash(intentPayload),
	} satisfies IDirtyQueueIntent;
	try {
		writeDirtyQueueIntent(intent);
	} catch {
		setDirtyIntentCollisionDetected(userId, namespace, true);
		return;
	}
	if (
		!checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		})
	) {
		return;
	}
	const storedIntentValue = readAccountStorage(
		createDirtyQueueIntentKey(userId, namespace, operationId)
	);
	const storedIntent =
		storedIntentValue === null
			? null
			: parseDirtyQueueIntent(storedIntentValue, userId, namespace);
	if (
		createSnapshotHash(storedIntent) !== createSnapshotHash(intent) ||
		readAccountStorage(nextKey) !== canonicalValue ||
		readAccountStorage(legacyKey) !== legacyValue
	) {
		setDirtyIntentCollisionDetected(userId, namespace, true);
	}
}

function readDirtyQueueIntentEntry(userId: string, namespace: TSyncNamespace) {
	const intentState = readActiveDirtyQueueIntent(userId, namespace);
	if (
		intentState.status !== 'current' &&
		intentState.status !== 'collision'
	) {
		return { entry: null, hasIntent: false, isFuture: false };
	}
	if (!('intent' in intentState)) {
		return { entry: null, hasIntent: true, isFuture: false };
	}
	const { resultValue } = intentState.intent;
	if (resultValue === null) {
		return { entry: null, hasIntent: true, isFuture: false };
	}

	const sanitized = sanitizeDirtyQueueRawValue({
		namespace,
		rawValue: resultValue,
		userId,
	});
	if (sanitized.status === 'future') {
		return { entry: null, hasIntent: true, isFuture: true };
	}
	if (sanitized.status !== 'current') {
		setDirtyIntentCollisionDetected(userId, namespace, true);
	}
	const { intent } = intentState;
	return {
		entry:
			sanitized.status === 'current'
				? { ...sanitized.entry, queueOperationId: intent.operationId }
				: null,
		hasIntent: true,
		isFuture: false,
	};
}

export function readDirtyQueueEntry(userId: string, namespace: TSyncNamespace) {
	const canonicalRaw = readAccountStorage(
		createDirtyQueueKey(userId, namespace)
	);
	const canonicalEntry = sanitizeDirtyQueueRawValue({
		namespace,
		rawValue: canonicalRaw,
		userId,
	});
	const legacyRaw =
		namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
			? readAccountStorage(createLegacyDirtyQueueKey(userId, namespace))
			: null;
	const legacyEntry = sanitizeDirtyQueueRawValue({
		namespace,
		rawValue: legacyRaw,
		userId,
	});
	const intentEntry = readDirtyQueueIntentEntry(userId, namespace);
	const isFuture =
		canonicalEntry.status === 'future' ||
		legacyEntry.status === 'future' ||
		intentEntry.isFuture;
	setFutureSchemaIsolationDetected(userId, namespace, isFuture);
	if (isFuture) {
		return null;
	}
	if (intentEntry.hasIntent) {
		const quarantined = readDirtyQueueEvidence(userId, namespace);
		const unresolvedEvidence = quarantined.evidence.filter(
			(evidence) => evidence.resolvedAt === undefined
		);
		const hasUnresolvedEvidence =
			unresolvedEvidence.length > 0 || quarantined.invalidCount > 0;
		const evidenceCapturedByConflict =
			intentEntry.entry?.paused === 'conflict' &&
			intentEntry.entry.conflict?.localCollision !== undefined;
		if (hasUnresolvedEvidence && !evidenceCapturedByConflict) {
			setDirtyIntentCollisionDetected(userId, namespace, true);
		}
		return intentEntry.entry;
	}

	if (namespace === SYNC_NAMESPACE_MAP.specialGuestPlans) {
		if (
			canonicalRaw !== null &&
			legacyRaw !== null &&
			canonicalRaw !== legacyRaw
		) {
			setDirtyIntentCollisionDetected(userId, namespace, true);
		}
		if (canonicalRaw === null && legacyRaw !== null) {
			return legacyEntry.status === 'current' ? legacyEntry.entry : null;
		}
	}
	if (canonicalRaw === null) {
		return null;
	}
	return canonicalEntry.status === 'current' ? canonicalEntry.entry : null;
}

export function recordAccountSyncDirtyQueueExternalMutation({
	namespace,
	userId,
}: {
	isLegacyKey?: boolean;
	namespace: TSyncNamespace;
	newValue: string | null;
	oldValue: string | null;
	userId: string;
}) {
	readDirtyQueueEntry(userId, namespace);
	return dirtyIntentCollisionNamespaces.get(userId)?.has(namespace) === true;
}

export interface IDirtyQueueCollisionCandidate {
	entry: IDirtyQueueEntry;
	id: string;
	label: string;
}

export interface IDirtyQueueCollisionState {
	candidates: IDirtyQueueCollisionCandidate[];
	invalidEvidenceCount: number;
	namespace: TSyncNamespace;
	requiresResetRebase: boolean;
	token: string;
	userId: string;
}

export function readDirtyQueueCollisionState(
	userId: string,
	namespace: TSyncNamespace
): IDirtyQueueCollisionState | null {
	const hadDetectedCollision =
		dirtyIntentCollisionNamespaces.get(userId)?.has(namespace) === true;
	const intentState = readActiveDirtyQueueIntent(userId, namespace);
	const quarantined = readDirtyQueueEvidence(userId, namespace);
	const unresolvedEvidence = quarantined.evidence.filter(
		(evidence) => evidence.resolvedAt === undefined
	);
	if (
		intentState.status !== 'collision' &&
		!hadDetectedCollision &&
		unresolvedEvidence.length === 0 &&
		quarantined.invalidCount === 0
	) {
		return null;
	}
	if (
		intentState.status === 'current' &&
		intentState.intent.resultValue !== null
	) {
		try {
			const result: unknown = JSON.parse(intentState.intent.resultValue);
			if (
				isObjectTagRecord(result) &&
				result['paused'] === 'conflict' &&
				isObjectTagRecord(result['conflict']) &&
				result['conflict']['localCollision'] !== undefined
			) {
				setDirtyIntentCollisionDetected(userId, namespace, false);
				return null;
			}
		} catch {
			/* handled as collision evidence below */
		}
	}
	setDirtyIntentCollisionDetected(userId, namespace, true);
	const canonicalValue = readAccountStorage(
		createDirtyQueueKey(userId, namespace)
	);
	const legacyValue =
		namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
			? readAccountStorage(createLegacyDirtyQueueKey(userId, namespace))
			: null;
	const canonicalKey = createDirtyQueueKey(userId, namespace);
	const legacyKey = createLegacyDirtyQueueKey(userId, namespace);
	const evidence = [
		...intentState.intents.flatMap((intent) => [
			{
				label: DIRTY_QUEUE_COLLISION_SOURCE_LABEL_MAP.nextClient,
				sourceKey: null,
				value: intent.resultValue,
			},
			{
				label: DIRTY_QUEUE_COLLISION_SOURCE_LABEL_MAP.preMigration,
				sourceKey: null,
				value: intent.expectedValue,
			},
		]),
		{
			label: DIRTY_QUEUE_COLLISION_SOURCE_LABEL_MAP.canonicalQueue,
			sourceKey: canonicalKey,
			value: canonicalValue,
		},
		...(namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
			? [
					{
						label: DIRTY_QUEUE_COLLISION_SOURCE_LABEL_MAP.legacyQueue,
						sourceKey: legacyKey,
						value: legacyValue,
					},
				]
			: []),
	];
	const candidates: IDirtyQueueCollisionCandidate[] = [];
	let invalidEvidenceCount =
		intentState.invalidIntents.length +
		unresolvedEvidence.length +
		quarantined.invalidCount;
	const seenHashes = new Set<string>();
	for (const { label, sourceKey, value } of evidence) {
		if (value === null) {
			continue;
		}
		if (
			sourceKey !== null &&
			quarantined.evidence.some(
				(item) =>
					item.resolvedAt !== undefined &&
					item.sourceKey === sourceKey &&
					item.rawHash === createSnapshotHash(value)
			)
		) {
			continue;
		}
		let parsed: unknown;
		try {
			parsed = JSON.parse(value);
		} catch {
			invalidEvidenceCount += 1;
			continue;
		}
		const sanitized = sanitizeDirtyQueueEntry({
			entry: parsed,
			namespace,
			userId,
		});
		if (sanitized.status !== 'current') {
			invalidEvidenceCount += 1;
			continue;
		}
		const { entry } = sanitized;
		const dataHash = createSnapshotHash(entry.data);
		if (seenHashes.has(dataHash)) {
			continue;
		}
		seenHashes.add(dataHash);
		candidates.push({ entry, id: dataHash, label });
	}
	const token = createSnapshotHash({
		canonicalValue,
		evidence: unresolvedEvidence.map((item) => item.rawHash),
		intents: intentState.intents,
		invalidEvidenceCount,
		legacyValue,
	});
	const currentResetGeneration = getAccountSyncResetGenerationId(userId);
	const requiresResetRebase = currentResetGeneration !== null;
	return {
		candidates,
		invalidEvidenceCount,
		namespace,
		requiresResetRebase,
		token,
		userId,
	};
}

export function removeDirtyQueueEntries(userId: string) {
	const prefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		''
	);

	getAccountStorageKeys(prefix).forEach(removeAccountStorage);
	const nextPrefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueueV2,
		userId,
		''
	);
	getAccountStorageKeys(nextPrefix).forEach(removeAccountStorage);
	const intentPrefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyTransition,
		userId,
		''
	);
	getAccountStorageKeys(intentPrefix).forEach(removeAccountStorage);
	const evidencePrefix = createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyEvidence,
		userId,
		''
	);
	getAccountStorageKeys(evidencePrefix).forEach(removeAccountStorage);
	isolatedFutureSchemaNamespaces.delete(userId);
	dirtyIntentCollisionNamespaces.delete(userId);
}

export function readDirtyQueueEntries(userId: string) {
	return Object.values(SYNC_NAMESPACE_MAP)
		.map((namespace) => readDirtyQueueEntry(userId, namespace))
		.filter((entry): entry is IDirtyQueueEntry => entry !== null);
}

export function readIsolatedDirtyQueueNamespaces(userId: string) {
	return [
		...new Set([
			...(isolatedFutureSchemaNamespaces.get(userId) ?? []),
			...(dirtyIntentCollisionNamespaces.get(userId) ?? []),
		]),
	];
}

export function createDirtyQueueNamespaceGenerationHash(
	userId: string,
	namespace: TSyncNamespace
) {
	const readPrefixValues = (prefix: string) =>
		getAccountStorageKeys(prefix)
			.sort()
			.map((key) => [key, readAccountStorage(key)]);
	return createSnapshotHash({
		canonical: readAccountStorage(createDirtyQueueKey(userId, namespace)),
		evidence: readPrefixValues(
			createDirtyQueueEvidencePrefix(userId, namespace)
		),
		intents: readPrefixValues(
			createDirtyQueueIntentPrefix(userId, namespace)
		),
		legacy:
			namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
				? readAccountStorage(
						createLegacyDirtyQueueKey(userId, namespace)
					)
				: null,
	});
}
