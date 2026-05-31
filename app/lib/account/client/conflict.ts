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
		return;
	}

	const data = getConflictResolutionData(conflict, resolution);
	const serializer = getAccountSyncSerializer(conflict.namespace);

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});

	if (resolution === 'cloud') {
		removeDirtyQueueEntry(userId, conflict.namespace);
		let meta = readAccountSyncMeta(userId);
		if (meta === null) {
			// Defensive: construct minimal meta so the applied revision
			// is recorded even when the sync meta store is unexpectedly
			// empty.  state_epoch will be corrected on the next sync pull.
			console.warn(
				'Account sync meta missing during conflict resolution, creating minimal meta.'
			);
			meta = { lastAppliedRemoteHash: {}, revisions: {}, state_epoch: 0 };
		}
		meta.lastAppliedRemoteHash[conflict.namespace] = createSnapshotHash(
			serializer.getLocalSnapshot()
		);
		meta.revisions[conflict.namespace] = conflict.revision;
		writeAccountSyncMeta(userId, meta);
		accountStore.shared.sync.conflicts.set((conflicts) =>
			conflicts.filter(
				(item) =>
					item.userId !== userId ||
					item.namespace !== conflict.namespace
			)
		);
		return;
	}

	const entry = markAccountSyncDirty({
		baseRevision: conflict.revision,
		data,
		namespace: conflict.namespace,
		userId,
	});

	if (entry !== null) {
		accountStore.shared.sync.conflicts.set((conflicts) =>
			conflicts.filter(
				(item) =>
					item.userId !== userId ||
					item.namespace !== conflict.namespace
			)
		);
	}
}
