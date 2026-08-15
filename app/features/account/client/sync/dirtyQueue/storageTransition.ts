import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import {
	readAccountStorage,
	removeAccountStorage,
} from '@/features/account/client/storage';
import {
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationIdFromToken,
} from '@/features/account/client/sync/resetGeneration';
import type { IDirtyQueueEntry } from '@/features/account/sync/types';

import {
	isolatedFutureSchemaNamespaces,
	readActiveDirtyQueueIntent,
	readDirtyQueueCollisionState,
	readDirtyQueueEntry,
	readDirtyQueueIntents,
	writeDirtyQueueIntent,
} from './collisionEvidence';
import {
	createDirtyQueueIntentKey,
	createDirtyQueueKey,
	createLegacyDirtyQueueKey,
} from './keys';
import { createSnapshotHash } from './snapshotHash';
import {
	type IDirtyQueueIntent,
	type TDirtyQueueIntentPayload,
	createDirtyQueueIntentHash,
} from './validation';

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
			? namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
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
		nextEntry.namespace === SYNC_NAMESPACE_MAP.specialGuestPlans
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
