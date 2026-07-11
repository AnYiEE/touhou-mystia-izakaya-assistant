import { type TSyncNamespace } from './constants';

export interface ISyncStateChange {
	data: unknown;
	namespace: TSyncNamespace;
	revision: number;
	schema_version: number;
}

export interface ISyncStatePutBody {
	changes: ISyncStateChange[];
	state_epoch: number;
}

export interface ISyncStatePingBody extends ISyncStatePutBody {
	csrf_token: string;
}

export interface IAccountSyncMeta {
	clearedStateEpoch?: number;
	lastAppliedRemoteHash: Partial<Record<TSyncNamespace, string>>;
	revisions: Partial<Record<TSyncNamespace, number>>;
	state_epoch: number;
}

export type TSyncPausedReason =
	| 'applying-remote'
	| 'bootstrap'
	| 'conflict'
	| 'delete-data'
	| 'importing-backup';

export interface IDirtyQueueEntry {
	attempts: number;
	baseRevision: number;
	clientMutationId: string;
	conflict: ISyncConflictItem | null;
	data: unknown;
	dirtyAt: number;
	lastError: string | null;
	namespace: TSyncNamespace;
	paused: TSyncPausedReason | null;
	queueOperationId?: string;
	schema_version: number;
	snapshotHash: string;
}

export interface IAccountSyncBroadcastMessage {
	accountRuntime?: {
		createdAt: number;
		reason:
			| 'account-deleted'
			| 'credential-changed'
			| 'login'
			| 'logout'
			| 'logout-all'
			| 'password-changed'
			| 'password-required'
			| 'session-expired';
		version: 1;
	};
	deleteStartedAt?: number;
	namespaces: TSyncNamespace[];
	operationId: string;
	runtimeMutationId?: string;
	runtimeReason?:
		| 'conflict-changed'
		| 'conflict-created'
		| 'conflict-heartbeat'
		| 'conflict-resolved'
		| 'queue-changed';
	syncOperation?: {
		expiresAt: number;
		kind: 'delete-data' | 'import-backup';
		ownerTabId: string;
		startedAt: number;
		status: 'ended' | 'renewed' | 'started';
	};
	state_epoch: number;
	tabId: string;
	type:
		| 'account-updated'
		| 'data-deleted'
		| 'dirty'
		| 'lease-changed'
		| 'profile-updated'
		| 'remote-applied'
		| 'uploaded';
	userId: string;
}

export interface IAccountSyncBaseSnapshot {
	data: unknown;
	namespace: TSyncNamespace;
	revision: number;
	resetGeneration?: string | null;
	schema_version: number;
	snapshotHash: string;
}

export interface ISyncConflictItem<T = unknown> {
	cloud: T;
	local: T;
	localCollision?: {
		candidates: Array<{
			baseRevision: number;
			data: T;
			id: string;
			label: string;
			schemaVersion: number;
			snapshotHash: string;
		}>;
		invalidEvidenceCount: number;
		token: string;
		version: 1;
	};
	merged: T | null;
	namespace: TSyncNamespace;
	revision: number;
	userId: string;
}

export interface ISyncStateItemSuccess {
	namespace: TSyncNamespace;
	revision: number;
	status: 'ok';
	updated_at: number;
}

export interface ISyncStateItemConflict {
	data: unknown;
	namespace: TSyncNamespace;
	revision: number;
	schema_version: number;
	status: 'conflict';
	updated_at: number;
}

export interface ISyncStateItemCapacityError {
	candidate_bytes: number;
	candidate_namespace_bytes: number;
	current_bytes: number;
	current_namespace_bytes: number;
	limit_bytes: number;
	message: 'sync-account-capacity-exceeded';
	namespace: TSyncNamespace;
	namespaces: TSyncNamespace[];
	status: 'error';
}

export interface ISyncStateItemSchemaUpdateRequiredError {
	current_schema_version: number;
	message: 'sync-schema-update-required';
	namespace: TSyncNamespace;
	status: 'error';
}

export type TSyncStatePutResult =
	| ISyncStateItemCapacityError
	| ISyncStateItemSchemaUpdateRequiredError
	| ISyncStateItemConflict
	| ISyncStateItemSuccess
	| { message: string; namespace: TSyncNamespace; status: 'error' };

export interface ISyncStateRecord {
	data: unknown;
	namespace: TSyncNamespace;
	revision: number;
	schema_version: number;
	updated_at: number;
}

export interface ISyncStateGetResponse {
	records: ISyncStateRecord[];
	state_epoch: number;
}

export interface ISyncStatePutResponse {
	results: TSyncStatePutResult[];
	state_epoch: number;
}

export interface ISyncImportBackupCodeResponse {
	results: Array<{
		namespace: TSyncNamespace;
		revision: number;
		status: 'ok';
	}>;
}

export interface ISyncMergeParams<T> {
	allowBaseNullAutoMerge?: boolean;
	base: T | null;
	cloud: T | null;
	local: T;
	namespace: TSyncNamespace;
}

export interface ISyncMergeResult<T> {
	conflict: ISyncConflictItem<T> | null;
	data: T;
	requiresConfirmation: boolean;
	shouldUpload: boolean;
}

export interface ISyncNamespaceSerializer<T> {
	deserialize(data: unknown): T;
	getDefaultSnapshot(): T;
	getLocalSnapshot(): T;
	merge(params: ISyncMergeParams<T>): ISyncMergeResult<T>;
	migrate(data: unknown, version: number): T;
	serialize(data: T): unknown;
	setLocalSnapshot(data: T): void;
	validate(data: unknown): data is T;
}
