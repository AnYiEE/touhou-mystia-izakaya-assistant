export const ACCOUNT_STORAGE_KEY_MAP = {
	baseSnapshot: 'account:sync-base',
	conflictResolution: 'account-sync-conflict-resolution',
	dirtyEvidence: 'account-sync-dirty-evidence-v1',
	dirtyQueue: 'account-sync-dirty',
	dirtyQueueV2: 'account-sync-dirty-v2',
	dirtyTransition: 'account-sync-dirty-transition',
	lease: 'account-sync-uploader',
	resetGeneration: 'account-sync-reset-generation',
	runtimeSignal: 'account-runtime-signal',
	syncMeta: 'account-sync-meta',
	syncOperation: 'account-sync-operation',
	workspaceOwner: 'account-workspace-owner',
	workspaceTransition: 'account-workspace-transition',
} as const;

export function createAccountStorageKey(...parts: string[]) {
	return parts.join(':');
}
