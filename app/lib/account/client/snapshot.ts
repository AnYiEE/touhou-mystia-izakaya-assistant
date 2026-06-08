import {
	type IAccountSyncMeta,
	type ISyncNamespaceSerializer,
	type ISyncStateRecord,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import { customerNormalMealsSerializer } from '@/lib/account/sync/serializers/customerNormalMeals';
import { customerRareMealsSerializer } from '@/lib/account/sync/serializers/customerRareMeals';
import { customerRareSettingsSerializer } from '@/lib/account/sync/serializers/customerRareSettings';
import { globalPreferencesSerializer } from '@/lib/account/sync/serializers/globalPreferences';
import { themeSerializer } from '@/lib/account/sync/serializers/theme';
import { tutorialCustomerRareSerializer } from '@/lib/account/sync/serializers/tutorialCustomerRare';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	writeAccountJsonStorage,
} from './storage';
import { createSnapshotHash } from './queue';
import { withApplyingRemoteState as runWithApplyingRemoteState } from './stateGuards';

export type TAccountSnapshot = Partial<Record<TSyncNamespace, unknown>>;

type TStoredAccountSyncMeta = Omit<
	Partial<IAccountSyncMeta>,
	'lastAppliedRemoteHash' | 'revisions'
> & { lastAppliedRemoteHash?: unknown; revisions?: unknown };

const serializers = {
	[SYNC_NAMESPACE_MAP.customerNormalMeals]: customerNormalMealsSerializer,
	[SYNC_NAMESPACE_MAP.customerRareMeals]: customerRareMealsSerializer,
	[SYNC_NAMESPACE_MAP.customerRareSettings]: customerRareSettingsSerializer,
	[SYNC_NAMESPACE_MAP.globalPreferences]: globalPreferencesSerializer,
	[SYNC_NAMESPACE_MAP.theme]: themeSerializer,
	[SYNC_NAMESPACE_MAP.tutorialCustomerRare]: tutorialCustomerRareSerializer,
} as const satisfies Record<TSyncNamespace, ISyncNamespaceSerializer<unknown>>;

export function getAccountSyncSerializer(namespace: string) {
	const serializerMap: Partial<
		Record<string, ISyncNamespaceSerializer<unknown>>
	> = serializers;
	const serializer = serializerMap[namespace];
	if (serializer === undefined) {
		throw new Error(`unsupported-sync-namespace:${namespace}`);
	}

	return serializer;
}

export function getAccountSyncSerializers() {
	return serializers;
}

export {
	checkAccountSyncPaused,
	checkApplyingRemoteState,
	withAccountSyncPaused,
	withApplyingRemoteState,
} from './stateGuards';

export function createLocalAccountSnapshot() {
	return Object.entries(serializers).reduce<TAccountSnapshot>(
		(result, [namespace, serializer]) => {
			result[namespace as TSyncNamespace] = serializer.getLocalSnapshot();
			return result;
		},
		{}
	);
}

export function createAccountSyncMetaStorageKey(userId: string) {
	return createAccountStorageKey(ACCOUNT_STORAGE_KEY_MAP.syncMeta, userId);
}

function readStoredSyncMetaMap<T>(
	value: unknown,
	validateValue: (item: unknown) => item is T
) {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}

	return Object.values(SYNC_NAMESPACE_MAP).reduce<
		Partial<Record<TSyncNamespace, T>>
	>((result, namespace) => {
		const item = (value as Record<string, unknown>)[namespace];
		if (validateValue(item)) {
			result[namespace] = item;
		}

		return result;
	}, {});
}

function checkStoredSyncHash(value: unknown): value is string {
	return typeof value === 'string';
}

function checkNonNegativeSafeInteger(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
	);
}

function checkStoredSyncRevision(value: unknown): value is number {
	return (
		checkNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER
	);
}

function checkStoredClearedStateEpoch(value: unknown): value is number {
	return checkNonNegativeSafeInteger(value);
}

export function readAccountSyncMeta(userId: string) {
	const meta = readAccountJsonStorage<TStoredAccountSyncMeta | null>(
		createAccountSyncMetaStorageKey(userId),
		null
	);
	if (meta === null) {
		return null;
	}

	const stateEpoch = checkNonNegativeSafeInteger(meta.state_epoch)
		? meta.state_epoch
		: 0;
	const clearedStateEpoch = checkStoredClearedStateEpoch(
		meta.clearedStateEpoch
	)
		? meta.clearedStateEpoch
		: undefined;
	const sanitizedMeta: IAccountSyncMeta = {
		lastAppliedRemoteHash: readStoredSyncMetaMap<string>(
			meta.lastAppliedRemoteHash,
			checkStoredSyncHash
		),
		revisions: readStoredSyncMetaMap<number>(
			meta.revisions,
			checkStoredSyncRevision
		),
		state_epoch: stateEpoch,
	};
	if (clearedStateEpoch !== undefined) {
		sanitizedMeta.clearedStateEpoch = clearedStateEpoch;
	}

	return sanitizedMeta;
}

export function writeAccountSyncMeta(userId: string, meta: IAccountSyncMeta) {
	writeAccountJsonStorage(createAccountSyncMetaStorageKey(userId), meta);
	if (accountStore.shared.user.get()?.id === userId) {
		accountStore.shared.sync.meta.set(meta);
	}
}

export function applyRemoteAccountRecords({
	preserveNamespaces = [],
	records,
	replaceMeta = true,
	stateEpoch,
	userId,
}: {
	preserveNamespaces?: TSyncNamespace[];
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	userId: string;
}) {
	if (!checkNonNegativeSafeInteger(stateEpoch)) {
		throw new Error('invalid-sync-state-epoch');
	}

	const currentUser = accountStore.shared.user.get();
	const previousMeta = readAccountSyncMeta(userId);
	const previousStoredMeta = previousMeta as TStoredAccountSyncMeta | null;
	const previousLastAppliedRemoteHash = readStoredSyncMetaMap<string>(
		previousStoredMeta?.lastAppliedRemoteHash,
		checkStoredSyncHash
	);
	const previousRevisions = readStoredSyncMetaMap<number>(
		previousStoredMeta?.revisions,
		checkStoredSyncRevision
	);
	const previousClearedStateEpochCandidate =
		previousStoredMeta?.clearedStateEpoch;
	const previousClearedStateEpoch = checkStoredClearedStateEpoch(
		previousClearedStateEpochCandidate
	)
		? previousClearedStateEpochCandidate
		: undefined;
	const meta: IAccountSyncMeta =
		!replaceMeta && previousMeta !== null
			? {
					lastAppliedRemoteHash: { ...previousLastAppliedRemoteHash },
					revisions: { ...previousRevisions },
					state_epoch: stateEpoch,
				}
			: {
					lastAppliedRemoteHash: {},
					revisions: {},
					state_epoch: stateEpoch,
				};
	if (records.length > 0) {
		delete meta.clearedStateEpoch;
	} else if (previousClearedStateEpoch !== undefined) {
		meta.clearedStateEpoch = previousClearedStateEpoch;
	}

	preserveNamespaces.forEach((namespace) => {
		const lastAppliedRemoteHash = previousLastAppliedRemoteHash[namespace];
		if (lastAppliedRemoteHash !== undefined) {
			meta.lastAppliedRemoteHash[namespace] = lastAppliedRemoteHash;
		}
		const revision = previousRevisions[namespace];
		if (revision !== undefined) {
			meta.revisions[namespace] = revision;
		}
	});

	if (currentUser?.id !== userId) {
		return meta;
	}

	const preparedRecords = records.map((record) => {
		if (!checkNonNegativeSafeInteger(record.revision)) {
			throw new Error(`invalid-sync-revision:${record.namespace}`);
		}

		const serializer = getAccountSyncSerializer(record.namespace);
		const data = serializer.migrate(record.data, record.schema_version);

		return {
			data,
			namespace: record.namespace,
			revision: record.revision,
			serializer,
		};
	});
	let appliedRecordCount = 0;
	if (accountStore.shared.user.get()?.id !== currentUser.id) {
		return meta;
	}

	// Capture previous snapshots so we can roll back if meta persistence
	// fails after local stores have already been updated.
	const previousSnapshots = new Map(
		preparedRecords.map((record) => [
			record.namespace,
			record.serializer.getLocalSnapshot(),
		])
	);
	function rollbackAppliedRecords() {
		runWithApplyingRemoteState(() => {
			preparedRecords.forEach((record) => {
				const previous = previousSnapshots.get(record.namespace);
				if (previous !== undefined) {
					try {
						record.serializer.setLocalSnapshot(previous);
					} catch {
						/* best-effort rollback */
					}
				}
			});
		});

		if (previousMeta !== null) {
			try {
				writeAccountSyncMeta(userId, previousMeta);
			} catch (writeError) {
				console.warn(
					'Failed to restore account sync meta after rollback.',
					writeError
				);
			}
		}
	}
	if (accountStore.shared.user.get()?.id !== currentUser.id) {
		return meta;
	}

	try {
		runWithApplyingRemoteState(() => {
			preparedRecords.forEach((record) => {
				record.serializer.setLocalSnapshot(record.data);
				meta.lastAppliedRemoteHash[record.namespace] =
					createSnapshotHash(record.serializer.getLocalSnapshot());
				meta.revisions[record.namespace] = record.revision;
				appliedRecordCount += 1;
			});
		});
		if (accountStore.shared.user.get()?.id !== currentUser.id) {
			if (appliedRecordCount > 0) {
				rollbackAppliedRecords();
			}
			return meta;
		}

		writeAccountSyncMeta(userId, meta);
	} catch (error) {
		// Roll back any applied snapshots to keep local stores and
		// sync meta consistent.  Wrap in runWithApplyingRemoteState so
		// store subscriptions triggered by setLocalSnapshot do not
		// spuriously create dirty queue entries for the old data.
		if (appliedRecordCount > 0) {
			rollbackAppliedRecords();
		}

		throw error;
	}

	return meta;
}
