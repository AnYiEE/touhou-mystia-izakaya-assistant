import { sha1 } from 'js-sha1';

import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	getAccountStorageKeys,
	readAccountJsonStorage,
	readAccountStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { checkApplyingRemoteState } from './stateGuards';
import { createAccountClientId } from './random';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationId,
	getAccountSyncResetGenerationIdFromToken,
} from './resetGeneration';
import {
	type IDirtyQueueEntry,
	type ISyncConflictItem,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
	type TSyncPausedReason,
	checkSupportedSyncSchemaVersion,
} from '@/lib/account/sync';
import {
	isNonNegativeSafeInteger,
	isPlainObject,
} from '@/lib/account/sync/serializers/utils';

const SYNC_PAUSED_REASON_SET = new Set<TSyncPausedReason | null>([
	null,
	'applying-remote',
	'bootstrap',
	'conflict',
	'delete-data',
	'importing-backup',
]);
const TERMINAL_SYNC_ERROR_SET = new Set([
	'sync-account-capacity-exceeded',
	'sync-request-too-large',
	'sync-schema-update-required',
]);
const MAX_LOCAL_COLLISION_STRING_LENGTH = 256;
const isolatedFutureSchemaNamespaces = new Map<string, Set<TSyncNamespace>>();
const dirtyIntentCollisionNamespaces = new Map<string, Set<TSyncNamespace>>();

interface IDirtyQueueIntent {
	canonicalSourceValue: string | null;
	covers: string[];
	createdAt: number;
	expectedValue: string | null;
	isolationReason: null | 'corrupt-legacy' | 'legacy-canonical-collision';
	intentHash: string;
	legacySourceValue?: string | null;
	namespace: TSyncNamespace;
	operationId: string;
	resetGeneration?: string | null;
	resultValue: string | null;
	userId: string;
	version: 1;
}

interface IDirtyQueueEvidence {
	createdAt: number;
	namespace: TSyncNamespace;
	rawHash: string;
	rawValue: string;
	resolvedAt?: number;
	sourceKey: string;
	userId: string;
	version: 1;
}

type TDirtyQueueIntentPayload = Omit<IDirtyQueueIntent, 'intentHash'>;

function checkSyncRevision(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

function checkDirtyQueueLocalCollision(value: unknown) {
	if (value === undefined) {
		return true;
	}
	if (
		!isPlainObject(value) ||
		value['version'] !== 1 ||
		!isNonNegativeSafeInteger(value['invalidEvidenceCount']) ||
		typeof value['token'] !== 'string' ||
		value['token'].length === 0 ||
		value['token'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
		!Array.isArray(value['candidates']) ||
		value['candidates'].length === 0
	) {
		return false;
	}
	const ids = new Set<string>();
	return value['candidates'].every((candidate) => {
		if (
			!isPlainObject(candidate) ||
			!('data' in candidate) ||
			!checkSyncRevision(candidate['baseRevision']) ||
			!isNonNegativeSafeInteger(candidate['schemaVersion']) ||
			typeof candidate['id'] !== 'string' ||
			candidate['id'].length === 0 ||
			candidate['id'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
			typeof candidate['label'] !== 'string' ||
			candidate['label'].length === 0 ||
			candidate['label'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
			typeof candidate['snapshotHash'] !== 'string' ||
			candidate['snapshotHash'].length === 0 ||
			candidate['snapshotHash'].length >
				MAX_LOCAL_COLLISION_STRING_LENGTH ||
			// eslint-disable-next-line @typescript-eslint/no-use-before-define
			!checkSnapshotHashMatches(
				candidate['data'],
				candidate['snapshotHash']
			) ||
			ids.has(candidate['id'])
		) {
			return false;
		}
		ids.add(candidate['id']);
		return true;
	});
}

function checkDirtyQueueConflict(
	value: unknown,
	namespace: TSyncNamespace,
	userId: string
): value is ISyncConflictItem {
	return (
		isPlainObject(value) &&
		(value['automaticResolution'] === undefined ||
			(value['localCollision'] === undefined &&
				(value['automaticResolution'] === 'cloud' ||
					(value['automaticResolution'] === 'merged' &&
						value['merged'] !== null)))) &&
		'cloud' in value &&
		'local' in value &&
		'merged' in value &&
		value['namespace'] === namespace &&
		checkSyncRevision(value['revision']) &&
		value['userId'] === userId &&
		checkDirtyQueueLocalCollision(value['localCollision'])
	);
}

function sortJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortJsonValue);
	}
	if (value !== null && typeof value === 'object') {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const object = value as Record<string, unknown>;
				if (object[key] !== undefined) {
					result[key] = sortJsonValue(object[key]);
				}
				return result;
			}, {});
	}

	return value;
}

function createSnapshotStableJson(data: unknown) {
	const sortedData = sortJsonValue(data);
	if (
		sortedData === undefined ||
		typeof sortedData === 'function' ||
		typeof sortedData === 'symbol'
	) {
		return 'undefined';
	}

	return JSON.stringify(sortedData);
}

function createSnapshotDigest(stableJson: string) {
	return `sha1:${sha1(stableJson)}`;
}

export function createSnapshotHash(data: unknown): string {
	return createSnapshotDigest(createSnapshotStableJson(data));
}

export function checkSnapshotHashMatches(
	data: unknown,
	snapshotHash: string | undefined
) {
	if (snapshotHash === undefined) {
		return false;
	}

	const stableJson = createSnapshotStableJson(data);

	return (
		snapshotHash === createSnapshotDigest(stableJson) ||
		snapshotHash === stableJson
	);
}

export function checkSnapshotHashesEquivalent(
	currentEntry: IDirtyQueueEntry,
	entry: IDirtyQueueEntry
) {
	return (
		checkSnapshotHashMatches(currentEntry.data, entry.snapshotHash) &&
		checkSnapshotHashMatches(entry.data, currentEntry.snapshotHash)
	);
}

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

function checkFutureSchemaDirtyQueueEntry(
	entry: unknown,
	namespace: TSyncNamespace
) {
	return (
		isPlainObject(entry) &&
		entry['namespace'] === namespace &&
		isNonNegativeSafeInteger(entry['schema_version']) &&
		entry['schema_version'] > SYNC_SCHEMA_VERSION_MAP[namespace]
	);
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
		!isPlainObject(entry) ||
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

export function createDirtyQueueKey(userId: string, namespace: TSyncNamespace) {
	return createAccountStorageKey(
		namespace === SYNC_NAMESPACE_MAP.customerRarePlans
			? ACCOUNT_STORAGE_KEY_MAP.dirtyQueueV2
			: ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

export function createLegacyDirtyQueueKey(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

function createDirtyQueueIntentPrefix(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyTransition,
		userId,
		namespace,
		''
	);
}

function createDirtyQueueEvidencePrefix(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyEvidence,
		userId,
		namespace,
		''
	);
}

function parseDirtyQueueEvidence(
	value: unknown,
	userId: string,
	namespace: TSyncNamespace
): IDirtyQueueEvidence | null {
	if (
		!isPlainObject(value) ||
		value['version'] !== 1 ||
		value['userId'] !== userId ||
		value['namespace'] !== namespace ||
		!isNonNegativeSafeInteger(value['createdAt']) ||
		(value['resolvedAt'] !== undefined &&
			!isNonNegativeSafeInteger(value['resolvedAt'])) ||
		typeof value['sourceKey'] !== 'string' ||
		typeof value['rawValue'] !== 'string' ||
		typeof value['rawHash'] !== 'string' ||
		value['rawHash'] !== createSnapshotHash(value['rawValue'])
	) {
		return null;
	}
	return value as unknown as IDirtyQueueEvidence;
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

function createDirtyQueueIntentKey(
	userId: string,
	namespace: TSyncNamespace,
	operationId: string
) {
	return `${createDirtyQueueIntentPrefix(userId, namespace)}${operationId}`;
}

function createDirtyQueueIntentHash(intent: TDirtyQueueIntentPayload) {
	return createSnapshotHash(intent);
}

function parseDirtyQueueIntent(
	value: string,
	userId: string,
	namespace: TSyncNamespace
): IDirtyQueueIntent | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return null;
	}
	if (!isPlainObject(parsed)) {
		return null;
	}

	const {
		canonicalSourceValue,
		covers,
		createdAt,
		expectedValue,
		intentHash,
		isolationReason,
		legacySourceValue,
		namespace: storedNamespace,
		operationId,
		resetGeneration,
		resultValue,
		userId: storedUserId,
		version,
	} = parsed;
	if (
		version !== 1 ||
		storedUserId !== userId ||
		storedNamespace !== namespace ||
		!isNonNegativeSafeInteger(createdAt) ||
		!Array.isArray(covers) ||
		!covers.every((item) => typeof item === 'string' && item !== '') ||
		(isolationReason !== null &&
			isolationReason !== 'corrupt-legacy' &&
			isolationReason !== 'legacy-canonical-collision') ||
		typeof intentHash !== 'string' ||
		intentHash === '' ||
		typeof operationId !== 'string' ||
		operationId === '' ||
		(canonicalSourceValue !== null &&
			typeof canonicalSourceValue !== 'string') ||
		(expectedValue !== null && typeof expectedValue !== 'string') ||
		(resultValue !== null && typeof resultValue !== 'string') ||
		(resetGeneration !== undefined &&
			resetGeneration !== null &&
			typeof resetGeneration !== 'string') ||
		(legacySourceValue !== undefined &&
			legacySourceValue !== null &&
			typeof legacySourceValue !== 'string')
	) {
		return null;
	}

	const payload = {
		canonicalSourceValue,
		covers: covers as string[],
		createdAt,
		expectedValue,
		isolationReason,
		...(legacySourceValue === undefined ? {} : { legacySourceValue }),
		namespace,
		operationId,
		...(resetGeneration === undefined ? {} : { resetGeneration }),
		resultValue,
		userId,
		version: 1,
	} satisfies TDirtyQueueIntentPayload;
	if (createDirtyQueueIntentHash(payload) !== intentHash) {
		return null;
	}

	return { ...payload, intentHash };
}

function readDirtyQueueIntents(userId: string, namespace: TSyncNamespace) {
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
		...(namespace === SYNC_NAMESPACE_MAP.customerRarePlans
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

function readActiveDirtyQueueIntent(userId: string, namespace: TSyncNamespace) {
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
		namespace === SYNC_NAMESPACE_MAP.customerRarePlans
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

function writeDirtyQueueIntent(intent: IDirtyQueueIntent) {
	writeAccountJsonStorage(
		createDirtyQueueIntentKey(
			intent.userId,
			intent.namespace,
			intent.operationId
		),
		intent
	);
}

export function migrateLegacyCustomerRarePlansDirtyQueueEntry(
	generationToken: string | null,
	userId: string
) {
	const namespace = SYNC_NAMESPACE_MAP.customerRarePlans;
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
		namespace === SYNC_NAMESPACE_MAP.customerRarePlans
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

	if (namespace === SYNC_NAMESPACE_MAP.customerRarePlans) {
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

function checkDirtyQueueEntriesSameGeneration(
	currentEntry: IDirtyQueueEntry | null,
	expectedEntry: IDirtyQueueEntry | null
) {
	return (
		(currentEntry === null && expectedEntry === null) ||
		(currentEntry !== null &&
			expectedEntry !== null &&
			createSnapshotHash(currentEntry) ===
				createSnapshotHash(expectedEntry))
	);
}

function commitDirtyQueueStorageTransition({
	expectedEntry,
	generationToken,
	namespace,
	nextEntry,
	operationId = createAccountClientId(),
	resetOperationId,
	userId,
}: {
	expectedEntry: IDirtyQueueEntry | null;
	generationToken: string | null;
	namespace: TSyncNamespace;
	nextEntry: IDirtyQueueEntry | null;
	operationId?: string;
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
	const currentEntry = readDirtyQueueEntry(userId, namespace);
	if (isolatedFutureSchemaNamespaces.get(userId)?.has(namespace) === true) {
		return false;
	}
	if (!checkDirtyQueueEntriesSameGeneration(currentEntry, expectedEntry)) {
		return false;
	}
	const intentState = readActiveDirtyQueueIntent(userId, namespace);
	const recoverableCorruptLegacy =
		intentState.status === 'collision' &&
		intentState.activeIntents.length === 1 &&
		intentState.activeIntents[0]?.isolationReason === 'corrupt-legacy' &&
		expectedEntry === null &&
		nextEntry !== null;
	if (intentState.status === 'collision' && !recoverableCorruptLegacy) {
		return false;
	}
	const previousIntent =
		intentState.status === 'current'
			? intentState.intent
			: recoverableCorruptLegacy
				? intentState.activeIntents[0]
				: undefined;
	const canonicalSourceValue =
		previousIntent === undefined
			? readAccountStorage(createDirtyQueueKey(userId, namespace))
			: previousIntent.canonicalSourceValue;
	const expectedValue =
		expectedEntry === null ? null : JSON.stringify(expectedEntry);
	const legacySourceValue =
		previousIntent === undefined
			? namespace === SYNC_NAMESPACE_MAP.customerRarePlans
				? readAccountStorage(
						createLegacyDirtyQueueKey(userId, namespace)
					)
				: undefined
			: previousIntent.legacySourceValue;
	let resultValue: string | null = null;
	if (nextEntry !== null) {
		const persistedEntry = { ...nextEntry };
		delete persistedEntry.queueOperationId;
		resultValue = JSON.stringify(persistedEntry);
	}
	const intentPayload = {
		canonicalSourceValue,
		covers: intentState.intents.map((item) => item.operationId),
		createdAt: Date.now(),
		expectedValue,
		isolationReason: null,
		...(legacySourceValue === undefined ? {} : { legacySourceValue }),
		namespace,
		operationId,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		resultValue,
		userId,
		version: 1 as const,
	} satisfies TDirtyQueueIntentPayload;
	const intent = {
		...intentPayload,
		intentHash: createDirtyQueueIntentHash(intentPayload),
	} satisfies IDirtyQueueIntent;
	writeDirtyQueueIntent(intent);
	if (!checkGeneration()) {
		return false;
	}
	const storedValue = readAccountStorage(
		createDirtyQueueIntentKey(userId, namespace, operationId)
	);
	if (
		storedValue === null ||
		createSnapshotHash(JSON.parse(storedValue)) !==
			createSnapshotHash(intent)
	) {
		return false;
	}
	const nextState = readActiveDirtyQueueIntent(userId, namespace);
	if (
		nextState.status !== 'current' ||
		nextState.intent.operationId !== operationId
	) {
		return false;
	}

	for (const coveredOperationId of intent.covers) {
		removeAccountStorage(
			createDirtyQueueIntentKey(userId, namespace, coveredOperationId)
		);
	}
	return checkGeneration();
}

export function writeDirtyQueueEntryIfCurrent({
	expectedEntry,
	generationToken,
	nextEntry,
	operationId,
	resetOperationId,
	userId,
}: {
	expectedEntry: IDirtyQueueEntry | null;
	generationToken: string | null;
	nextEntry: IDirtyQueueEntry;
	operationId?: string;
	resetOperationId?: string;
	userId: string;
}) {
	return commitDirtyQueueStorageTransition({
		expectedEntry,
		generationToken,
		namespace: nextEntry.namespace,
		nextEntry,
		...(operationId === undefined ? {} : { operationId }),
		...(resetOperationId === undefined ? {} : { resetOperationId }),
		userId,
	});
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
				isPlainObject(result) &&
				result['paused'] === 'conflict' &&
				isPlainObject(result['conflict']) &&
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
		namespace === SYNC_NAMESPACE_MAP.customerRarePlans
			? readAccountStorage(createLegacyDirtyQueueKey(userId, namespace))
			: null;
	const canonicalKey = createDirtyQueueKey(userId, namespace);
	const legacyKey = createLegacyDirtyQueueKey(userId, namespace);
	const evidence = [
		...intentState.intents.flatMap((intent) => [
			{
				label: '新客户端保留版本',
				sourceKey: null,
				value: intent.resultValue,
			},
			{
				label: '转换前保留版本',
				sourceKey: null,
				value: intent.expectedValue,
			},
		]),
		{
			label: '兼容队列版本',
			sourceKey: canonicalKey,
			value: canonicalValue,
		},
		...(namespace === SYNC_NAMESPACE_MAP.customerRarePlans
			? [
					{
						label: '旧标签页版本',
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

export function replaceDirtyQueueCollisionIfCurrent({
	generationToken,
	nextEntry,
	resetOperationId,
	token,
	userId,
}: {
	generationToken: string | null;
	nextEntry: IDirtyQueueEntry;
	resetOperationId?: string;
	token: string;
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
	const collision = readDirtyQueueCollisionState(userId, nextEntry.namespace);
	if (collision?.token !== token) {
		return false;
	}
	readDirtyQueueEntry(userId, nextEntry.namespace);
	if (
		isolatedFutureSchemaNamespaces.get(userId)?.has(nextEntry.namespace) ===
		true
	) {
		return false;
	}
	const intentState = readDirtyQueueIntents(userId, nextEntry.namespace);
	const canonicalSourceValue = readAccountStorage(
		createDirtyQueueKey(userId, nextEntry.namespace)
	);
	const legacySourceValue =
		nextEntry.namespace === SYNC_NAMESPACE_MAP.customerRarePlans
			? readAccountStorage(
					createLegacyDirtyQueueKey(userId, nextEntry.namespace)
				)
			: undefined;
	const operationId = createAccountClientId();
	const intentPayload = {
		canonicalSourceValue,
		covers: intentState.intents.map((intent) => intent.operationId),
		createdAt: Date.now(),
		expectedValue: null,
		isolationReason: null,
		...(legacySourceValue === undefined ? {} : { legacySourceValue }),
		namespace: nextEntry.namespace,
		operationId,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		resultValue: JSON.stringify(nextEntry),
		userId,
		version: 1 as const,
	} satisfies TDirtyQueueIntentPayload;
	const intent = {
		...intentPayload,
		intentHash: createDirtyQueueIntentHash(intentPayload),
	} satisfies IDirtyQueueIntent;
	writeDirtyQueueIntent(intent);
	if (!checkGeneration()) {
		return false;
	}
	const nextState = readActiveDirtyQueueIntent(userId, nextEntry.namespace);
	if (
		nextState.status !== 'current' ||
		nextState.intent.operationId !== operationId
	) {
		return false;
	}
	return checkGeneration();
}

function mergeDirtyQueueEntry(
	userId: string,
	entry: IDirtyQueueEntry,
	replacePausedEntry: boolean
): { currentEntry: IDirtyQueueEntry | null; entry: IDirtyQueueEntry } {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (currentEntry?.paused && !replacePausedEntry) {
		return { currentEntry, entry: currentEntry };
	}

	if (currentEntry?.paused === null) {
		return {
			currentEntry,
			entry: {
				...entry,
				attempts: currentEntry.attempts,
				baseRevision: currentEntry.baseRevision,
				clientMutationId: currentEntry.clientMutationId,
				dirtyAt: Math.max(currentEntry.dirtyAt, entry.dirtyAt),
			},
		};
	}

	return { currentEntry, entry };
}

export function removeDirtyQueueEntryIfCurrent({
	expectedEntry,
	generationToken,
	resetOperationId,
	userId,
}: {
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	resetOperationId?: string;
	userId: string;
}) {
	return commitDirtyQueueStorageTransition({
		expectedEntry,
		generationToken,
		namespace: expectedEntry.namespace,
		nextEntry: null,
		...(resetOperationId === undefined ? {} : { resetOperationId }),
		userId,
	});
}

export function writeDirtyQueueNullTombstoneIfCurrent({
	generationToken,
	namespace,
	resetOperationId,
	userId,
}: {
	generationToken: string | null;
	namespace: TSyncNamespace;
	resetOperationId: string;
	userId: string;
}) {
	const currentIntent = readActiveDirtyQueueIntent(userId, namespace);
	if (
		currentIntent.status === 'current' &&
		currentIntent.intent.resultValue === null &&
		currentIntent.intent.isolationReason === null &&
		currentIntent.intent.resetGeneration ===
			getAccountSyncResetGenerationIdFromToken(generationToken)
	) {
		return checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			resetOperationId,
			userId,
		});
	}
	return commitDirtyQueueStorageTransition({
		expectedEntry: null,
		generationToken,
		namespace,
		nextEntry: null,
		resetOperationId,
		userId,
	});
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
			namespace === SYNC_NAMESPACE_MAP.customerRarePlans
				? readAccountStorage(
						createLegacyDirtyQueueKey(userId, namespace)
					)
				: null,
	});
}

export function markAccountSyncDirty({
	baseRevision,
	data,
	generationToken,
	namespace,
	replacePausedEntry = false,
	userId,
}: {
	baseRevision: number;
	data: unknown;
	generationToken: string | null;
	namespace: TSyncNamespace;
	replacePausedEntry?: boolean;
	userId: string;
}) {
	if (!checkSyncRevision(baseRevision)) {
		throw new Error('invalid-base-revision');
	}
	if (checkApplyingRemoteState()) {
		return null;
	}

	const now = Date.now();
	const { currentEntry, entry } = mergeDirtyQueueEntry(
		userId,
		{
			attempts: 0,
			baseRevision,
			clientMutationId: createAccountClientId(),
			conflict: null,
			data,
			dirtyAt: now,
			lastError: null,
			namespace,
			paused: null,
			schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
			snapshotHash: createSnapshotHash(data),
		},
		replacePausedEntry
	);

	if (entry === currentEntry) {
		return entry;
	}
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry: entry,
			userId,
		})
	) {
		return null;
	}

	return entry;
}

export function completeDirtyQueueEntryUpload({
	entry,
	generationToken,
	nextBaseRevision,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	nextBaseRevision: number;
	userId: string;
}) {
	if (!checkSyncRevision(nextBaseRevision)) {
		throw new Error('invalid-next-base-revision');
	}

	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (currentEntry === null) {
		return 'removed' as const;
	}

	if (
		currentEntry.clientMutationId === entry.clientMutationId &&
		checkSnapshotHashesEquivalent(currentEntry, entry)
	) {
		return removeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			userId,
		})
			? ('removed' as const)
			: ('kept-newer' as const);
	}

	if (currentEntry.paused === null) {
		writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry: {
				...currentEntry,
				baseRevision: nextBaseRevision,
				lastError: null,
			},
			userId,
		});
	}

	return 'kept-newer' as const;
}

function readMatchingPausedConflictEntry(
	userId: string,
	expectedEntry: IDirtyQueueEntry
) {
	const currentEntry = readDirtyQueueEntry(userId, expectedEntry.namespace);
	if (
		currentEntry?.paused !== 'conflict' ||
		currentEntry.conflict === null ||
		currentEntry.clientMutationId !== expectedEntry.clientMutationId ||
		!checkSnapshotHashesEquivalent(currentEntry, expectedEntry)
	) {
		return null;
	}

	return currentEntry;
}

export function removePausedConflictEntryIfCurrent({
	expectedEntry,
	generationToken,
	userId,
}: {
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (currentEntry === null) {
		return false;
	}

	return removeDirtyQueueEntryIfCurrent({
		expectedEntry: currentEntry,
		generationToken,
		userId,
	});
}

export function updatePausedConflictEntryIfCurrent({
	conflict,
	data,
	expectedEntry,
	generationToken,
	userId,
}: {
	conflict: ISyncConflictItem;
	data: unknown;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (
		currentEntry?.namespace !== conflict.namespace ||
		conflict.userId !== userId ||
		!checkSnapshotHashMatches(data, createSnapshotHash(conflict.local))
	) {
		return null;
	}

	const nextEntry = {
		...currentEntry,
		clientMutationId: createAccountClientId(),
		conflict,
		data,
		dirtyAt: Date.now(),
		lastError: 'conflict',
		paused: 'conflict' as const,
		schema_version: SYNC_SCHEMA_VERSION_MAP[currentEntry.namespace],
		snapshotHash: createSnapshotHash(data),
	};
	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			userId,
		})
	) {
		return null;
	}

	return nextEntry;
}

export function replacePausedConflictWithDirtyIfCurrent({
	baseRevision,
	clientMutationId = createAccountClientId(),
	data,
	expectedEntry,
	generationToken,
	userId,
}: {
	baseRevision: number;
	clientMutationId?: string;
	data: unknown;
	expectedEntry: IDirtyQueueEntry;
	generationToken: string | null;
	userId: string;
}) {
	if (!checkSyncRevision(baseRevision)) {
		throw new Error('invalid-base-revision');
	}

	const currentEntry = readMatchingPausedConflictEntry(userId, expectedEntry);
	if (currentEntry === null) {
		return null;
	}

	const nextEntry = {
		...currentEntry,
		attempts: 0,
		baseRevision,
		clientMutationId,
		conflict: null,
		data,
		dirtyAt: Date.now(),
		lastError: null,
		paused: null,
		schema_version: SYNC_SCHEMA_VERSION_MAP[currentEntry.namespace],
		snapshotHash: createSnapshotHash(data),
	};

	if (
		!writeDirtyQueueEntryIfCurrent({
			expectedEntry: currentEntry,
			generationToken,
			nextEntry,
			operationId: `queue-${clientMutationId}`,
			userId,
		})
	) {
		return null;
	}

	return nextEntry;
}

export function setDirtyQueueEntryError({
	entry,
	generationToken,
	message,
	userId,
}: {
	entry: IDirtyQueueEntry;
	generationToken: string | null;
	message: string;
	userId: string;
}) {
	const currentEntry = readDirtyQueueEntry(userId, entry.namespace);
	if (
		currentEntry?.clientMutationId !== entry.clientMutationId ||
		!checkSnapshotHashesEquivalent(currentEntry, entry)
	) {
		return false;
	}

	return writeDirtyQueueEntryIfCurrent({
		expectedEntry: currentEntry,
		generationToken,
		nextEntry: {
			...currentEntry,
			attempts: currentEntry.attempts + 1,
			lastError: message,
		},
		userId,
	});
}

export function checkDirtyQueueEntryTerminalError(entry: IDirtyQueueEntry) {
	return (
		entry.lastError !== null && TERMINAL_SYNC_ERROR_SET.has(entry.lastError)
	);
}

export function clearTerminalDirtyQueueEntryErrors(userId: string) {
	// Synchronous user action boundary: every transition shares one token.
	const generationToken = captureAccountSyncResetGeneration(userId);
	let clearedCount = 0;

	for (const entry of readDirtyQueueEntries(userId)) {
		if (!checkDirtyQueueEntryTerminalError(entry)) {
			continue;
		}
		if (
			writeDirtyQueueEntryIfCurrent({
				expectedEntry: entry,
				generationToken,
				nextEntry: { ...entry, attempts: 0, lastError: null },
				userId,
			})
		) {
			clearedCount += 1;
		}
	}

	return clearedCount;
}
