import { createSnapshotHash } from '@/features/account/client/sync/dirtyQueue/snapshotHash';
import type { ISyncConflictItem } from '@/features/account/sync/types';

export interface IConflictResolutionPresentationAttempt {
	conflictSnapshotKey: string;
	resolutionToken: symbol;
	userId: string;
}

export function checkConflictSnapshotUnchanged(
	currentConflict: ISyncConflictItem,
	conflict: ISyncConflictItem
) {
	return (
		currentConflict.userId === conflict.userId &&
		currentConflict.namespace === conflict.namespace &&
		currentConflict.revision === conflict.revision &&
		createSnapshotHash(currentConflict.cloud) ===
			createSnapshotHash(conflict.cloud) &&
		createSnapshotHash(currentConflict.local) ===
			createSnapshotHash(conflict.local) &&
		createSnapshotHash(currentConflict.localCollision) ===
			createSnapshotHash(conflict.localCollision) &&
		createSnapshotHash(currentConflict.merged) ===
			createSnapshotHash(conflict.merged)
	);
}

export function createConflictSnapshotKey(conflict: ISyncConflictItem) {
	return JSON.stringify([
		conflict.userId,
		conflict.namespace,
		conflict.revision,
		createSnapshotHash(conflict.cloud),
		createSnapshotHash(conflict.local),
		createSnapshotHash(conflict.localCollision),
		createSnapshotHash(conflict.merged),
	]);
}

export function createConflictResolutionPresentationAttempt({
	conflict,
	resolutionToken,
	userId,
}: {
	conflict: ISyncConflictItem;
	resolutionToken: symbol;
	userId: string;
}): IConflictResolutionPresentationAttempt {
	return {
		conflictSnapshotKey: createConflictSnapshotKey(conflict),
		resolutionToken,
		userId,
	};
}

export function checkConflictResolutionPresentationAttemptCurrent({
	attempt,
	conflictSnapshotKey,
	resolutionToken,
	userId,
}: {
	attempt: IConflictResolutionPresentationAttempt;
	conflictSnapshotKey: string | null;
	resolutionToken: symbol | null;
	userId: string | null;
}) {
	return (
		attempt.userId === userId &&
		attempt.conflictSnapshotKey === conflictSnapshotKey &&
		attempt.resolutionToken === resolutionToken
	);
}
