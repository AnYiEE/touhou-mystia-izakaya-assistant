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
	const data = getConflictResolutionData(conflict, resolution);
	const serializer = getAccountSyncSerializer(conflict.namespace);

	withApplyingRemoteState(() => {
		serializer.setLocalSnapshot(data);
	});

	if (resolution === 'cloud') {
		removeDirtyQueueEntry(userId, conflict.namespace);
		const meta = readAccountSyncMeta(userId);
		if (meta !== null) {
			meta.lastAppliedRemoteHash[conflict.namespace] =
				createSnapshotHash(data);
			meta.revisions[conflict.namespace] = conflict.revision;
			writeAccountSyncMeta(userId, meta);
		}
		accountStore.shared.sync.conflicts.set((conflicts) =>
			conflicts.filter(
				(item) =>
					item.userId !== userId ||
					item.namespace !== conflict.namespace
			)
		);
		return;
	}

	markAccountSyncDirty({
		baseRevision: conflict.revision,
		data,
		namespace: conflict.namespace,
		userId,
	});

	accountStore.shared.sync.conflicts.set((conflicts) =>
		conflicts.filter(
			(item) =>
				item.userId !== userId || item.namespace !== conflict.namespace
		)
	);
}
