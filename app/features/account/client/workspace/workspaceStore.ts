import { store } from '@davstack/store';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import {
	type IAccountWorkspaceRuntimeState,
	type IAccountWorkspaceSnapshot,
	type TAccountWorkspaceBlocker,
	type TAccountWorkspaceOwner,
	type TAccountWorkspacePhase,
	type TAccountWorkspaceReadinessError,
	type TAccountWorkspaceTransitionStatus,
	type TInitialAccountWorkspaceAuth,
} from './contracts';

const initialRuntimeState: IAccountWorkspaceRuntimeState = {
	blocker: null,
	error: null,
	isAuthReconciled: false,
	isInitialized: false,
	isReady: false,
	owner: null,
	phase: 'resolving',
	transitionStatus: 'none',
};

export const workspaceStore = store(initialRuntimeState).actions(
	(currentStore) => ({
		markAuthReconciled() {
			currentStore.isAuthReconciled.set(true);
		},
		resetToResolving() {
			currentStore.set(initialRuntimeState);
		},
		setBlocker(blocker: TAccountWorkspaceBlocker) {
			currentStore.blocker.set(blocker);
		},
		setError(error: TAccountWorkspaceReadinessError) {
			currentStore.error.set(error);
		},
		setOwner(owner: TAccountWorkspaceOwner | null) {
			currentStore.owner.set(owner);
		},
		setPhase(phase: TAccountWorkspacePhase) {
			currentStore.phase.set(phase);
			if (phase !== 'ready') {
				currentStore.isReady.set(false);
			}
		},
		setSnapshot({
			isReady,
			snapshot,
			transitionStatus = 'none',
		}: {
			isReady: boolean;
			snapshot: IAccountWorkspaceSnapshot;
			transitionStatus?: TAccountWorkspaceTransitionStatus;
		}) {
			currentStore.set({
				blocker: isReady ? null : currentStore.blocker.get(),
				error: null,
				isAuthReconciled: currentStore.isAuthReconciled.get(),
				isInitialized: true,
				isReady,
				owner: snapshot.owner,
				phase: snapshot.phase,
				transitionStatus,
			});
		},
		setTransitionStatus(status: TAccountWorkspaceTransitionStatus) {
			currentStore.transitionStatus.set(status);
			if (status !== 'none') {
				currentStore.isReady.set(false);
				currentStore.phase.set('transitioning');
			}
		},
	})
);

export function captureAccountWorkspace(): IAccountWorkspaceSnapshot {
	const owner = workspaceStore.owner.get();
	const phase = workspaceStore.phase.get();
	const generation = owner?.generation ?? 0;

	return { generation, owner, phase };
}

export function checkCurrentAccountWorkspace(
	snapshot: IAccountWorkspaceSnapshot
) {
	const current = captureAccountWorkspace();
	if (
		current.phase !== snapshot.phase ||
		current.owner === null ||
		snapshot.owner === null
	) {
		return (
			current.owner === snapshot.owner && current.phase === snapshot.phase
		);
	}

	return (
		current.generation === snapshot.generation &&
		current.owner.kind === snapshot.owner.kind &&
		current.owner.generation === snapshot.owner.generation &&
		(current.owner.kind === 'guest' ||
			(snapshot.owner.kind === 'account' &&
				current.owner.userId === snapshot.owner.userId))
	);
}

export function checkWorkspaceAccount(
	owner: TAccountWorkspaceOwner | null,
	userId: string
): owner is Extract<TAccountWorkspaceOwner, { kind: 'account' }> {
	return (
		owner?.kind === 'account' &&
		owner.userId === userId &&
		isNonNegativeSafeInteger(owner.generation)
	);
}

export function getNextAccountWorkspaceGeneration(generation: number) {
	return isNonNegativeSafeInteger(generation) &&
		generation < Number.MAX_SAFE_INTEGER - 1
		? generation + 1
		: null;
}

export function checkInitialWorkspaceAuthCompatible(
	owner: TAccountWorkspaceOwner | null,
	initialAuth: TInitialAccountWorkspaceAuth
) {
	if (initialAuth.kind === 'unknown') {
		return owner !== null;
	}
	if (initialAuth.kind === 'anonymous') {
		return owner?.kind === 'guest';
	}
	return owner?.kind === 'account' && owner.userId === initialAuth.userId;
}
