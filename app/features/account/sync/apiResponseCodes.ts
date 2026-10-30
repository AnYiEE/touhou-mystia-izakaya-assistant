export const ACCOUNT_SYNC_API_RESPONSE_CODE_MAP = {
	accountCapacityExceeded: 'sync-account-capacity-exceeded',
	conflict: 'sync-conflict',
	corruptUserState: 'corrupt-user-state',
	generationMismatch: 'sync-generation-mismatch',
	internalWriteError: 'internal-write-error',
	notPaused: 'sync-not-paused',
	paused: 'sync-paused',
	rebuildConflict: 'sync-rebuild-conflict',
	requestTooLarge: 'sync-request-too-large',
	schemaUpdateRequired: 'sync-schema-update-required',
	unknownNamespace: 'unknown-namespace',
} as const;
