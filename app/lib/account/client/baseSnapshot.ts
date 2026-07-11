import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

import { createSnapshotHash } from './queue';
import {
	captureAccountSyncResetGeneration,
	checkAccountSyncResetWriteAllowed,
	getAccountSyncResetGenerationId,
	getAccountSyncResetGenerationIdFromToken,
} from './resetGeneration';
import { ACCOUNT_STORAGE_KEY_MAP, createAccountStorageKey } from './storage';
import {
	type IAccountSyncBaseSnapshot,
	type ISyncNamespaceSerializer,
	SYNC_MIN_SCHEMA_VERSION_MAP,
	SYNC_NAMESPACE_MAP,
	SYNC_SCHEMA_VERSION_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import {
	readOptionalLocalCache,
	removeOptionalLocalCache,
	writeOptionalLocalCache,
} from '@/utilities/safeStorage';

export function createAccountSyncBaseSnapshotKey(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.baseSnapshot,
		userId,
		namespace
	);
}

function checkBaseSnapshotContainer(
	value: unknown,
	namespace: TSyncNamespace
): value is IAccountSyncBaseSnapshot {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		(value as IAccountSyncBaseSnapshot).namespace === namespace &&
		Number.isSafeInteger((value as IAccountSyncBaseSnapshot).revision) &&
		(value as IAccountSyncBaseSnapshot).revision >= 0 &&
		(value as IAccountSyncBaseSnapshot).revision <
			Number.MAX_SAFE_INTEGER &&
		Number.isSafeInteger(
			(value as IAccountSyncBaseSnapshot).schema_version
		) &&
		(value as IAccountSyncBaseSnapshot).schema_version >= 0 &&
		typeof (value as IAccountSyncBaseSnapshot).snapshotHash === 'string' &&
		'data' in value
	);
}

export function readAccountSyncBaseSnapshot(
	userId: string,
	namespace: TSyncNamespace,
	expectedRevision: number | undefined,
	serializer: Pick<ISyncNamespaceSerializer<unknown>, 'migrate' | 'validate'>
) {
	const key = createAccountSyncBaseSnapshotKey(userId, namespace);
	const compressed = readOptionalLocalCache(key);
	if (compressed === null) {
		return null;
	}

	let parsed: unknown;
	try {
		const serialized = decompressFromUTF16(compressed);
		parsed = JSON.parse(serialized);
	} catch {
		return null;
	}

	if (!checkBaseSnapshotContainer(parsed, namespace)) {
		return null;
	}
	if (parsed.schema_version > SYNC_SCHEMA_VERSION_MAP[namespace]) {
		return null;
	}
	if (parsed.schema_version < SYNC_MIN_SCHEMA_VERSION_MAP[namespace]) {
		return null;
	}
	if (
		expectedRevision !== undefined &&
		parsed.revision !== expectedRevision
	) {
		return null;
	}
	if (
		(parsed.resetGeneration ?? null) !==
		getAccountSyncResetGenerationId(userId)
	) {
		return null;
	}
	if (createSnapshotHash(parsed.data) !== parsed.snapshotHash) {
		return null;
	}

	try {
		const migrated = serializer.migrate(parsed.data, parsed.schema_version);
		if (!serializer.validate(migrated)) {
			return null;
		}

		return {
			...parsed,
			data: migrated,
			schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
			snapshotHash: createSnapshotHash(migrated),
		};
	} catch {
		return null;
	}
}

export function writeAccountSyncBaseSnapshot({
	data,
	generationToken,
	namespace,
	resetOperationId,
	revision,
	userId,
}: {
	data: unknown;
	generationToken: string | null;
	namespace: TSyncNamespace;
	revision: number;
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
	const record: IAccountSyncBaseSnapshot = {
		data,
		namespace,
		resetGeneration:
			getAccountSyncResetGenerationIdFromToken(generationToken),
		revision,
		schema_version: SYNC_SCHEMA_VERSION_MAP[namespace],
		snapshotHash: createSnapshotHash(data),
	};

	try {
		const didWrite = writeOptionalLocalCache(
			createAccountSyncBaseSnapshotKey(userId, namespace),
			compressToUTF16(JSON.stringify(record))
		);
		return didWrite && checkGeneration();
	} catch {
		return false;
	}
}

export function removeAccountSyncBaseSnapshot(
	userId: string,
	namespace: TSyncNamespace,
	generationToken: string | null,
	resetOperationId?: string
) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	removeOptionalLocalCache(
		createAccountSyncBaseSnapshotKey(userId, namespace)
	);
	return checkGeneration();
}

export function removeAccountSyncBaseSnapshots(userId: string) {
	// Synchronous lifecycle boundary: every guarded removal shares one token.
	const generationToken = captureAccountSyncResetGeneration(userId);
	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		removeAccountSyncBaseSnapshot(userId, namespace, generationToken);
	}
}

/** Only call after the server has permanently deleted this account. */
export function removeAccountSyncBaseSnapshotsForAccountDeletion(
	userId: string
) {
	for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
		removeOptionalLocalCache(
			createAccountSyncBaseSnapshotKey(userId, namespace)
		);
	}
}
