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
	schema_version: number;
	snapshotHash: string;
}

export interface IAccountSyncBroadcastMessage {
	deleteStartedAt?: number;
	namespaces: TSyncNamespace[];
	operationId: string;
	state_epoch: number;
	tabId: string;
	type:
		| 'data-deleted'
		| 'dirty'
		| 'lease-changed'
		| 'remote-applied'
		| 'uploaded';
	userId: string;
}

export interface ISyncConflictItem<T = unknown> {
	cloud: T;
	local: T;
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

export type TSyncStatePutResult =
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
