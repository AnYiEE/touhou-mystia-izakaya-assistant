import { writeAccountSyncBaseSnapshot } from './baseSnapshot';
import { createSnapshotHash } from './queue';
import { checkAccountSyncResetWriteAllowed } from './resetGeneration';

import { withApplyingRemoteState as runWithApplyingRemoteState } from './stateGuards';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import {
	ACCOUNT_SYNC_STATUS_MAP,
	checkAccountSyncStatus,
} from '@/lib/account/shared/constants';
import {
	type IAccountSyncMeta,
	type ISyncNamespaceSerializer,
	type ISyncStateRecord,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import { withCrossTabLock } from '@/utilities/crossTabLock';
import { customerNormalMealsSerializer } from '@/lib/account/sync/serializers/customerNormalMeals';
import { customerRareMealsSerializer } from '@/lib/account/sync/serializers/customerRareMeals';
import { customerRarePlansSerializer } from '@/lib/account/sync/serializers/customerRarePlans';
import { customerRareSettingsSerializer } from '@/lib/account/sync/serializers/customerRareSettings';
import { globalPreferencesSerializer } from '@/lib/account/sync/serializers/globalPreferences';
import { themeSerializer } from '@/lib/account/sync/serializers/theme';
import { tutorialCustomerRareSerializer } from '@/lib/account/sync/serializers/tutorialCustomerRare';

export type TAccountSnapshot = Partial<Record<TSyncNamespace, unknown>>;

type TStoredAccountSyncMeta = Omit<
	Partial<IAccountSyncMeta>,
	'lastAppliedRemoteHash' | 'revisions'
> & { lastAppliedRemoteHash?: unknown; revisions?: unknown };

const serializers = {
	[SYNC_NAMESPACE_MAP.customerNormalMeals]: customerNormalMealsSerializer,
	[SYNC_NAMESPACE_MAP.customerRareMeals]: customerRareMealsSerializer,
	[SYNC_NAMESPACE_MAP.customerRarePlans]: customerRarePlansSerializer,
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

/** Only call after the server has permanently deleted this account. */
export function removeAccountSyncMetaForAccountDeletion(userId: string) {
	removeAccountStorage(createAccountSyncMetaStorageKey(userId));
}

export function withAccountSyncMetaTransitionLock<T>(
	userId: string,
	generationToken: string | null,
	callback: () => Promise<T> | T
) {
	return withCrossTabLock(
		`account-sync-meta-transition:${userId}`,
		() => {
			if (
				!checkAccountSyncResetWriteAllowed({
					expectedGeneration: generationToken,
					userId,
				})
			) {
				return null;
			}
			return callback();
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: true }
	);
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
	const syncGeneration = checkNonNegativeSafeInteger(meta.sync_generation)
		? meta.sync_generation
		: 0;
	const syncStatus = checkAccountSyncStatus(meta.sync_status)
		? meta.sync_status
		: ACCOUNT_SYNC_STATUS_MAP.active;
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
		sync_generation: syncGeneration,
		sync_status: syncStatus,
	};
	if (clearedStateEpoch !== undefined) {
		sanitizedMeta.clearedStateEpoch = clearedStateEpoch;
	}

	return sanitizedMeta;
}

export function writeAccountSyncMeta(
	userId: string,
	meta: IAccountSyncMeta,
	{
		generationToken,
		resetOperationId,
		suppressRuntime = false,
	}: {
		generationToken: string | null;
		resetOperationId?: string;
		suppressRuntime?: boolean;
	}
) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		});
	if (!checkGeneration()) {
		throw new Error('account-sync-reset-generation-changed');
	}
	writeAccountJsonStorage(createAccountSyncMetaStorageKey(userId), meta);
	if (!checkGeneration()) {
		throw new Error('account-sync-reset-generation-changed');
	}
	if (!suppressRuntime && accountStore.shared.user.get()?.id === userId) {
		accountStore.shared.sync.meta.set(meta);
	}
}

export function removeAccountSyncMetaIfCurrent(
	userId: string,
	generationToken: string | null
) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	removeAccountStorage(createAccountSyncMetaStorageKey(userId));
	return checkGeneration();
}

export function applyRemoteAccountRecords({
	generationToken,
	preserveNamespaces = [],
	records,
	replaceMeta = true,
	stateEpoch,
	syncGeneration,
	syncStatus,
	userId,
}: {
	generationToken: string | null;
	preserveNamespaces?: TSyncNamespace[];
	records: ISyncStateRecord[];
	replaceMeta?: boolean;
	stateEpoch: number;
	syncGeneration: number;
	syncStatus: IAccountSyncMeta['sync_status'];
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
					sync_generation: syncGeneration,
					sync_status: syncStatus,
				}
			: {
					lastAppliedRemoteHash: {},
					revisions: {},
					state_epoch: stateEpoch,
					sync_generation: syncGeneration,
					sync_status: syncStatus,
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
				writeAccountSyncMeta(userId, previousMeta, { generationToken });
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

		writeAccountSyncMeta(userId, meta, { generationToken });
		preparedRecords.forEach((record) => {
			writeAccountSyncBaseSnapshot({
				data: record.data,
				generationToken,
				namespace: record.namespace,
				revision: record.revision,
				userId,
			});
		});
	} catch (error) {
		if (appliedRecordCount > 0) {
			rollbackAppliedRecords();
		}

		throw error;
	}

	return meta;
}
