/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable unicorn/consistent-destructuring -- State-machine branches read discriminating fields at their use sites. */

import { type IFeatureAccessResponse } from '@/domain/featureAccess/contracts';

import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import {
	AccountApiError,
	clearDisabledAccountSession,
	deleteAccount,
	fetchAccountMe,
	logoutAccount,
	logoutAllAccount,
} from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import {
	applyAccountAuthSuccessResponse,
	clearAccountSessionInitialData,
	resetAccountSyncRuntime,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import {
	readDirtyQueueEntries,
	readIsolatedDirtyQueueNamespaces,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { takeOverLocalAccountData } from '@/features/account/client/sync/localTakeover';
import { restoreAccountSyncRuntimeState } from '@/features/account/client/sync/remoteState';
import {
	markAccountSyncResetGenerationDeleted,
	withAccountSyncResetGenerationLock,
} from '@/features/account/client/sync/resetGeneration';
import { readAccountSyncMeta } from '@/features/account/client/sync/snapshot';
import {
	checkAccountSyncOperationActive,
	withAccountSyncOperationLease,
} from '@/features/account/client/sync/syncOperationLease';
import { clearAccountSyncRuntimeConflicts } from '@/features/account/client/sync/syncRuntimeState';
import type {
	IAuthLoginSuccessResponse,
	TAccountMeResponse,
} from '@/features/account/contracts';

import {
	type TAccountWorkspaceAuthOutcome,
	classifyAccountWorkspaceAuthOutcome,
} from './authOutcome';
import {
	checkCurrentAccountWorkspacePendingAuth,
	clearAccountWorkspacePendingAuth,
	readAccountWorkspacePendingAuth,
	setAccountWorkspacePendingAuth,
} from './authRuntime';
import {
	type IAccountWorkspaceSnapshot,
	type IStoredAccountWorkspaceTransition,
	type TAccountWorkspaceOwner,
} from './contracts';
import {
	releaseAccountWorkspaceMetadata,
	releaseAccountWorkspaceOperationState,
} from './metadataRelease';
import { migrateUnownedWorkspace } from './migration';
import { readStoredAccountWorkspace } from './ownerStorage';
import { resetAccountWorkspaceData } from './reset';
import {
	cancelPreparedAccountWorkspaceTransition,
	commitAccountWorkspaceOwner,
	finishAccountWorkspaceTransition,
	prepareAccountWorkspaceTransition,
	readAccountWorkspaceTransition,
	recoverAccountWorkspaceTransition,
	restoreWorkspaceRuntimeFromStorage,
} from './transition';
import {
	captureAccountWorkspace,
	checkWorkspaceAccount,
	workspaceStore,
} from './workspaceStore';
import { workspaceUiStore } from './workspaceUiStore';

export type TAccountWorkspaceReconcileResult =
	| 'adoption-required'
	| 'disabled'
	| 'guest'
	| 'locked'
	| 'password-required'
	| 'pending-retry'
	| 'ready'
	| 'unsupported';

export type TAccountWorkspaceExitExecutionResult =
	| 'account-mismatch'
	| 'busy'
	| 'guest'
	| 'locked'
	| 'pending-recovery'
	| 'ready'
	| { message: string; status: 'retry' }
	| 'unsupported';

function getCurrentOwner() {
	return workspaceStore.owner.get();
}

function setWorkspaceReady(owner: TAccountWorkspaceOwner) {
	workspaceStore.markAuthReconciled();
	workspaceStore.setSnapshot({
		isReady: true,
		snapshot: { generation: owner.generation, owner, phase: 'ready' },
	});
	workspaceStore.setError(null);
}

function setWorkspaceBlocked(
	owner: TAccountWorkspaceOwner,
	blocker: 'account-mismatch' | 'session-expired',
	phase: 'locked' | 'password-required' = 'locked'
) {
	workspaceStore.markAuthReconciled();
	workspaceStore.setSnapshot({
		isReady: false,
		snapshot: { generation: owner.generation, owner, phase },
	});
	workspaceStore.setBlocker(blocker);
	workspaceStore.setError(null);
	accountStore.setPasswordMustChange(phase === 'password-required');
}

function applyGuestProjection(featureAccess: IFeatureAccessResponse | null) {
	clearAccountWorkspacePendingAuth();
	clearAccountSessionInitialData();
	clearAccountSyncRuntimeConflicts();
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.featureAccess.set(featureAccess);
	accountStore.shared.hasPassword.set(false);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.user.set(null);
}

function applyAuthenticatedProjection(
	data: Extract<TAccountMeResponse, { isLoggedIn: true }>
) {
	const {
		csrf_token: csrfToken,
		feature_access: featureAccess,
		has_password: hasPassword,
		password_must_change: passwordMustChange,
		syncMeta,
		user,
	} = data;
	clearAccountWorkspacePendingAuth();
	accountStore.shared.bootstrapStatus.set('loggedIn');
	accountStore.shared.csrfToken.set(csrfToken);
	accountStore.shared.featureAccess.set(featureAccess);
	accountStore.shared.hasPassword.set(hasPassword);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(true);
	accountStore.shared.sync.lastError.set(null);
	accountStore.shared.sync.meta.set(readAccountSyncMeta(user.id) ?? syncMeta);
	accountStore.shared.user.set(user);
	accountStore.setPasswordMustChange(passwordMustChange);
	restoreAccountSyncRuntimeState(user.id);
}

function applyLockedProjection() {
	clearAccountWorkspacePendingAuth();
	clearAccountSessionInitialData();
	clearAccountSyncRuntimeConflicts();
	resetAccountSyncRuntime();
	accountStore.shared.bootstrapStatus.set('anonymous');
	accountStore.shared.csrfToken.set(null);
	accountStore.shared.featureAccess.set(null);
	accountStore.shared.hasPassword.set(false);
	accountStore.shared.isBootstrapped.set(true);
	accountStore.shared.isLoggedIn.set(false);
	accountStore.setPasswordMustChange(false);
	accountStore.shared.sync.meta.set(null);
	accountStore.shared.user.set(null);
}

async function readCurrentAccountWorkspaceAuthOutcome(): Promise<TAccountWorkspaceAuthOutcome> {
	try {
		const result = await fetchAccountMe();
		if (result.status === 'ok') {
			return classifyAccountWorkspaceAuthOutcome({
				response: result.data,
				source: 'me-refresh',
			});
		}
		return classifyAccountWorkspaceAuthOutcome({
			error: new AccountApiError(
				result.message,
				result.httpStatus,
				null,
				result.data
			),
			source: 'me-refresh',
		});
	} catch (error) {
		return { error, kind: 'transient' };
	}
}

function createPendingGuestAuth(
	data: Extract<TAccountMeResponse, { isLoggedIn: true }>,
	owner: Extract<TAccountWorkspaceOwner, { kind: 'guest' }>,
	reason: 'guest-adoption' | 'password-required'
) {
	setAccountWorkspacePendingAuth({
		authOperationId: createAccountClientId(),
		csrfToken: data.csrf_token,
		expectedWorkspaceGeneration: owner.generation,
		featureAccess: data.feature_access,
		hasPassword: data.has_password,
		passwordMustChange: data.password_must_change,
		reason,
		user: data.user,
	});
	workspaceStore.setSnapshot({
		isReady: false,
		snapshot: {
			generation: owner.generation,
			owner,
			phase:
				reason === 'password-required'
					? 'password-required'
					: 'transitioning',
		},
	});
	if (reason === 'password-required') {
		accountStore.setPasswordMustChange(true);
	}
}

function createPendingMismatchAuth(
	data: Extract<TAccountMeResponse, { isLoggedIn: true }>,
	owner: Extract<TAccountWorkspaceOwner, { kind: 'account' }>
) {
	setAccountWorkspacePendingAuth({
		authOperationId: createAccountClientId(),
		csrfToken: data.csrf_token,
		expectedWorkspaceGeneration: owner.generation,
		featureAccess: data.feature_access,
		hasPassword: data.has_password,
		passwordMustChange: data.password_must_change,
		reason: 'account-mismatch',
		user: data.user,
	});
}

async function completeDisabledAccountWorkspace({
	owner,
	sessionUserId,
}: {
	owner: Extract<TAccountWorkspaceOwner, { kind: 'account' }>;
	sessionUserId: string;
}) {
	if (owner.userId !== sessionUserId) {
		return 'locked' as const;
	}

	const result = await withAccountSyncOperationLease(
		owner.userId,
		'workspace-logout',
		async () => {
			const existingTransition = readAccountWorkspaceTransition();
			if (existingTransition.status === 'current') {
				if (existingTransition.marker.reason !== 'account-disabled') {
					return 'pending-retry' as const;
				}
				return completePreparedAccountToGuest({
					expectedMarkerRaw: existingTransition.raw,
					marker: existingTransition.marker,
					resetData: false,
					writeDeletedTombstone: false,
				});
			}
			const expected = captureAccountWorkspace();
			const nextOwner: TAccountWorkspaceOwner = {
				generation: owner.generation + 1,
				kind: 'guest',
			};
			const prepared = await prepareAccountWorkspaceTransition({
				expected,
				reason: 'account-disabled',
				to: nextOwner,
			});
			if (prepared.status !== 'prepared') {
				return prepared.status;
			}
			if (!releaseAccountWorkspaceMetadata(owner.userId)) {
				return 'storage-unavailable' as const;
			}
			const committed = await commitAccountWorkspaceOwner({
				expectedMarkerRaw: prepared.handle.markerRaw,
				expectedOwnerRaw: prepared.handle.ownerRaw,
				nextOwner,
			});
			if (committed.status !== 'committed') {
				return committed.status;
			}
			const finished = await finishAccountWorkspaceTransition({
				expectedMarkerRaw: committed.markerRaw,
			});
			if (finished.status !== 'committed') {
				return finished.status;
			}
			workspaceStore.markAuthReconciled();
			const stateEpoch = accountStore.shared.user.get()?.state_epoch ?? 0;
			applyGuestProjection(null);
			accountStore.closeAccountModal();
			void publishAccountRuntimeInvalidation({
				reason: 'account-disabled',
				stateEpoch,
				userId: owner.userId,
			});
			await clearDisabledAccountSession().catch(() => false);
			return 'guest' as const;
		}
	);

	if (result === 'guest') {
		releaseAccountWorkspaceOperationState(owner.userId);
		return 'guest';
	}
	return 'pending-retry';
}

let activeGuestAdoption: Promise<
	Awaited<ReturnType<typeof runCompleteGuestAdoption>>
> | null = null;

async function runCompleteGuestAdoption() {
	const pendingAuth = readAccountWorkspacePendingAuth();
	const owner = getCurrentOwner();
	if (
		pendingAuth === null ||
		owner?.kind !== 'guest' ||
		owner.generation !== pendingAuth.expectedWorkspaceGeneration ||
		pendingAuth.reason !== 'guest-adoption'
	) {
		workspaceUiStore.adoptionStatus.set('idle');
		return 'stale' as const;
	}
	workspaceUiStore.adoptionStatus.set('submitting');
	const existingTransition = readAccountWorkspaceTransition();
	if (existingTransition.status === 'current') {
		if (existingTransition.marker.reason !== 'guest-adoption') {
			workspaceUiStore.adoptionStatus.set('failed');
			return 'pending-retry' as const;
		}
		const resumed = await withAccountSyncOperationLease(
			pendingAuth.user.id,
			'guest-adoption',
			async () => {
				const currentTransition = readAccountWorkspaceTransition();
				if (
					currentTransition.status !== 'current' ||
					currentTransition.raw !== existingTransition.raw
				) {
					return 'stale' as const;
				}
				return completePreparedGuestAdoption({
					marker: currentTransition.marker,
					markerRaw: currentTransition.raw,
					pendingAuth,
				});
			}
		);
		if (resumed === 'ready') {
			releaseAccountWorkspaceOperationState(pendingAuth.user.id);
		}
		workspaceUiStore.adoptionStatus.set(
			resumed === 'ready' ? 'idle' : 'failed'
		);
		if (resumed !== 'ready') {
			workspaceStore.setError('network');
		}
		return resumed ?? 'busy';
	}

	const nextOwner: TAccountWorkspaceOwner = {
		generation: owner.generation + 1,
		kind: 'account',
		userId: pendingAuth.user.id,
	};
	const operationResult = await withAccountSyncOperationLease(
		pendingAuth.user.id,
		'guest-adoption',
		async () => {
			const expected = captureAccountWorkspace();
			const prepared = await prepareAccountWorkspaceTransition({
				expected,
				reason: 'guest-adoption',
				to: nextOwner,
			});
			if (prepared.status !== 'prepared') {
				return prepared.status;
			}

			const canSync =
				pendingAuth.featureAccess.modules['account.sync'].allowed;
			const didTakeOver =
				!canSync ||
				(await takeOverLocalAccountData().catch(() => false));
			if (!didTakeOver) {
				return 'pending-retry' as const;
			}

			const committed = await commitAccountWorkspaceOwner({
				expectedMarkerRaw: prepared.handle.markerRaw,
				expectedOwnerRaw: prepared.handle.ownerRaw,
				nextOwner,
			});
			if (committed.status !== 'committed') {
				return 'pending-retry' as const;
			}
			const finished = await finishAccountWorkspaceTransition({
				expectedMarkerRaw: committed.markerRaw,
			});
			if (finished.status !== 'committed') {
				return 'pending-retry' as const;
			}

			workspaceStore.markAuthReconciled();
			applyAuthenticatedProjection({
				csrf_token: pendingAuth.csrfToken,
				feature_access: pendingAuth.featureAccess,
				featureEnabled: true,
				has_password: pendingAuth.hasPassword,
				isLoggedIn: true,
				password_must_change: pendingAuth.passwordMustChange,
				state_epoch: pendingAuth.user.state_epoch,
				syncMeta: readAccountSyncMeta(pendingAuth.user.id) ?? {
					lastAppliedRemoteHash: {},
					revisions: {},
					state_epoch: pendingAuth.user.state_epoch,
					sync_generation: pendingAuth.user.sync_generation,
					sync_status: pendingAuth.user.sync_status,
				},
				user: pendingAuth.user,
			});
			void publishAccountRuntimeInvalidation({
				reason: 'login',
				stateEpoch: pendingAuth.user.state_epoch,
				userId: pendingAuth.user.id,
			});
			return 'ready' as const;
		}
	);

	if (operationResult === 'ready') {
		releaseAccountWorkspaceOperationState(pendingAuth.user.id);
		workspaceUiStore.adoptionStatus.set('idle');
		return 'ready' as const;
	}
	workspaceUiStore.adoptionStatus.set('failed');
	workspaceStore.setError('network');
	return operationResult ?? 'busy';
}

export function completeGuestAdoption() {
	if (activeGuestAdoption !== null) {
		return activeGuestAdoption;
	}
	const operation = runCompleteGuestAdoption().finally(() => {
		if (activeGuestAdoption === operation) {
			activeGuestAdoption = null;
		}
	});
	activeGuestAdoption = operation;
	return operation;
}

async function completePreparedGuestAdoption({
	marker,
	markerRaw,
	pendingAuth,
}: {
	marker: IStoredAccountWorkspaceTransition;
	markerRaw: string;
	pendingAuth: NonNullable<
		ReturnType<typeof readAccountWorkspacePendingAuth>
	>;
}) {
	if (
		marker.reason !== 'guest-adoption' ||
		marker.phase !== 'prepared' ||
		marker.from.kind !== 'guest' ||
		marker.to.kind !== 'account' ||
		marker.to.userId !== pendingAuth.user.id
	) {
		return 'stale' as const;
	}
	const storedOwner = readStoredAccountWorkspace();
	if (storedOwner.status === 'storage-unavailable') {
		return 'storage-unavailable' as const;
	}
	if (
		storedOwner.status !== 'current' ||
		storedOwner.workspace.owner.kind !== 'guest' ||
		storedOwner.workspace.generation !== marker.from.generation
	) {
		return 'stale' as const;
	}

	const canSync = pendingAuth.featureAccess.modules['account.sync'].allowed;
	const didTakeOver =
		!canSync || (await takeOverLocalAccountData().catch(() => false));
	if (!didTakeOver) {
		return 'pending-retry' as const;
	}
	if (
		!checkCurrentAccountWorkspacePendingAuth(pendingAuth) ||
		getCurrentOwner()?.kind !== 'guest' ||
		getCurrentOwner()?.generation !== marker.from.generation
	) {
		return 'stale' as const;
	}
	const committed = await commitAccountWorkspaceOwner({
		expectedMarkerRaw: markerRaw,
		expectedOwnerRaw: storedOwner.raw,
		nextOwner: marker.to,
	});
	if (committed.status !== 'committed') {
		return committed.status;
	}
	const finished = await finishAccountWorkspaceTransition({
		expectedMarkerRaw: committed.markerRaw,
	});
	if (finished.status !== 'committed') {
		return finished.status;
	}

	workspaceStore.markAuthReconciled();
	applyAuthenticatedProjection({
		csrf_token: pendingAuth.csrfToken,
		feature_access: pendingAuth.featureAccess,
		featureEnabled: true,
		has_password: pendingAuth.hasPassword,
		isLoggedIn: true,
		password_must_change: pendingAuth.passwordMustChange,
		state_epoch: pendingAuth.user.state_epoch,
		syncMeta: readAccountSyncMeta(pendingAuth.user.id) ?? {
			lastAppliedRemoteHash: {},
			revisions: {},
			state_epoch: pendingAuth.user.state_epoch,
			sync_generation: pendingAuth.user.sync_generation,
			sync_status: pendingAuth.user.sync_status,
		},
		user: pendingAuth.user,
	});
	void publishAccountRuntimeInvalidation({
		reason: 'login',
		stateEpoch: pendingAuth.user.state_epoch,
		userId: pendingAuth.user.id,
	});
	return 'ready' as const;
}

export async function cancelGuestAdoption() {
	const pendingAuth = readAccountWorkspacePendingAuth();
	const owner = getCurrentOwner();
	if (
		pendingAuth === null ||
		owner?.kind !== 'guest' ||
		owner.generation !== pendingAuth.expectedWorkspaceGeneration ||
		pendingAuth.reason !== 'guest-adoption'
	) {
		workspaceUiStore.adoptionStatus.set('idle');
		return 'stale' as const;
	}

	workspaceUiStore.adoptionStatus.set('submitting');
	const operationResult = await withAccountSyncOperationLease(
		pendingAuth.user.id,
		'workspace-logout',
		async () => {
			const transition = readAccountWorkspaceTransition();
			if (
				transition.status === 'current' &&
				transition.marker.reason === 'guest-adoption'
			) {
				if (transition.marker.phase !== 'prepared') {
					return 'stale' as const;
				}
				const cancelled =
					await cancelPreparedAccountWorkspaceTransition({
						expectedMarkerRaw: transition.raw,
					});
				if (cancelled.status !== 'committed') {
					return 'pending-retry' as const;
				}
			}
			if (
				!checkCurrentAccountWorkspacePendingAuth(pendingAuth) ||
				getCurrentOwner()?.kind !== 'guest' ||
				getCurrentOwner()?.generation !== owner.generation
			) {
				return 'stale' as const;
			}
			if (!releaseAccountWorkspaceMetadata(pendingAuth.user.id)) {
				return 'pending-retry' as const;
			}
			let result;
			try {
				result = await logoutAccount(pendingAuth.csrfToken);
			} catch {
				return 'pending-retry' as const;
			}
			if (
				result.status === 'error' &&
				result.httpStatus !== 401 &&
				!(
					result.httpStatus === 403 &&
					(result.message === 'user-disabled' ||
						result.message === 'user-deleted')
				)
			) {
				return 'pending-retry' as const;
			}
			if (
				!checkCurrentAccountWorkspacePendingAuth(pendingAuth) ||
				getCurrentOwner()?.kind !== 'guest' ||
				getCurrentOwner()?.generation !== owner.generation
			) {
				return 'stale' as const;
			}
			clearAccountWorkspacePendingAuth();
			applyGuestProjection(null);
			setWorkspaceReady(owner);
			void publishAccountRuntimeInvalidation({
				reason: 'logout',
				stateEpoch: pendingAuth.user.state_epoch,
				userId: pendingAuth.user.id,
			});
			return 'guest' as const;
		}
	);

	if (operationResult === 'guest') {
		releaseAccountWorkspaceOperationState(pendingAuth.user.id);
		workspaceUiStore.adoptionStatus.set('idle');
		return 'guest' as const;
	}
	workspaceUiStore.adoptionStatus.set('failed');
	workspaceStore.setError('network');
	return operationResult ?? 'busy';
}

function toRuntimeOwner(
	workspace: ReturnType<typeof readStoredAccountWorkspace>
): TAccountWorkspaceOwner | null {
	if (workspace.status !== 'current') {
		return null;
	}
	return workspace.workspace.owner.kind === 'guest'
		? { generation: workspace.workspace.generation, kind: 'guest' }
		: {
				generation: workspace.workspace.generation,
				kind: 'account',
				userId: workspace.workspace.owner.userId,
			};
}

function checkRuntimeOwnerEqual(
	left: TAccountWorkspaceOwner,
	right: TAccountWorkspaceOwner
) {
	return (
		left.kind === right.kind &&
		left.generation === right.generation &&
		(left.kind === 'guest' ||
			(right.kind === 'account' && left.userId === right.userId))
	);
}

type TExitLeaseOutcome =
	| { kind: 'account-disabled'; sessionUserId: string }
	| { kind: 'guest' }
	| { kind: 'mismatch' }
	| { kind: 'pending' }
	| {
			kind: 'ready';
			result: Extract<
				TAccountWorkspaceAuthOutcome,
				{ kind: 'authenticated' }
			>['result'];
	  }
	| { kind: 'retry'; message: string }
	| { kind: 'stale' }
	| { kind: 'unsupported' };

function mapTransitionFailure(
	status: 'busy' | 'stale' | 'storage-unavailable' | 'unsupported'
): TExitLeaseOutcome {
	if (status === 'storage-unavailable') {
		return { kind: 'pending' };
	}
	if (status === 'unsupported') {
		return { kind: 'unsupported' };
	}
	return { kind: 'stale' };
}

function checkExpectedOwnerCurrent(expected: IAccountWorkspaceSnapshot) {
	if (expected.owner?.kind !== 'account') {
		return false;
	}
	const current = captureAccountWorkspace();
	return (
		current.owner?.kind === 'account' &&
		current.owner.userId === expected.owner.userId &&
		current.owner.generation === expected.owner.generation &&
		current.generation === expected.generation
	);
}

async function cancelPreparedExitTransition(expectedMarkerRaw: string) {
	const cancelled = await cancelPreparedAccountWorkspaceTransition({
		expectedMarkerRaw,
	});
	if (cancelled.status === 'committed') {
		return true;
	}
	workspaceStore.setError('network');
	return false;
}

function createExitRetry(message: string): TExitLeaseOutcome {
	return { kind: 'retry', message };
}

function captureDirtyQueueToken(userId: string) {
	return JSON.stringify({
		entries: readDirtyQueueEntries(userId),
		isolatedNamespaces: [
			...readIsolatedDirtyQueueNamespaces(userId),
		].sort(),
	});
}

async function runPreparedLogoutTransition({
	action,
	allowedDirtyQueueToken,
	authOutcome,
	discardUnsyncedChanges,
	expected,
	mismatchExit,
}: {
	action: 'all' | 'current';
	allowedDirtyQueueToken: string | null;
	authOutcome: Extract<
		TAccountWorkspaceAuthOutcome,
		{ kind: 'anonymous' | 'authenticated' | 'session-expired' }
	>;
	discardUnsyncedChanges: boolean;
	expected: IAccountWorkspaceSnapshot;
	mismatchExit: boolean;
}): Promise<TExitLeaseOutcome> {
	const { owner } = expected;
	if (owner?.kind !== 'account') {
		return { kind: 'stale' };
	}
	const nextOwner: TAccountWorkspaceOwner = {
		generation: owner.generation + 1,
		kind: 'guest',
	};
	const prepared = await prepareAccountWorkspaceTransition({
		expected,
		reason: mismatchExit ? 'account-mismatch-exit' : 'logout',
		to: nextOwner,
	});
	if (prepared.status !== 'prepared') {
		return mapTransitionFailure(prepared.status);
	}
	if (
		(!discardUnsyncedChanges &&
			(readDirtyQueueEntries(owner.userId).length > 0 ||
				readIsolatedDirtyQueueNamespaces(owner.userId).length > 0)) ||
		(discardUnsyncedChanges &&
			captureDirtyQueueToken(owner.userId) !== allowedDirtyQueueToken)
	) {
		await cancelPreparedExitTransition(prepared.handle.markerRaw);
		return createExitRetry('account-sync-pending');
	}

	const completeWithoutApi = async () => {
		const completion = await completePreparedAccountToGuest({
			expectedMarkerRaw: prepared.handle.markerRaw,
			marker: prepared.handle.marker,
			resetData: true,
			writeDeletedTombstone: false,
		});
		switch (completion) {
			case 'guest':
				return { kind: 'guest' as const };
			case 'busy':
			case 'stale':
				return { kind: 'pending' as const };
			case 'storage-unavailable':
			case 'unsupported':
				return mapTransitionFailure(completion);
		}
	};

	if (
		authOutcome.kind === 'anonymous' ||
		authOutcome.kind === 'session-expired'
	) {
		return completeWithoutApi();
	}

	const response = authOutcome.result;
	if (!mismatchExit && response.user.id !== owner.userId) {
		await cancelPreparedExitTransition(prepared.handle.markerRaw);
		return { kind: 'mismatch' };
	}

	let result;
	try {
		result =
			action === 'all'
				? await logoutAllAccount(response.csrf_token)
				: await logoutAccount(response.csrf_token);
	} catch {
		workspaceStore.setError('network');
		return { kind: 'pending' };
	}

	if (result.status === 'ok' || result.httpStatus === 401) {
		return completeWithoutApi();
	}
	if (result.httpStatus === 403 && result.message === 'user-deleted') {
		return completeWithoutApi();
	}

	if (result.httpStatus === 403 && result.message === 'user-disabled') {
		const responseUserId = result.data?.['user_id'];
		if (
			typeof responseUserId === 'string' &&
			responseUserId === owner.userId
		) {
			await cancelPreparedExitTransition(prepared.handle.markerRaw);
			return { kind: 'account-disabled', sessionUserId: responseUserId };
		}
		if (typeof responseUserId === 'string') {
			if (mismatchExit) {
				return completeWithoutApi();
			}
			await cancelPreparedExitTransition(prepared.handle.markerRaw);
			return { kind: 'mismatch' };
		}
		await cancelPreparedExitTransition(prepared.handle.markerRaw);
		return { kind: 'mismatch' };
	}

	await cancelPreparedExitTransition(prepared.handle.markerRaw);
	return createExitRetry(result.message);
}

export async function executeAccountLogoutWorkspace({
	action,
	discardUnsyncedChanges = false,
	expected,
	mismatchExit = false,
}: {
	action: 'all' | 'current';
	discardUnsyncedChanges?: boolean;
	expected: IAccountWorkspaceSnapshot;
	mismatchExit?: boolean;
}): Promise<TAccountWorkspaceExitExecutionResult> {
	const { owner } = expected;
	if (owner?.kind !== 'account') {
		return 'busy';
	}
	const allowedDirtyQueueToken = discardUnsyncedChanges
		? captureDirtyQueueToken(owner.userId)
		: null;
	const leaseResult = await withAccountSyncOperationLease(
		owner.userId,
		'workspace-logout',
		async (): Promise<TExitLeaseOutcome> => {
			if (!checkExpectedOwnerCurrent(expected)) {
				return { kind: 'stale' };
			}
			const authOutcome = await readCurrentAccountWorkspaceAuthOutcome();
			if (authOutcome.kind === 'transient') {
				return createExitRetry(
					Error.isError(authOutcome.error)
						? authOutcome.error.message
						: 'account-session-check-failed'
				);
			}
			if (authOutcome.kind === 'account-disabled') {
				if (authOutcome.sessionUserId === owner.userId) {
					return {
						kind: 'account-disabled',
						sessionUserId: authOutcome.sessionUserId,
					};
				}
				if (mismatchExit) {
					const cleared = await clearDisabledAccountSession().catch(
						() => false
					);
					if (!cleared) {
						return createExitRetry('account-logout-failed');
					}
					return runPreparedLogoutTransition({
						action,
						allowedDirtyQueueToken,
						authOutcome: { kind: 'anonymous' },
						discardUnsyncedChanges,
						expected,
						mismatchExit,
					});
				}
				return { kind: 'mismatch' };
			}
			if (
				authOutcome.kind === 'authenticated' &&
				!mismatchExit &&
				authOutcome.result.user.id !== owner.userId
			) {
				return { kind: 'mismatch' };
			}
			if (
				authOutcome.kind === 'authenticated' &&
				mismatchExit &&
				authOutcome.result.user.id === owner.userId
			) {
				return { kind: 'ready', result: authOutcome.result };
			}
			if (authOutcome.kind === 'password-required') {
				const cleared = await clearDisabledAccountSession().catch(
					() => false
				);
				if (!cleared) {
					return createExitRetry('account-logout-failed');
				}
				return runPreparedLogoutTransition({
					action,
					allowedDirtyQueueToken,
					authOutcome: { kind: 'anonymous' },
					discardUnsyncedChanges,
					expected,
					mismatchExit,
				});
			}
			return runPreparedLogoutTransition({
				action,
				allowedDirtyQueueToken,
				authOutcome,
				discardUnsyncedChanges,
				expected,
				mismatchExit,
			});
		}
	);

	if (leaseResult === null) {
		return 'busy';
	}
	switch (leaseResult.kind) {
		case 'account-disabled': {
			const result = await completeDisabledAccountWorkspace({
				owner,
				sessionUserId: leaseResult.sessionUserId,
			});
			return result === 'guest' ? 'guest' : 'pending-recovery';
		}
		case 'guest':
			releaseAccountWorkspaceOperationState(owner.userId);
			return 'guest';
		case 'mismatch':
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'account-mismatch');
			return 'account-mismatch';
		case 'pending':
			workspaceStore.setError('network');
			return 'pending-recovery';
		case 'ready':
			applyAuthenticatedProjection(leaseResult.result);
			workspaceStore.setBlocker(null);
			setWorkspaceReady(owner);
			return 'ready';
		case 'retry':
			return { message: leaseResult.message, status: 'retry' };
		case 'stale':
			return 'busy';
		case 'unsupported':
			return 'unsupported';
	}
}

export async function executeActiveAccountDeletionWorkspace(
	expected: IAccountWorkspaceSnapshot
): Promise<TAccountWorkspaceExitExecutionResult> {
	const { owner } = expected;
	if (owner?.kind !== 'account') {
		return 'busy';
	}
	const leaseResult = await withAccountSyncOperationLease(
		owner.userId,
		'workspace-delete',
		async (): Promise<TExitLeaseOutcome> => {
			if (!checkExpectedOwnerCurrent(expected)) {
				return { kind: 'stale' };
			}
			const authOutcome = await readCurrentAccountWorkspaceAuthOutcome();
			if (authOutcome.kind === 'transient') {
				return createExitRetry(
					Error.isError(authOutcome.error)
						? authOutcome.error.message
						: 'account-session-check-failed'
				);
			}
			switch (authOutcome.kind) {
				case 'anonymous':
				case 'session-expired':
				case 'password-required':
					return { kind: 'stale' };
			}
			if (authOutcome.kind === 'account-disabled') {
				return authOutcome.sessionUserId === owner.userId
					? {
							kind: 'account-disabled',
							sessionUserId: authOutcome.sessionUserId,
						}
					: { kind: 'mismatch' };
			}
			if (authOutcome.result.user.id !== owner.userId) {
				return { kind: 'mismatch' };
			}

			const nextOwner: TAccountWorkspaceOwner = {
				generation: owner.generation + 1,
				kind: 'guest',
			};
			const prepared = await prepareAccountWorkspaceTransition({
				expected,
				reason: 'active-delete',
				to: nextOwner,
			});
			if (prepared.status !== 'prepared') {
				return mapTransitionFailure(prepared.status);
			}

			let result;
			try {
				result = await deleteAccount(authOutcome.result.csrf_token);
			} catch {
				workspaceStore.setError('network');
				return { kind: 'pending' };
			}

			if (result.status === 'error') {
				if (result.httpStatus === 401) {
					await cancelPreparedExitTransition(
						prepared.handle.markerRaw
					);
					return { kind: 'stale' };
				}
				if (
					result.httpStatus === 403 &&
					result.message === 'user-disabled'
				) {
					const responseUserId = result.data?.['user_id'];
					await cancelPreparedExitTransition(
						prepared.handle.markerRaw
					);
					if (
						typeof responseUserId === 'string' &&
						responseUserId === owner.userId
					) {
						return {
							kind: 'account-disabled',
							sessionUserId: responseUserId,
						};
					}
					return typeof responseUserId === 'string'
						? { kind: 'mismatch' }
						: { kind: 'stale' };
				}
				await cancelPreparedExitTransition(prepared.handle.markerRaw);
				return createExitRetry(result.message);
			}

			const completion = await completePreparedAccountToGuest({
				expectedMarkerRaw: prepared.handle.markerRaw,
				marker: prepared.handle.marker,
				resetData: false,
				writeDeletedTombstone: true,
			});
			return completion === 'guest'
				? { kind: 'guest' }
				: { kind: 'pending' };
		}
	);

	if (leaseResult === null) {
		return 'busy';
	}
	switch (leaseResult.kind) {
		case 'account-disabled': {
			const result = await completeDisabledAccountWorkspace({
				owner,
				sessionUserId: leaseResult.sessionUserId,
			});
			return result === 'guest' ? 'guest' : 'pending-recovery';
		}
		case 'guest':
			releaseAccountWorkspaceOperationState(owner.userId);
			return 'guest';
		case 'mismatch':
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'account-mismatch');
			return 'account-mismatch';
		case 'pending':
			workspaceStore.setError('network');
			return 'pending-recovery';
		case 'ready':
			return 'ready';
		case 'retry':
			return { message: leaseResult.message, status: 'retry' };
		case 'stale':
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'session-expired');
			return 'locked';
		case 'unsupported':
			return 'unsupported';
	}
}

async function completePreparedAccountToGuest({
	expectedMarkerRaw,
	marker,
	resetData,
	writeDeletedTombstone,
}: {
	expectedMarkerRaw: string;
	marker: IStoredAccountWorkspaceTransition;
	resetData: boolean;
	writeDeletedTombstone: boolean;
}) {
	if (marker.to.kind !== 'guest') {
		return 'unsupported' as const;
	}
	const {
		from: markerFrom,
		operationId,
		reason: markerReason,
		to: markerTo,
	} = marker;
	const storedOwner = readStoredAccountWorkspace();
	if (storedOwner.status === 'storage-unavailable') {
		return 'storage-unavailable' as const;
	}
	if (storedOwner.status === 'future' || storedOwner.status === 'invalid') {
		return 'unsupported' as const;
	}
	if (storedOwner.status === 'none') {
		return 'stale' as const;
	}
	if (!('workspace' in storedOwner)) {
		return 'unsupported' as const;
	}
	const { raw: storedOwnerRaw } = storedOwner;
	const storedRuntimeOwner = toRuntimeOwner(storedOwner);
	if (storedRuntimeOwner === null) {
		return 'unsupported' as const;
	}
	if (checkRuntimeOwnerEqual(storedRuntimeOwner, markerTo)) {
		applyGuestProjection(null);
		accountStore.closeAccountModal();
		workspaceStore.setBlocker(null);
		const finished = await finishAccountWorkspaceTransition({
			expectedMarkerRaw,
		});
		if (
			finished.status === 'committed' &&
			markerReason === 'account-disabled'
		) {
			await clearDisabledAccountSession().catch(() => false);
		}
		if (finished.status === 'committed') {
			workspaceStore.markAuthReconciled();
		}
		return finished.status === 'committed'
			? ('guest' as const)
			: finished.status;
	}
	if (
		!checkRuntimeOwnerEqual(storedRuntimeOwner, markerFrom) ||
		markerFrom.kind !== 'account'
	) {
		return 'unsupported' as const;
	}

	const { userId } = markerFrom;
	const stateEpoch = pendingAuthStateEpoch(userId);
	if (writeDeletedTombstone) {
		const tombstone = await withAccountSyncResetGenerationLock(
			userId,
			() =>
				markAccountSyncResetGenerationDeleted({
					operationId,
					stateEpoch,
					userId,
				}),
			{ ifAvailable: false }
		);
		if (tombstone === null) {
			return 'storage-unavailable' as const;
		}
	}
	if (resetData) {
		const resetResult = await resetAccountWorkspaceData({
			expected: {
				generation: markerFrom.generation,
				owner: markerFrom,
				phase: 'transitioning',
			},
			operationId,
		});
		if (resetResult !== 'reset') {
			return resetResult;
		}
	}

	if (!releaseAccountWorkspaceMetadata(userId)) {
		return 'storage-unavailable' as const;
	}
	const committed = await commitAccountWorkspaceOwner({
		expectedMarkerRaw,
		expectedOwnerRaw: storedOwnerRaw,
		nextOwner: markerTo,
	});
	if (committed.status !== 'committed') {
		return committed.status;
	}

	applyGuestProjection(null);
	accountStore.closeAccountModal();
	workspaceStore.setBlocker(null);
	const finished = await finishAccountWorkspaceTransition({
		expectedMarkerRaw: committed.markerRaw,
	});
	if (finished.status !== 'committed') {
		return finished.status;
	}
	workspaceStore.markAuthReconciled();
	void publishAccountRuntimeInvalidation({
		reason:
			markerReason === 'active-delete'
				? 'account-deleted'
				: markerReason === 'account-disabled'
					? 'account-disabled'
					: 'logout',
		stateEpoch,
		userId,
	});
	if (markerReason === 'account-disabled') {
		await clearDisabledAccountSession().catch(() => false);
	}
	return 'guest' as const;
}

async function completePreparedExitWithLease({
	marker,
	markerRaw,
	owner,
	resetData,
	writeDeletedTombstone,
}: {
	marker: IStoredAccountWorkspaceTransition;
	markerRaw: string;
	owner: Extract<TAccountWorkspaceOwner, { kind: 'account' }>;
	resetData: boolean;
	writeDeletedTombstone: boolean;
}) {
	const completion = await withAccountSyncOperationLease(
		owner.userId,
		marker.reason === 'active-delete'
			? 'workspace-delete'
			: 'workspace-logout',
		async () => {
			const currentTransition = readAccountWorkspaceTransition();
			if (
				currentTransition.status !== 'current' ||
				currentTransition.raw !== markerRaw
			) {
				return 'stale' as const;
			}
			return completePreparedAccountToGuest({
				expectedMarkerRaw: markerRaw,
				marker,
				resetData,
				writeDeletedTombstone,
			});
		}
	);
	if (completion === 'guest') {
		releaseAccountWorkspaceOperationState(owner.userId);
		return 'guest' as const;
	}
	return completion ?? 'busy';
}

function pendingAuthStateEpoch(userId: string) {
	const pending = readAccountWorkspacePendingAuth();
	if (pending?.user.id === userId) {
		return pending.user.state_epoch;
	}
	const user = accountStore.shared.user.get();
	if (user?.id === userId) {
		return user.state_epoch;
	}
	return readAccountSyncMeta(userId)?.state_epoch ?? 0;
}

export async function completeExpiredSessionLogout(
	expected: IAccountWorkspaceSnapshot
) {
	return executeAccountLogoutWorkspace({
		action: 'current',
		discardUnsyncedChanges: true,
		expected,
	});
}

export async function completeAccountMismatchExit(
	expected: IAccountWorkspaceSnapshot
) {
	return executeAccountLogoutWorkspace({
		action: 'current',
		discardUnsyncedChanges: true,
		expected,
		mismatchExit: true,
	});
}

export async function completeActiveAccountDeletion(
	expected: IAccountWorkspaceSnapshot
) {
	return executeActiveAccountDeletionWorkspace(expected);
}

export async function completeAccountAuthenticationSuccess(
	data: IAuthLoginSuccessResponse,
	options: {
		expectedCsrfToken?: string | null;
		expectedUserId?: string | null;
	} = {}
) {
	const owner = getCurrentOwner();
	if (owner === null) {
		return 'stale' as const;
	}
	if (owner.kind === 'account' && owner.userId !== data.user.id) {
		setAccountWorkspacePendingAuth({
			authOperationId: createAccountClientId(),
			csrfToken: data.csrf_token,
			expectedWorkspaceGeneration: owner.generation,
			featureAccess: data.feature_access,
			hasPassword: data.has_password,
			passwordMustChange: data.password_must_change,
			reason: 'account-mismatch',
			user: data.user,
		});
		applyLockedProjection();
		setWorkspaceBlocked(owner, 'account-mismatch');
		void publishAccountRuntimeInvalidation({
			reason: 'login',
			stateEpoch: data.user.state_epoch,
			userId: data.user.id,
		});
		return 'account-mismatch' as const;
	}
	if (owner.kind === 'account') {
		if (data.password_must_change) {
			applyLockedProjection();
			setAccountWorkspacePendingAuth({
				authOperationId: createAccountClientId(),
				csrfToken: data.csrf_token,
				expectedWorkspaceGeneration: owner.generation,
				featureAccess: data.feature_access,
				hasPassword: data.has_password,
				passwordMustChange: true,
				reason: 'password-required',
				user: data.user,
			});
			setWorkspaceBlocked(owner, 'session-expired', 'password-required');
			return 'password-required' as const;
		}
		const pendingAuth = readAccountWorkspacePendingAuth();
		if (
			pendingAuth?.reason === 'password-required' &&
			pendingAuth.user.id === data.user.id &&
			pendingAuth.expectedWorkspaceGeneration === owner.generation
		) {
			applyAccountAuthSuccessResponse(data);
			clearAccountWorkspacePendingAuth();
			workspaceStore.setBlocker(null);
			setWorkspaceReady(owner);
			return 'ready' as const;
		}
		if (!applyAccountAuthSuccessResponse(data, options)) {
			return 'stale' as const;
		}
		clearAccountWorkspacePendingAuth();
		workspaceStore.setBlocker(null);
		setWorkspaceReady(owner);
		return 'ready' as const;
	}

	setAccountWorkspacePendingAuth({
		authOperationId: createAccountClientId(),
		csrfToken: data.csrf_token,
		expectedWorkspaceGeneration: owner.generation,
		featureAccess: data.feature_access,
		hasPassword: data.has_password,
		passwordMustChange: data.password_must_change,
		reason: data.password_must_change
			? 'password-required'
			: 'guest-adoption',
		user: data.user,
	});
	workspaceStore.setSnapshot({
		isReady: false,
		snapshot: {
			generation: owner.generation,
			owner,
			phase: data.password_must_change
				? 'password-required'
				: 'transitioning',
		},
	});
	if (data.password_must_change) {
		return 'password-required' as const;
	}

	const adoption = await completeGuestAdoption();
	return adoption === 'ready'
		? ('ready' as const)
		: ('adoption-required' as const);
}

export async function cancelPasswordRequiredLogin() {
	const pending = readAccountWorkspacePendingAuth();
	const owner = getCurrentOwner();
	if (pending?.reason !== 'password-required' || owner === null) {
		return 'stale' as const;
	}
	if (pending.expectedWorkspaceGeneration !== owner.generation) {
		return 'stale' as const;
	}
	const result = await withAccountSyncOperationLease(
		pending.user.id,
		'workspace-logout',
		async () => {
			if (
				!checkCurrentAccountWorkspacePendingAuth(pending) ||
				getCurrentOwner()?.generation !== owner.generation
			) {
				return 'stale' as const;
			}
			let logoutResult;
			try {
				logoutResult = await logoutAccount(pending.csrfToken);
			} catch {
				return 'pending-retry' as const;
			}
			if (
				logoutResult.status === 'error' &&
				logoutResult.httpStatus !== 401 &&
				!(
					logoutResult.httpStatus === 403 &&
					(logoutResult.message === 'user-disabled' ||
						logoutResult.message === 'user-deleted')
				)
			) {
				return 'pending-retry' as const;
			}

			clearAccountWorkspacePendingAuth();
			void publishAccountRuntimeInvalidation({
				reason: 'logout',
				stateEpoch: pending.user.state_epoch,
				userId: pending.user.id,
			});
			if (owner.kind === 'guest') {
				applyGuestProjection(null);
				setWorkspaceReady(owner);
				return 'guest' as const;
			}

			applyLockedProjection();
			setWorkspaceBlocked(owner, 'session-expired');
			return 'locked' as const;
		}
	);
	if (result === null) {
		return 'busy';
	}
	if (result === 'guest') {
		releaseAccountWorkspaceOperationState(pending.user.id);
	}
	return result;
}

async function reconcilePendingAccountWorkspaceTransition(
	authOutcome: TAccountWorkspaceAuthOutcome
): Promise<TAccountWorkspaceReconcileResult | null> {
	const transitionBeforeRecovery = readAccountWorkspaceTransition();
	if (transitionBeforeRecovery.status === 'none') {
		return null;
	}
	const recovery = await recoverAccountWorkspaceTransition();
	if (recovery.status === 'committed') {
		return null;
	}
	if (recovery.status === 'storage-unavailable') {
		workspaceStore.setError('network');
		return 'pending-retry';
	}
	if (recovery.status === 'unsupported') {
		return 'unsupported';
	}
	if (recovery.status !== 'busy') {
		return 'pending-retry';
	}
	if (transitionBeforeRecovery.status !== 'current') {
		return 'pending-retry';
	}

	const owner = getCurrentOwner();
	const { marker } = transitionBeforeRecovery;
	if (
		owner?.kind === 'account' &&
		checkAccountSyncOperationActive(owner.userId)
	) {
		return 'pending-retry';
	}

	if (authOutcome.kind === 'transient') {
		workspaceStore.setError('network');
		return 'pending-retry';
	}
	if (authOutcome.kind === 'account-disabled') {
		if (
			owner?.kind === 'account' &&
			authOutcome.sessionUserId === owner.userId
		) {
			if (marker.reason !== 'account-disabled') {
				await cancelPreparedExitTransition(
					transitionBeforeRecovery.raw
				);
			}
			const result = await completeDisabledAccountWorkspace({
				owner,
				sessionUserId: authOutcome.sessionUserId,
			});
			return result === 'guest' ? 'guest' : 'pending-retry';
		}
		if (owner?.kind === 'account') {
			if (marker.reason === 'account-mismatch-exit') {
				const cleared = await clearDisabledAccountSession().catch(
					() => false
				);
				if (cleared) {
					const completion = await completePreparedExitWithLease({
						marker,
						markerRaw: transitionBeforeRecovery.raw,
						owner,
						resetData: true,
						writeDeletedTombstone: false,
					});
					if (completion === 'guest') {
						return 'guest';
					}
				}
				workspaceStore.setError('network');
				return 'pending-retry';
			}
			await cancelPreparedExitTransition(transitionBeforeRecovery.raw);
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'account-mismatch');
			return 'locked';
		}
		return 'pending-retry';
	}

	if (authOutcome.kind === 'password-required') {
		await cancelPreparedExitTransition(transitionBeforeRecovery.raw);
		if (owner?.kind === 'account') {
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'session-expired', 'password-required');
			return 'password-required';
		}
		applyGuestProjection(null);
		setWorkspaceReady(owner ?? { generation: 1, kind: 'guest' });
		return 'guest';
	}

	if (authOutcome.kind === 'authenticated') {
		if (
			owner?.kind === 'account' &&
			authOutcome.result.user.id === owner.userId &&
			marker.reason === 'guest-adoption'
		) {
			return 'pending-retry';
		}
		if (
			owner?.kind === 'guest' &&
			marker.reason === 'guest-adoption' &&
			marker.to.kind === 'account' &&
			authOutcome.result.user.id === marker.to.userId
		) {
			const pending = readAccountWorkspacePendingAuth();
			if (
				pending?.reason !== 'guest-adoption' ||
				pending.user.id !== authOutcome.result.user.id ||
				pending.expectedWorkspaceGeneration !== owner.generation
			) {
				setAccountWorkspacePendingAuth({
					authOperationId: createAccountClientId(),
					csrfToken: authOutcome.result.csrf_token,
					expectedWorkspaceGeneration: owner.generation,
					featureAccess: authOutcome.result.feature_access,
					hasPassword: authOutcome.result.has_password,
					passwordMustChange: false,
					reason: 'guest-adoption',
					user: authOutcome.result.user,
				});
			}
			const currentPending = readAccountWorkspacePendingAuth();
			if (currentPending === null) {
				return 'pending-retry';
			}
			const adoption = await withAccountSyncOperationLease(
				currentPending.user.id,
				'guest-adoption',
				async () => {
					const currentTransition = readAccountWorkspaceTransition();
					if (
						currentTransition.status !== 'current' ||
						currentTransition.raw !== transitionBeforeRecovery.raw
					) {
						return 'stale' as const;
					}
					return completePreparedGuestAdoption({
						marker: currentTransition.marker,
						markerRaw: currentTransition.raw,
						pendingAuth: currentPending,
					});
				}
			);
			if (adoption === 'ready') {
				releaseAccountWorkspaceOperationState(currentPending.user.id);
			}
			return adoption === 'ready' ? 'ready' : 'pending-retry';
		}

		if (
			owner?.kind === 'account' &&
			marker.reason === 'account-mismatch-exit' &&
			authOutcome.result.user.id !== owner.userId
		) {
			const recovered = await withAccountSyncOperationLease(
				owner.userId,
				'workspace-logout',
				async (): Promise<'guest' | 'locked' | 'pending'> => {
					const currentTransition = readAccountWorkspaceTransition();
					if (
						currentTransition.status !== 'current' ||
						currentTransition.raw !== transitionBeforeRecovery.raw
					) {
						return 'pending';
					}
					let logoutResult;
					try {
						logoutResult = await logoutAccount(
							authOutcome.result.csrf_token
						);
					} catch {
						return 'pending';
					}
					if (
						logoutResult.status === 'ok' ||
						logoutResult.httpStatus === 401 ||
						(logoutResult.httpStatus === 403 &&
							logoutResult.message === 'user-disabled')
					) {
						const completion = await completePreparedAccountToGuest(
							{
								expectedMarkerRaw: transitionBeforeRecovery.raw,
								marker,
								resetData: true,
								writeDeletedTombstone: false,
							}
						);
						return completion === 'guest' ? 'guest' : 'pending';
					}
					await cancelPreparedExitTransition(
						transitionBeforeRecovery.raw
					);
					return 'locked';
				}
			);
			if (recovered === null || recovered === 'pending') {
				workspaceStore.setError('network');
				return 'pending-retry';
			}
			if (recovered === 'guest') {
				releaseAccountWorkspaceOperationState(owner.userId);
				return 'guest';
			}
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'account-mismatch');
			return 'locked';
		}

		const cancelled = await cancelPreparedExitTransition(
			transitionBeforeRecovery.raw
		);
		if (!cancelled) {
			return 'pending-retry';
		}
		const restoredOwner = getCurrentOwner();
		return restoredOwner === null
			? 'pending-retry'
			: reconcileKnownOwner(authOutcome, restoredOwner);
	}

	if (owner?.kind === 'guest') {
		await cancelPreparedExitTransition(transitionBeforeRecovery.raw);
		applyGuestProjection(null);
		setWorkspaceReady(owner);
		return 'guest';
	}
	if (owner?.kind !== 'account') {
		return 'pending-retry';
	}

	if (marker.reason === 'guest-adoption') {
		await cancelPreparedExitTransition(transitionBeforeRecovery.raw);
		applyGuestProjection(null);
		setWorkspaceReady(owner);
		return 'guest';
	}

	const completion = await completePreparedExitWithLease({
		marker,
		markerRaw: transitionBeforeRecovery.raw,
		owner,
		resetData:
			marker.reason === 'logout' ||
			marker.reason === 'account-mismatch-exit',
		writeDeletedTombstone: marker.reason === 'active-delete',
	});
	if (completion === 'guest') {
		return 'guest';
	}
	return completion === 'unsupported' ? 'unsupported' : 'pending-retry';
}

async function reconcileKnownOwner(
	authOutcome: TAccountWorkspaceAuthOutcome,
	owner: TAccountWorkspaceOwner
): Promise<TAccountWorkspaceReconcileResult> {
	if (authOutcome.kind === 'transient') {
		if (owner.kind === 'guest') {
			applyGuestProjection(null);
		} else if (accountStore.shared.user.get() === null) {
			accountStore.shared.bootstrapStatus.set('error');
			accountStore.shared.isBootstrapped.set(true);
			accountStore.shared.sync.lastError.set(
				Error.isError(authOutcome.error)
					? authOutcome.error.message
					: 'account-session-check-failed'
			);
		}
		setWorkspaceReady(owner);
		return 'ready';
	}
	if (authOutcome.kind === 'session-expired') {
		if (owner.kind === 'account') {
			const wasSessionLocked =
				workspaceStore.blocker.get() === 'session-expired' &&
				workspaceStore.phase.get() === 'locked';
			const stateEpoch =
				accountStore.shared.user.get()?.state_epoch ??
				readAccountSyncMeta(owner.userId)?.state_epoch ??
				0;
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'session-expired');
			if (!wasSessionLocked) {
				void publishAccountRuntimeInvalidation({
					reason: 'session-expired',
					stateEpoch,
					userId: owner.userId,
				});
			}
			return 'locked';
		}
		setWorkspaceReady(owner);
		return 'guest';
	}
	if (authOutcome.kind === 'account-disabled') {
		if (
			owner.kind === 'account' &&
			owner.userId === authOutcome.sessionUserId
		) {
			return completeDisabledAccountWorkspace({
				owner,
				sessionUserId: authOutcome.sessionUserId,
			});
		}
		if (owner.kind === 'account') {
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'account-mismatch');
			return 'locked';
		}
		applyGuestProjection(null);
		setWorkspaceReady(owner);
		await clearDisabledAccountSession().catch(() => false);
		return 'guest';
	}
	if (authOutcome.kind === 'password-required') {
		if (owner.kind === 'account') {
			setWorkspaceBlocked(owner, 'session-expired', 'password-required');
			return 'password-required';
		}
		setWorkspaceReady(owner);
		return 'guest';
	}
	if (authOutcome.kind === 'anonymous') {
		if (owner.kind === 'account') {
			applyLockedProjection();
			setWorkspaceBlocked(owner, 'session-expired');
			return 'locked';
		}
		applyGuestProjection(null);
		setWorkspaceReady(owner);
		return 'guest';
	}

	const { user } = authOutcome.result;
	if (owner.kind === 'guest') {
		createPendingGuestAuth(
			authOutcome.result,
			owner,
			authOutcome.result.password_must_change
				? 'password-required'
				: 'guest-adoption'
		);
		return authOutcome.result.password_must_change
			? 'password-required'
			: 'adoption-required';
	}
	if (!checkWorkspaceAccount(owner, user.id)) {
		createPendingMismatchAuth(authOutcome.result, owner);
		applyLockedProjection();
		setWorkspaceBlocked(owner, 'account-mismatch');
		return 'locked';
	}

	applyAuthenticatedProjection(authOutcome.result);
	if (authOutcome.result.password_must_change) {
		workspaceStore.setSnapshot({
			isReady: false,
			snapshot: {
				generation: owner.generation,
				owner,
				phase: 'password-required',
			},
		});
		return 'password-required';
	}
	setWorkspaceReady(owner);
	return 'ready';
}

export async function reconcileAccountWorkspace(input: {
	authOutcome: TAccountWorkspaceAuthOutcome;
	source: 'initial-data' | 'me-refresh' | 'runtime-invalidation';
}): Promise<TAccountWorkspaceReconcileResult> {
	restoreWorkspaceRuntimeFromStorage();
	const transition = readAccountWorkspaceTransition();
	if (transition.status === 'storage-unavailable') {
		workspaceStore.setError('network');
		return 'pending-retry';
	}
	if (transition.status === 'future' || transition.status === 'invalid') {
		workspaceStore.setError(
			transition.status === 'future' ? 'future' : 'invalid'
		);
		return 'unsupported';
	}
	if (transition.status === 'current') {
		const recovered = await reconcilePendingAccountWorkspaceTransition(
			input.authOutcome
		);
		if (recovered !== null) {
			return recovered;
		}
	}

	let owner = getCurrentOwner();
	if (owner === null) {
		switch (input.authOutcome.kind) {
			case 'transient':
			case 'password-required':
			case 'session-expired':
				workspaceStore.setError('network');
				return 'pending-retry';
		}
		const migration = await migrateUnownedWorkspace({
			auth: input.authOutcome,
			mode: 'account-enabled',
		});
		if (migration === 'pending-retry' || migration === 'unsupported') {
			return migration === 'unsupported'
				? 'unsupported'
				: 'pending-retry';
		}
		owner = getCurrentOwner();
	}
	if (owner === null) {
		return 'unsupported';
	}

	return reconcileKnownOwner(input.authOutcome, owner);
}

export async function initializeAccountWorkspaceFromInitialData(
	data: TAccountMeResponse | null
) {
	if (data === null) {
		restoreWorkspaceRuntimeFromStorage();
		const owner = getCurrentOwner();
		if (owner === null) {
			workspaceStore.setError('network');
			return 'pending-retry' as const;
		}
		workspaceStore.setError('network');
		return owner.kind === 'account' ? 'ready' : 'guest';
	}

	const result = await reconcileAccountWorkspace({
		authOutcome: classifyAccountWorkspaceAuthOutcome({
			response: data,
			source: 'initial-data',
		}),
		source: 'initial-data',
	});
	if (result === 'adoption-required') {
		const adoption = await completeGuestAdoption();
		return adoption === 'ready' ? 'ready' : 'adoption-required';
	}

	return result;
}

export async function retryAccountWorkspaceLifecycle() {
	workspaceStore.setError(null);
	const { bootstrapAccount } =
		await import('@/features/account/client/bootstrap');
	await bootstrapAccount();
}
