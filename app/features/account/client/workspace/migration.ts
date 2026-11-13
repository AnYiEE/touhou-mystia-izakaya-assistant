import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import type { TAccountWorkspaceAuthOutcome } from './authContracts';
import { type TAccountWorkspaceOwner } from './contracts';
import {
	readStoredAccountWorkspace,
	writeStoredAccountWorkspace,
} from './ownerStorage';
import { ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME } from './transition';
import { workspaceStore } from './workspaceStore';

export type TAccountWorkspaceMigrationResult =
	'account' | 'guest' | 'pending-retry' | 'unsupported';

function applyMigratedOwner(owner: TAccountWorkspaceOwner) {
	workspaceStore.markAuthReconciled();
	workspaceStore.setSnapshot({
		isReady: true,
		snapshot: { generation: owner.generation, owner, phase: 'ready' },
	});
}

export async function migrateUnownedWorkspace(
	input:
		| {
				auth: Extract<
					TAccountWorkspaceAuthOutcome,
					{ kind: 'account-disabled' | 'anonymous' | 'authenticated' }
				>;
				mode: 'account-enabled';
		  }
		| { mode: 'account-disabled' }
): Promise<TAccountWorkspaceMigrationResult> {
	const result = await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			const current = readStoredAccountWorkspace();
			if (current.status === 'storage-unavailable') {
				return 'pending-retry' as const;
			}
			if (current.status === 'future' || current.status === 'invalid') {
				return 'unsupported' as const;
			}
			if (current.status === 'current') {
				const owner =
					current.workspace.owner.kind === 'guest'
						? {
								generation: current.workspace.generation,
								kind: 'guest' as const,
							}
						: {
								generation: current.workspace.generation,
								kind: 'account' as const,
								userId: current.workspace.owner.userId,
							};
				applyMigratedOwner(owner);
				return owner.kind;
			}

			if (input.mode === 'account-enabled') {
				const { auth } = input;
				if (auth.kind === 'authenticated') {
					const owner = {
						generation: 1,
						kind: 'account' as const,
						userId: auth.result.user.id,
					};
					if (
						!writeStoredAccountWorkspace({
							generation: owner.generation,
							owner: { kind: 'account', userId: owner.userId },
							version: 1,
						})
					) {
						return 'pending-retry' as const;
					}
					applyMigratedOwner(owner);
					return 'account' as const;
				}
			}

			if (
				!writeStoredAccountWorkspace({
					generation: 1,
					owner: { kind: 'guest' },
					version: 1,
				})
			) {
				return 'pending-retry' as const;
			}
			applyMigratedOwner({ generation: 1, kind: 'guest' });
			return 'guest' as const;
		},
		{ fallbackTtl: 10 * 1000, ifAvailable: false }
	);

	const resolvedResult = result ?? 'pending-retry';
	if (resolvedResult === 'pending-retry') {
		workspaceStore.setError('network');
	}
	return resolvedResult;
}
