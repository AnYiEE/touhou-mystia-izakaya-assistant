import {
	ACCOUNT_SYNC_STATUS_MAP,
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
	checkAccountSyncStatus,
} from '@/domain/account/contracts';

import { accountStore } from '@/features/account/client/state/accountStore';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountStorage,
	removeAccountStorage,
	writeAccountJsonStorage,
} from '@/features/account/client/storage';
import {
	checkWorkspaceAccount,
	workspaceStore,
} from '@/features/account/client/workspace/workspaceStore';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import { globalPreferencesSerializer } from '@/features/account/sync/serializers/globalPreferences';
import { normalGuestMealsSerializer } from '@/features/account/sync/serializers/normalGuestMeals';
import { specialGuestMealsSerializer } from '@/features/account/sync/serializers/specialGuestMeals';
import { specialGuestPlansSerializer } from '@/features/account/sync/serializers/specialGuestPlans';
import { specialGuestSettingsSerializer } from '@/features/account/sync/serializers/specialGuestSettings';
import { themeSerializer } from '@/features/account/sync/serializers/theme';
import { tutorialSpecialGuestSerializer } from '@/features/account/sync/serializers/tutorialSpecialGuest';
import type {
	ISyncNamespaceSerializer,
	ISyncStateRecord,
} from '@/features/account/sync/types';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import { writeAccountSyncBaseSnapshot } from './baseSnapshot';
import { createSnapshotHash } from './dirtyQueue/snapshotHash';
import { readRemoteSyncData } from './remoteProtocol';
import { checkAccountSyncResetWriteAllowed } from './resetGeneration';
import { withApplyingRemoteState as runWithApplyingRemoteState } from './stateGuards';

export type TAccountSnapshot = Partial<Record<TSyncNamespace, unknown>>;

type TStoredAccountSyncMeta = Omit<
	Partial<IAccountSyncMeta>,
	'lastAppliedRemoteHash' | 'revisions'
> & { lastAppliedRemoteHash?: unknown; revisions?: unknown };

const serializers = {
	[SYNC_NAMESPACE_MAP.normalGuestMeals]: normalGuestMealsSerializer,
	[SYNC_NAMESPACE_MAP.specialGuestMeals]: specialGuestMealsSerializer,
	[SYNC_NAMESPACE_MAP.specialGuestPlans]: specialGuestPlansSerializer,
	[SYNC_NAMESPACE_MAP.specialGuestSettings]: specialGuestSettingsSerializer,
	[SYNC_NAMESPACE_MAP.globalPreferences]: globalPreferencesSerializer,
	[SYNC_NAMESPACE_MAP.theme]: themeSerializer,
	[SYNC_NAMESPACE_MAP.tutorialSpecialGuest]: tutorialSpecialGuestSerializer,
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
	return Object.fromEntries(
		Object.entries(serializers).map(([namespace, serializer]) => [
			namespace,
			serializer.getLocalSnapshot(),
		])
	) as TAccountSnapshot;
}

export function createAccountSyncMetaStorageKey(userId: string) {
	return createAccountStorageKey(ACCOUNT_STORAGE_KEY_MAP.syncMeta, userId);
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
	if (!checkIsRecord(value)) {
		return {};
	}

	return Object.values(SYNC_NAMESPACE_MAP).reduce<
		Partial<Record<TSyncNamespace, T>>
	>((result, namespace) => {
		const item = value[namespace];
		if (validateValue(item)) {
			result[namespace] = item;
		}

		return result;
	}, {});
}

function checkStoredSyncHash(value: unknown): value is string {
	return typeof value === 'string';
}

function checkStoredSyncRevision(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

export function readAccountSyncMeta(userId: string) {
	const raw = readAccountStorage(createAccountSyncMetaStorageKey(userId));
	if (raw === null) {
		return null;
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}
	if (
		!checkIsRecord(parsed) ||
		(typeof parsed['version'] === 'number' && parsed['version'] !== 1)
	) {
		return null;
	}
	const meta = parsed as TStoredAccountSyncMeta;

	const stateEpoch = isNonNegativeSafeInteger(meta.state_epoch)
		? meta.state_epoch
		: 0;
	const syncGeneration = isNonNegativeSafeInteger(meta.sync_generation)
		? meta.sync_generation
		: 0;
	const syncStatus = checkAccountSyncStatus(meta.sync_status)
		? meta.sync_status
		: ACCOUNT_SYNC_STATUS_MAP.active;
	const clearedStateEpoch = isNonNegativeSafeInteger(meta.clearedStateEpoch)
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
	const key = createAccountSyncMetaStorageKey(userId);
	const existingRaw = readAccountStorage(key);
	if (existingRaw !== null) {
		let existing: unknown;
		try {
			existing = JSON.parse(existingRaw);
		} catch {
			throw new Error('account-sync-meta-invalid');
		}
		if (
			!checkIsRecord(existing) ||
			(typeof existing['version'] === 'number' &&
				existing['version'] !== 1)
		) {
			throw new Error('account-sync-meta-future');
		}
	}
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			expectedGeneration: generationToken,
			...(resetOperationId === undefined ? {} : { resetOperationId }),
			userId,
		});
	if (!checkGeneration()) {
		throw new Error('account-sync-reset-generation-changed');
	}
	writeAccountJsonStorage(key, meta);
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

export function removeAccountSyncMetaIfCurrentVersion(
	userId: string,
	generationToken: string | null,
	deletedOperationId?: string
) {
	const checkGeneration = () =>
		checkAccountSyncResetWriteAllowed({
			...(deletedOperationId === undefined ? {} : { deletedOperationId }),
			expectedGeneration: generationToken,
			userId,
		});
	if (!checkGeneration()) {
		return false;
	}
	const key = createAccountSyncMetaStorageKey(userId);
	const raw = readAccountStorage(key);
	if (raw === null) {
		return true;
	}
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return true;
	}
	if (
		!checkIsRecord(value) ||
		(typeof value['version'] === 'number' && value['version'] !== 1) ||
		!isNonNegativeSafeInteger(value['state_epoch']) ||
		!isNonNegativeSafeInteger(value['sync_generation']) ||
		!checkAccountSyncStatus(value['sync_status']) ||
		!checkIsRecord(value['lastAppliedRemoteHash']) ||
		!checkIsRecord(value['revisions'])
	) {
		return true;
	}
	if (readAccountStorage(key) !== raw) {
		return false;
	}
	removeAccountStorage(key);
	return readAccountStorage(key) === null && checkGeneration();
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
	if (!isNonNegativeSafeInteger(stateEpoch)) {
		throw new Error('invalid-sync-state-epoch');
	}

	const currentUser = accountStore.shared.user.get();
	const checkCurrentUserAndWorkspace = () =>
		accountStore.shared.user.get()?.id === userId &&
		workspaceStore.phase.get() === 'ready' &&
		checkWorkspaceAccount(workspaceStore.owner.get(), userId);
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
	const previousClearedStateEpoch = isNonNegativeSafeInteger(
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

	if (
		currentUser?.id !== userId ||
		workspaceStore.phase.get() !== 'ready' ||
		!checkWorkspaceAccount(workspaceStore.owner.get(), userId)
	) {
		return meta;
	}

	const preparedRecords = records.map((record) => {
		if (!isNonNegativeSafeInteger(record.revision)) {
			throw new Error(`invalid-sync-revision:${record.namespace}`);
		}

		const serializer = getAccountSyncSerializer(record.namespace);
		const data = readRemoteSyncData(record);

		return {
			data,
			namespace: record.namespace,
			revision: record.revision,
			serializer,
		};
	});
	let appliedRecordCount = 0;
	if (!checkCurrentUserAndWorkspace()) {
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
					{ errorCode: getLogSafeErrorCode(writeError) }
				);
			}
		}
	}

	if (!checkCurrentUserAndWorkspace()) {
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

		if (!checkCurrentUserAndWorkspace()) {
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
