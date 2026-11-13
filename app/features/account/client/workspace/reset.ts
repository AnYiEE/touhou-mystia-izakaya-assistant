import { SYNC_NAMESPACE_MAP } from '@/domain/account/contracts';

import {
	getAccountSyncSerializer,
	withApplyingRemoteState,
} from '@/features/account/client/sync/snapshot';
import { checkSnapshotEqual } from '@/features/account/sync/serializers/utils';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import { type IAccountWorkspaceSnapshot } from './contracts';
import { ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME } from './transition';
import {
	captureAccountWorkspace,
	checkCurrentAccountWorkspace,
} from './workspaceStore';

export type TAccountWorkspaceResetResult =
	'busy' | 'reset' | 'stale' | 'storage-unavailable';

export async function resetAccountWorkspaceData({
	expected,
	operationId,
}: {
	expected: IAccountWorkspaceSnapshot;
	operationId: string;
}): Promise<TAccountWorkspaceResetResult> {
	const lockedResult = await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			void operationId;
			if (!checkCurrentAccountWorkspace(expected)) {
				return 'stale' as const;
			}

			try {
				for (const namespace of Object.values(SYNC_NAMESPACE_MAP)) {
					if (!checkCurrentAccountWorkspace(expected)) {
						return 'stale' as const;
					}
					const serializer = getAccountSyncSerializer(namespace);
					const defaultSnapshot = serializer.getDefaultSnapshot();
					withApplyingRemoteState(() => {
						serializer.setLocalSnapshot(defaultSnapshot);
					});
					if (
						!checkSnapshotEqual(
							serializer.getLocalSnapshot(),
							defaultSnapshot
						)
					) {
						return 'storage-unavailable' as const;
					}
				}
				return checkCurrentAccountWorkspace(captureAccountWorkspace())
					? ('reset' as const)
					: ('stale' as const);
			} catch {
				return 'storage-unavailable' as const;
			}
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: true }
	);

	return lockedResult ?? 'busy';
}
