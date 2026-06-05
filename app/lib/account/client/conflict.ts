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

	const data = getConflictResolutionData(conflict, resolution);
	const serializer = getAccountSyncSerializer(conflict.namespace);
	const previousSnapshot = serializer.getLocalSnapshot();

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});

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
		accountStore.shared.sync.conflicts.set((conflicts) =>
			conflicts.filter(
				(item) =>
					item.userId !== userId ||
					item.namespace !== conflict.namespace
			)
		);
		return true;
	}

	let entry;
	try {
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

	accountStore.shared.sync.conflicts.set((conflicts) =>
		conflicts.filter(
			(item) =>
				item.userId !== userId || item.namespace !== conflict.namespace
		)
	);

	return true;
}
