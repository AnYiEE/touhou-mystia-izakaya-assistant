export const ACCOUNT_WORKSPACE_OWNER_KIND_MAP = {
	account: 'account',
	guest: 'guest',
} as const;

export type TInitialAccountWorkspaceAuth =
	| { kind: 'anonymous' }
	| { kind: 'authenticated'; userId: string }
	| { kind: 'unknown' };

export type TAccountWorkspaceOwner =
	| { generation: number; kind: 'guest' }
	| { generation: number; kind: 'account'; userId: string };

export type TAccountWorkspacePhase =
	'locked' | 'password-required' | 'ready' | 'resolving' | 'transitioning';

export type TAccountWorkspaceBlocker =
	'account-mismatch' | 'session-expired' | null;

export type TAccountWorkspaceTransitionStatus =
	'future' | 'invalid' | 'none' | 'owner-committed' | 'prepared';

export type TAccountWorkspaceReadinessError =
	'future' | 'invalid' | 'network' | null;

export interface IAccountWorkspaceRuntimeState {
	blocker: TAccountWorkspaceBlocker;
	error: TAccountWorkspaceReadinessError;
	isAuthReconciled: boolean;
	isInitialized: boolean;
	isReady: boolean;
	owner: TAccountWorkspaceOwner | null;
	phase: TAccountWorkspacePhase;
	transitionStatus: TAccountWorkspaceTransitionStatus;
}

export interface IAccountWorkspaceSnapshot {
	generation: number;
	owner: TAccountWorkspaceOwner | null;
	phase: TAccountWorkspacePhase;
}

export interface IStoredAccountWorkspace {
	generation: number;
	owner: { kind: 'guest' } | { kind: 'account'; userId: string };
	version: 1;
}

export type TStoredAccountWorkspaceParse =
	| { status: 'current'; workspace: IStoredAccountWorkspace }
	| { status: 'future' | 'invalid' };

export type TStoredAccountWorkspaceRead =
	| { raw: string; status: 'current'; workspace: IStoredAccountWorkspace }
	| { raw: string; status: 'future' | 'invalid' }
	| { status: 'none' | 'storage-unavailable' };

export interface IStoredAccountWorkspaceTransition {
	createdAt: number;
	from: TAccountWorkspaceOwner;
	nextGeneration: number;
	operationId: string;
	phase: 'owner-committed' | 'prepared';
	reason:
		| 'account-disabled'
		| 'account-mismatch-exit'
		| 'active-delete'
		| 'guest-adoption'
		| 'logout';
	to: TAccountWorkspaceOwner;
	version: 1;
}

export interface IAccountWorkspaceTransitionHandle {
	marker: IStoredAccountWorkspaceTransition;
	markerRaw: string;
	ownerRaw: string | null;
}

export type TAccountWorkspaceTransitionResult =
	| { status: 'committed' }
	| { status: 'busy' }
	| { status: 'stale' }
	| { status: 'storage-unavailable' }
	| { status: 'unsupported' };

export type TPrepareAccountWorkspaceTransitionResult =
	| { handle: IAccountWorkspaceTransitionHandle; status: 'prepared' }
	| Exclude<TAccountWorkspaceTransitionResult, { status: 'committed' }>;

export type TAccountWorkspaceTransitionMutationResult =
	| { markerRaw: string; status: 'committed' }
	| { status: 'stale' | 'storage-unavailable' | 'unsupported' };

export type TAccountWorkspaceTransitionRead =
	| {
			marker: IStoredAccountWorkspaceTransition;
			raw: string;
			status: 'current';
	  }
	| { raw: string; status: 'future' | 'invalid' }
	| { status: 'none' | 'storage-unavailable' };
