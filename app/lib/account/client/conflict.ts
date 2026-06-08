import { type ISyncConflictItem } from '@/lib/account/sync';
import { accountStore } from '@/stores/account';
import {
	createSnapshotHash,
	markAccountSyncDirty,
	removeDirtyQueueEntry,
} from './queue';
import {
	getAccountSyncSerializer,
	readAccountSyncMeta,
	withApplyingRemoteState,
	writeAccountSyncMeta,
} from './snapshot';

export type TSyncConflictResolution = 'cloud' | 'local' | 'merged';

function getConflictResolutionData(
	conflict: ISyncConflictItem,
	resolution: TSyncConflictResolution
) {
	if (resolution === 'cloud') {
		return conflict.cloud;
	}
	if (resolution === 'merged' && conflict.merged !== null) {
		return conflict.merged;
	}

	return conflict.local;
}

function clearResolvedConflict(userId: string, namespace: string) {
	accountStore.shared.sync.conflicts.set((conflicts) =>
		conflicts.filter(
			(item) => item.userId !== userId || item.namespace !== namespace
		)
	);
	const hasRemainingConflict = accountStore.shared.sync.conflicts
		.get()
		.some((item) => item.userId === userId);
	if (
		!hasRemainingConflict &&
		accountStore.shared.sync.lastError.get() === 'conflict'
	) {
		accountStore.shared.sync.lastError.set(null);
	}
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
	return accountStore.shared.user.get()?.id === userId;
}

export function resolveAccountSyncConflict({
	conflict,
	resolution,
	userId,
}: {
	conflict: ISyncConflictItem;
	resolution: TSyncConflictResolution;
	userId: string;
}) {
	if (conflict.userId !== userId) {
		return false;
	}
	if (resolution === 'merged' && conflict.merged === null) {
		return false;
	}
	if (!checkActiveConflictUser(userId)) {
		return false;
	}

	const data = getConflictResolutionData(conflict, resolution);
	const serializer = getAccountSyncSerializer(conflict.namespace);
	const previousSnapshot = serializer.getLocalSnapshot();

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});
	if (!checkActiveConflictUser(userId)) {
		rollbackConflictSnapshot(serializer, previousSnapshot);

		return false;
	}

	if (resolution === 'cloud') {
		const previousMeta = readAccountSyncMeta(userId);
		const currentMeta = accountStore.shared.sync.meta.get();
		const metaSource =
			accountStore.shared.user.get()?.id === userId &&
			currentMeta !== null
				? currentMeta
				: previousMeta;
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
		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);

			return false;
		}
		try {
			meta.lastAppliedRemoteHash[conflict.namespace] = createSnapshotHash(
				serializer.getLocalSnapshot()
			);
			meta.revisions[conflict.namespace] = conflict.revision;
			writeAccountSyncMeta(userId, meta);
		} catch (error) {
			withApplyingRemoteState(() => {
				try {
					serializer.setLocalSnapshot(previousSnapshot);
				} catch {
					/* best-effort rollback */
				}
			});
			if (previousMeta !== null) {
				try {
					writeAccountSyncMeta(userId, previousMeta);
				} catch (writeError) {
					console.warn(
						'Failed to restore account sync meta after conflict rollback.',
						writeError
					);
				}
			}

			throw error;
		}
		removeDirtyQueueEntry(userId, conflict.namespace);
		clearResolvedConflict(userId, conflict.namespace);
		return true;
	}

	let entry;
	try {
		if (!checkActiveConflictUser(userId)) {
			rollbackConflictSnapshot(serializer, previousSnapshot);

			return false;
		}
		entry = markAccountSyncDirty({
			baseRevision: conflict.revision,
			data,
			namespace: conflict.namespace,
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

	clearResolvedConflict(userId, conflict.namespace);

	return true;
}
