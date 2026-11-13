import { createAccountClientId } from '@/features/account/client/clientId';
import {
	readAccountStorage,
	removeAccountStorage,
	writeAccountStorage,
} from '@/features/account/client/storage';

import { withCrossTabLock } from '@/infrastructure/browser/crossTab/withCrossTabLock';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import {
	type IAccountWorkspaceSnapshot,
	type IStoredAccountWorkspaceTransition,
	type TAccountWorkspaceOwner,
	type TAccountWorkspaceTransitionMutationResult,
	type TAccountWorkspaceTransitionRead,
	type TAccountWorkspaceTransitionResult,
	type TPrepareAccountWorkspaceTransitionResult,
} from './contracts';
import {
	checkAccountWorkspaceUserId,
	createAccountWorkspaceTransitionKey,
	readStoredAccountWorkspace,
	writeStoredAccountWorkspaceIfCurrent,
} from './ownerStorage';
import {
	getNextAccountWorkspaceGeneration,
	workspaceStore,
} from './workspaceStore';

export const ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME =
	'account-workspace-lifecycle';

const ACCOUNT_WORKSPACE_TRANSITION_REASON_SET = new Set<
	IStoredAccountWorkspaceTransition['reason']
>([
	'account-disabled',
	'account-mismatch-exit',
	'active-delete',
	'guest-adoption',
	'logout',
]);
const ACCOUNT_WORKSPACE_TRANSITION_PHASE_SET = new Set<
	IStoredAccountWorkspaceTransition['phase']
>(['owner-committed', 'prepared']);
const ACCOUNT_WORKSPACE_OPERATION_ID_MAX_LENGTH = 256;

function parseRuntimeOwner(value: unknown): TAccountWorkspaceOwner | null {
	if (
		!checkIsRecord(value) ||
		!isNonNegativeSafeInteger(value['generation'])
	) {
		return null;
	}

	const { generation } = value;
	if (generation >= Number.MAX_SAFE_INTEGER) {
		return null;
	}
	if (value['kind'] === 'guest') {
		return { generation, kind: 'guest' };
	}
	if (
		value['kind'] === 'account' &&
		checkAccountWorkspaceUserId(value['userId'])
	) {
		return { generation, kind: 'account', userId: value['userId'] };
	}

	return null;
}

function checkTransitionReasonOwnerCombination(
	reason: IStoredAccountWorkspaceTransition['reason'],
	from: TAccountWorkspaceOwner,
	to: TAccountWorkspaceOwner
) {
	if (reason === 'guest-adoption') {
		return from.kind === 'guest' && to.kind === 'account';
	}

	return from.kind === 'account' && to.kind === 'guest';
}

function parseAccountWorkspaceTransition(
	value: unknown
):
	| { marker: IStoredAccountWorkspaceTransition; status: 'current' }
	| { status: 'future' | 'invalid' } {
	if (!checkIsRecord(value)) {
		return { status: 'invalid' };
	}
	if (typeof value['version'] === 'number' && value['version'] > 1) {
		return { status: 'future' };
	}

	const {
		createdAt,
		from: storedFrom,
		nextGeneration,
		operationId,
		phase,
		reason,
		to: storedTo,
		version,
	} = value;
	const from = parseRuntimeOwner(storedFrom);
	const to = parseRuntimeOwner(storedTo);
	if (
		version !== 1 ||
		from === null ||
		to === null ||
		!isNonNegativeSafeInteger(createdAt) ||
		!isNonNegativeSafeInteger(nextGeneration) ||
		typeof operationId !== 'string' ||
		operationId.length === 0 ||
		operationId.length > ACCOUNT_WORKSPACE_OPERATION_ID_MAX_LENGTH ||
		!ACCOUNT_WORKSPACE_TRANSITION_PHASE_SET.has(
			phase as IStoredAccountWorkspaceTransition['phase']
		) ||
		!ACCOUNT_WORKSPACE_TRANSITION_REASON_SET.has(
			reason as IStoredAccountWorkspaceTransition['reason']
		)
	) {
		return { status: 'invalid' };
	}

	const expectedNextGeneration = getNextAccountWorkspaceGeneration(
		from.generation
	);
	if (
		expectedNextGeneration === null ||
		to.generation !== nextGeneration ||
		nextGeneration !== expectedNextGeneration ||
		!checkTransitionReasonOwnerCombination(
			reason as IStoredAccountWorkspaceTransition['reason'],
			from,
			to
		)
	) {
		return { status: 'invalid' };
	}

	return {
		marker: {
			createdAt,
			from,
			nextGeneration,
			operationId,
			phase: phase as IStoredAccountWorkspaceTransition['phase'],
			reason: reason as IStoredAccountWorkspaceTransition['reason'],
			to,
			version: 1,
		},
		status: 'current',
	};
}

function readAccountWorkspaceTransitionRaw() {
	try {
		return {
			status: 'ok' as const,
			value: readAccountStorage(createAccountWorkspaceTransitionKey()),
		};
	} catch {
		return { status: 'storage-unavailable' as const };
	}
}

export function readAccountWorkspaceTransition(): TAccountWorkspaceTransitionRead {
	const result = readAccountWorkspaceTransitionRaw();
	if (result.status === 'storage-unavailable') {
		return { status: 'storage-unavailable' };
	}
	const raw = result.value;
	if (raw === null) {
		return { status: 'none' };
	}

	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return { raw, status: 'invalid' };
	}

	const parsed = parseAccountWorkspaceTransition(value);
	if (parsed.status !== 'current') {
		return { raw, status: parsed.status };
	}

	return { marker: parsed.marker, raw, status: 'current' };
}

function checkOwnerEqual(
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

function writeAccountWorkspaceTransition(
	marker: IStoredAccountWorkspaceTransition
) {
	const raw = JSON.stringify(marker);
	try {
		writeAccountStorage(createAccountWorkspaceTransitionKey(), raw);
	} catch {
		return null;
	}
	const current = readAccountWorkspaceTransitionRaw();
	return current.status === 'ok' && current.value === raw ? raw : null;
}

function removeAccountWorkspaceTransitionIfCurrent(expectedRaw: string) {
	const current = readAccountWorkspaceTransitionRaw();
	if (current.status !== 'ok' || current.value !== expectedRaw) {
		return false;
	}
	try {
		removeAccountStorage(createAccountWorkspaceTransitionKey());
	} catch {
		return false;
	}
	const next = readAccountWorkspaceTransitionRaw();
	return next.status === 'ok' && next.value === null;
}

function checkOwnerMatchesStoredWorkspace(
	snapshot: IAccountWorkspaceSnapshot,
	storedWorkspace: {
		owner: { kind: 'guest' } | { kind: 'account'; userId: string };
	}
) {
	if (snapshot.owner === null) {
		return false;
	}
	if (snapshot.owner.kind === 'guest') {
		return storedWorkspace.owner.kind === 'guest';
	}
	return (
		storedWorkspace.owner.kind === 'account' &&
		storedWorkspace.owner.userId === snapshot.owner.userId
	);
}

function setRuntimeTransition(
	status: 'future' | 'invalid' | 'none' | 'owner-committed' | 'prepared',
	owner: TAccountWorkspaceOwner | null
) {
	const current = workspaceStore.get();
	const isSameOwner =
		current.owner !== null &&
		owner !== null &&
		checkOwnerEqual(current.owner, owner);
	workspaceStore.set({
		...current,
		error:
			status === 'future'
				? 'future'
				: status === 'invalid'
					? 'invalid'
					: null,
		isAuthReconciled: isSameOwner && current.isAuthReconciled,
		isInitialized: true,
		isReady: status === 'none',
		owner,
		phase: status === 'none' ? 'ready' : 'transitioning',
		transitionStatus: status,
	});
}

export function restoreWorkspaceRuntimeFromStorage() {
	const owner = readStoredAccountWorkspace();
	const transition = readAccountWorkspaceTransition();
	if (owner.status === 'storage-unavailable') {
		workspaceStore.resetToResolving();
		return owner;
	}
	if (owner.status !== 'current') {
		workspaceStore.set({
			blocker: null,
			error:
				owner.status === 'future'
					? 'future'
					: owner.status === 'invalid'
						? 'invalid'
						: null,
			isAuthReconciled: false,
			isInitialized: true,
			isReady: false,
			owner: null,
			phase: owner.status === 'none' ? 'resolving' : 'transitioning',
			transitionStatus:
				owner.status === 'none'
					? 'none'
					: owner.status === 'future'
						? 'future'
						: 'invalid',
		});
		return owner;
	}

	const runtimeOwner: TAccountWorkspaceOwner =
		owner.workspace.owner.kind === 'guest'
			? { generation: owner.workspace.generation, kind: 'guest' }
			: {
					generation: owner.workspace.generation,
					kind: 'account',
					userId: owner.workspace.owner.userId,
				};
	switch (transition.status) {
		case 'current':
			setRuntimeTransition(transition.marker.phase, runtimeOwner);

			break;

		case 'future':
		case 'invalid':
			setRuntimeTransition(transition.status, runtimeOwner);

			break;

		case 'storage-unavailable':
			workspaceStore.resetToResolving();

			break;

		default:
			setRuntimeTransition('none', runtimeOwner);
	}

	return owner;
}

export async function prepareAccountWorkspaceTransition(input: {
	expected: IAccountWorkspaceSnapshot;
	reason: IStoredAccountWorkspaceTransition['reason'];
	to: TAccountWorkspaceOwner;
}): Promise<TPrepareAccountWorkspaceTransitionResult> {
	return ((await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			const owner = readStoredAccountWorkspace();
			const currentTransition = readAccountWorkspaceTransition();
			if (
				owner.status === 'storage-unavailable' ||
				currentTransition.status === 'storage-unavailable'
			) {
				return { status: 'storage-unavailable' as const };
			}
			if (
				owner.status === 'future' ||
				currentTransition.status === 'future'
			) {
				return { status: 'unsupported' as const };
			}
			if (
				owner.status === 'invalid' ||
				currentTransition.status === 'invalid'
			) {
				return { status: 'unsupported' as const };
			}
			if (currentTransition.status === 'current') {
				return { status: 'busy' as const };
			}
			if (
				owner.status !== 'current' ||
				owner.workspace.generation !==
					input.expected.owner?.generation ||
				!checkOwnerMatchesStoredWorkspace(
					input.expected,
					owner.workspace
				)
			) {
				return { status: 'stale' as const };
			}
			const nextGeneration = getNextAccountWorkspaceGeneration(
				input.expected.owner.generation
			);
			if (
				nextGeneration === null ||
				input.to.generation !== nextGeneration ||
				!checkTransitionReasonOwnerCombination(
					input.reason,
					input.expected.owner,
					input.to
				)
			) {
				return { status: 'unsupported' as const };
			}

			const marker = {
				createdAt: Date.now(),
				from: input.expected.owner,
				nextGeneration,
				operationId: createAccountClientId(),
				phase: 'prepared',
				reason: input.reason,
				to: input.to,
				version: 1,
			} satisfies IStoredAccountWorkspaceTransition;
			const markerRaw = writeAccountWorkspaceTransition(marker);
			if (markerRaw === null) {
				return { status: 'storage-unavailable' as const };
			}
			setRuntimeTransition('prepared', input.expected.owner);

			return {
				handle: { marker, markerRaw, ownerRaw: owner.raw },
				status: 'prepared' as const,
			};
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: false }
	)) ?? {
		status: 'busy',
	}) satisfies TPrepareAccountWorkspaceTransitionResult;
}

export async function commitAccountWorkspaceOwner(input: {
	expectedMarkerRaw: string;
	expectedOwnerRaw: string | null;
	nextOwner: TAccountWorkspaceOwner;
}): Promise<TAccountWorkspaceTransitionMutationResult> {
	return ((await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			const transition = readAccountWorkspaceTransition();
			if (transition.status === 'storage-unavailable') {
				return { status: 'storage-unavailable' as const };
			}
			if (
				transition.status === 'future' ||
				transition.status === 'invalid'
			) {
				return { status: 'unsupported' as const };
			}
			if (
				transition.status !== 'current' ||
				transition.raw !== input.expectedMarkerRaw ||
				transition.marker.phase !== 'prepared' ||
				!checkOwnerEqual(transition.marker.to, input.nextOwner) ||
				transition.marker.nextGeneration !== input.nextOwner.generation
			) {
				return { status: 'stale' as const };
			}

			const owner = readStoredAccountWorkspace();
			if (owner.status === 'storage-unavailable') {
				return { status: 'storage-unavailable' as const };
			}
			if (
				owner.status !== 'current' ||
				owner.raw !== input.expectedOwnerRaw ||
				!checkOwnerEqual(
					{
						generation: owner.workspace.generation,
						...(owner.workspace.owner.kind === 'guest'
							? { kind: 'guest' as const }
							: {
									kind: 'account' as const,
									userId: owner.workspace.owner.userId,
								}),
					},
					transition.marker.from
				)
			) {
				return { status: 'stale' as const };
			}

			const written = writeStoredAccountWorkspaceIfCurrent(
				input.expectedOwnerRaw,
				{
					generation: input.nextOwner.generation,
					owner:
						input.nextOwner.kind === 'guest'
							? { kind: 'guest' }
							: {
									kind: 'account',
									userId: input.nextOwner.userId,
								},
					version: 1,
				}
			);
			if (!written) {
				return { status: 'stale' as const };
			}

			const committedRaw = writeAccountWorkspaceTransition({
				...transition.marker,
				phase: 'owner-committed',
			});
			workspaceStore.setSnapshot({
				isReady: false,
				snapshot: {
					generation: input.nextOwner.generation,
					owner: input.nextOwner,
					phase: 'transitioning',
				},
				transitionStatus:
					committedRaw === null ? 'prepared' : 'owner-committed',
			});
			return {
				markerRaw: committedRaw ?? input.expectedMarkerRaw,
				status: 'committed' as const,
			};
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: false }
	)) ?? {
		status: 'stale',
	}) satisfies TAccountWorkspaceTransitionMutationResult;
}

export async function finishAccountWorkspaceTransition(input: {
	expectedMarkerRaw: string;
}): Promise<TAccountWorkspaceTransitionMutationResult> {
	return ((await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			const transition = readAccountWorkspaceTransition();
			if (transition.status === 'storage-unavailable') {
				return { status: 'storage-unavailable' as const };
			}
			if (
				transition.status === 'future' ||
				transition.status === 'invalid'
			) {
				return { status: 'unsupported' as const };
			}
			if (
				transition.status !== 'current' ||
				transition.raw !== input.expectedMarkerRaw
			) {
				return { status: 'stale' as const };
			}

			const owner = readStoredAccountWorkspace();
			if (owner.status !== 'current') {
				return owner.status === 'storage-unavailable'
					? { status: 'storage-unavailable' as const }
					: { status: 'stale' as const };
			}
			const runtimeOwner: TAccountWorkspaceOwner =
				owner.workspace.owner.kind === 'guest'
					? { generation: owner.workspace.generation, kind: 'guest' }
					: {
							generation: owner.workspace.generation,
							kind: 'account',
							userId: owner.workspace.owner.userId,
						};
			if (!checkOwnerEqual(runtimeOwner, transition.marker.to)) {
				return { status: 'stale' as const };
			}
			if (
				!removeAccountWorkspaceTransitionIfCurrent(
					input.expectedMarkerRaw
				)
			) {
				return { status: 'stale' as const };
			}
			workspaceStore.setSnapshot({
				isReady: true,
				snapshot: {
					generation: runtimeOwner.generation,
					owner: runtimeOwner,
					phase: 'ready',
				},
			});
			return {
				markerRaw: input.expectedMarkerRaw,
				status: 'committed' as const,
			};
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: false }
	)) ?? {
		status: 'stale',
	}) satisfies TAccountWorkspaceTransitionMutationResult;
}

export async function cancelPreparedAccountWorkspaceTransition(input: {
	expectedMarkerRaw: string;
}): Promise<TAccountWorkspaceTransitionMutationResult> {
	return ((await withCrossTabLock(
		ACCOUNT_WORKSPACE_LIFECYCLE_LOCK_NAME,
		() => {
			const transition = readAccountWorkspaceTransition();
			if (transition.status === 'storage-unavailable') {
				return { status: 'storage-unavailable' as const };
			}
			if (
				transition.status === 'future' ||
				transition.status === 'invalid'
			) {
				return { status: 'unsupported' as const };
			}
			if (
				transition.status !== 'current' ||
				transition.raw !== input.expectedMarkerRaw ||
				transition.marker.phase !== 'prepared'
			) {
				return { status: 'stale' as const };
			}
			const owner = readStoredAccountWorkspace();
			if (owner.status !== 'current') {
				return owner.status === 'storage-unavailable'
					? { status: 'storage-unavailable' as const }
					: { status: 'stale' as const };
			}
			const runtimeOwner: TAccountWorkspaceOwner =
				owner.workspace.owner.kind === 'guest'
					? { generation: owner.workspace.generation, kind: 'guest' }
					: {
							generation: owner.workspace.generation,
							kind: 'account',
							userId: owner.workspace.owner.userId,
						};
			if (!checkOwnerEqual(runtimeOwner, transition.marker.from)) {
				return { status: 'stale' as const };
			}
			if (
				!removeAccountWorkspaceTransitionIfCurrent(
					input.expectedMarkerRaw
				)
			) {
				return { status: 'stale' as const };
			}
			workspaceStore.setSnapshot({
				isReady: true,
				snapshot: {
					generation: runtimeOwner.generation,
					owner: runtimeOwner,
					phase: 'ready',
				},
			});
			return {
				markerRaw: input.expectedMarkerRaw,
				status: 'committed' as const,
			};
		},
		{ fallbackTtl: 5 * 1000, ifAvailable: false }
	)) ?? {
		status: 'stale',
	}) satisfies TAccountWorkspaceTransitionMutationResult;
}

export async function recoverAccountWorkspaceTransition(): Promise<TAccountWorkspaceTransitionResult> {
	const transition = readAccountWorkspaceTransition();
	if (transition.status === 'none') {
		return { status: 'committed' };
	}
	if (transition.status === 'storage-unavailable') {
		return { status: 'storage-unavailable' };
	}
	if (transition.status === 'future' || transition.status === 'invalid') {
		return { status: 'unsupported' };
	}
	if (!('marker' in transition)) {
		return { status: 'unsupported' };
	}
	const { marker, raw: markerRaw } = transition;

	const owner = readStoredAccountWorkspace();
	if (owner.status === 'storage-unavailable') {
		return { status: 'storage-unavailable' };
	}
	if (owner.status !== 'current') {
		setRuntimeTransition(marker.phase, null);
		return { status: 'unsupported' };
	}
	const runtimeOwner: TAccountWorkspaceOwner =
		owner.workspace.owner.kind === 'guest'
			? { generation: owner.workspace.generation, kind: 'guest' }
			: {
					generation: owner.workspace.generation,
					kind: 'account',
					userId: owner.workspace.owner.userId,
				};

	if (checkOwnerEqual(runtimeOwner, marker.to)) {
		const finished = await finishAccountWorkspaceTransition({
			expectedMarkerRaw: markerRaw,
		});
		return finished.status === 'committed'
			? { status: 'committed' }
			: finished;
	}

	if (
		marker.phase === 'prepared' &&
		checkOwnerEqual(runtimeOwner, marker.from)
	) {
		setRuntimeTransition('prepared', runtimeOwner);
		return { status: 'busy' };
	}

	setRuntimeTransition(marker.phase, runtimeOwner);
	return { status: 'unsupported' };
}
