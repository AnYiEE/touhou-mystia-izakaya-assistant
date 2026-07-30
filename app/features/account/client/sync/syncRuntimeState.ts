import { type TSyncNamespace } from '@/domain/account/contracts';

import { createAccountClientId } from '@/features/account/client/clientId';
import { accountStore } from '@/features/account/client/state/accountStore';
import type { ISyncConflictItem } from '@/features/account/sync/types';
import { setExternallyOwnedOverlayRequested } from '@/features/overlays/client';

import { postAccountSyncBroadcastMessage } from './broadcast';
import { readDirtyQueueEntries } from './dirtyQueue/collisionEvidence';

const REMOTE_CONFLICT_NOTICE_TTL = 20 * 1000;
const remoteConflictNoticeTimers = new Map<
	string,
	ReturnType<typeof setTimeout>
>();
const remoteConflictNoticeMutations = new Map<string, string | null>();
const autoResolutionCounts = new Map<string, number>();
const TRANSIENT_CONFLICT_ERROR_SET = new Set([
	'conflict',
	'remote-conflict-source-unavailable',
]);

function createRemoteConflictNoticeKey(
	userId: string,
	namespace: TSyncNamespace
) {
	return `${userId}:${namespace}`;
}

function clearRemoteConflictNoticeTimer(
	userId: string,
	namespace: TSyncNamespace
) {
	const key = createRemoteConflictNoticeKey(userId, namespace);
	const timer = remoteConflictNoticeTimers.get(key);
	if (timer !== undefined) {
		clearTimeout(timer);
		remoteConflictNoticeTimers.delete(key);
	}
}

function checkCurrentSyncUser(userId: string) {
	return accountStore.shared.user.get()?.id === userId;
}

function reconcileConflictBlocker(userId: string) {
	const hasConflict =
		checkCurrentSyncUser(userId) &&
		(accountStore.shared.sync.hasIsolatedState.get() ||
			accountStore.shared.sync.remoteConflictNamespaces.get().length >
				0 ||
			accountStore.shared.sync.conflicts
				.get()
				.some((conflict) => conflict.userId === userId));
	setExternallyOwnedOverlayRequested('account.sync-conflict', hasConflict);
}

function reconcileAccountSyncConflictLastError(
	userId: string,
	remoteSourceUnavailable = false
) {
	if (!checkCurrentSyncUser(userId)) {
		return;
	}

	const hasConflict =
		accountStore.shared.sync.remoteConflictNamespaces.get().length > 0 ||
		accountStore.shared.sync.conflicts
			.get()
			.some((conflict) => conflict.userId === userId);
	const lastError = accountStore.shared.sync.lastError.get();
	if (hasConflict) {
		if (lastError === null || TRANSIENT_CONFLICT_ERROR_SET.has(lastError)) {
			accountStore.shared.sync.lastError.set('conflict');
		}
		return;
	}
	if (accountStore.shared.sync.hasIsolatedState.get()) {
		return;
	}
	if (remoteSourceUnavailable) {
		if (lastError === null || TRANSIENT_CONFLICT_ERROR_SET.has(lastError)) {
			accountStore.shared.sync.lastError.set(
				'remote-conflict-source-unavailable'
			);
		}
		return;
	}
	if (lastError !== null && TRANSIENT_CONFLICT_ERROR_SET.has(lastError)) {
		accountStore.shared.sync.lastError.set(null);
	}
}

export function beginAccountSyncAutoResolution(
	userId: string,
	namespace: TSyncNamespace
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	const key = createRemoteConflictNoticeKey(userId, namespace);
	autoResolutionCounts.set(key, (autoResolutionCounts.get(key) ?? 0) + 1);

	accountStore.shared.sync.autoResolvingNamespaces.set([
		...new Set([
			...accountStore.shared.sync.autoResolvingNamespaces.get(),
			namespace,
		]),
	]);
	reconcileAccountSyncConflictLastError(userId);

	reconcileConflictBlocker(userId);

	return true;
}

export function checkAccountSyncAutoResolutionActive(
	userId: string,
	namespace: TSyncNamespace
) {
	return (
		checkCurrentSyncUser(userId) &&
		accountStore.shared.sync.autoResolvingNamespaces
			.get()
			.includes(namespace)
	);
}

export function endAccountSyncAutoResolution(
	userId: string,
	namespace: TSyncNamespace
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	const key = createRemoteConflictNoticeKey(userId, namespace);
	const count = autoResolutionCounts.get(key) ?? 0;

	if (count > 1) {
		autoResolutionCounts.set(key, count - 1);
		return true;
	}

	autoResolutionCounts.delete(key);
	accountStore.shared.sync.autoResolvingNamespaces.set(
		accountStore.shared.sync.autoResolvingNamespaces
			.get()
			.filter((item) => item !== namespace)
	);

	reconcileAccountSyncConflictLastError(userId);

	reconcileConflictBlocker(userId);

	return true;
}

export function addAccountSyncRemoteConflictNotices(
	userId: string,
	namespaces: ReadonlyArray<TSyncNamespace>,
	runtimeMutationId: string | null = null
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	accountStore.shared.sync.remoteConflictNamespaces.set([
		...new Set([
			...accountStore.shared.sync.remoteConflictNamespaces.get(),
			...namespaces,
		]),
	]);

	reconcileAccountSyncConflictLastError(userId);

	for (const namespace of namespaces) {
		clearRemoteConflictNoticeTimer(userId, namespace);

		const key = createRemoteConflictNoticeKey(userId, namespace);

		remoteConflictNoticeMutations.set(key, runtimeMutationId);
		remoteConflictNoticeTimers.set(
			key,
			setTimeout(() => {
				if (
					remoteConflictNoticeMutations.get(key) !== runtimeMutationId
				) {
					return;
				}

				remoteConflictNoticeTimers.delete(key);
				remoteConflictNoticeMutations.delete(key);

				if (!checkCurrentSyncUser(userId)) {
					return;
				}

				accountStore.shared.sync.remoteConflictNamespaces.set(
					accountStore.shared.sync.remoteConflictNamespaces
						.get()
						.filter((item) => item !== namespace)
				);
				reconcileAccountSyncConflictLastError(userId, true);
				reconcileConflictBlocker(userId);
			}, REMOTE_CONFLICT_NOTICE_TTL)
		);
	}

	reconcileConflictBlocker(userId);

	return true;
}

export function removeAccountSyncRemoteConflictNotices(
	userId: string,
	namespaces?: ReadonlyArray<TSyncNamespace>,
	runtimeMutationId?: string | null
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	if (namespaces === undefined) {
		for (const namespace of accountStore.shared.sync.remoteConflictNamespaces.get()) {
			clearRemoteConflictNoticeTimer(userId, namespace);
			remoteConflictNoticeMutations.delete(
				createRemoteConflictNoticeKey(userId, namespace)
			);
		}
		accountStore.shared.sync.remoteConflictNamespaces.set([]);
	} else {
		const namespaceSet = new Set(
			namespaces.filter((namespace) => {
				if (runtimeMutationId === undefined) {
					return true;
				}
				return (
					remoteConflictNoticeMutations.get(
						createRemoteConflictNoticeKey(userId, namespace)
					) === runtimeMutationId
				);
			})
		);
		for (const namespace of namespaces) {
			if (!namespaceSet.has(namespace)) {
				continue;
			}
			clearRemoteConflictNoticeTimer(userId, namespace);
			remoteConflictNoticeMutations.delete(
				createRemoteConflictNoticeKey(userId, namespace)
			);
		}
		accountStore.shared.sync.remoteConflictNamespaces.set(
			accountStore.shared.sync.remoteConflictNamespaces
				.get()
				.filter((namespace) => !namespaceSet.has(namespace))
		);
	}

	reconcileAccountSyncConflictLastError(userId);

	reconcileConflictBlocker(userId);

	return true;
}

export function setAccountSyncFutureStateIsolated(
	userId: string,
	isIsolated: boolean
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	accountStore.shared.sync.hasIsolatedState.set(isIsolated);
	if (isIsolated) {
		accountStore.shared.sync.lastError.set('sync-client-update-required');
	} else if (
		accountStore.shared.sync.lastError.get() ===
		'sync-client-update-required'
	) {
		accountStore.shared.sync.lastError.set(null);
	}
	reconcileAccountSyncConflictLastError(userId);

	reconcileConflictBlocker(userId);

	return true;
}

export function replaceAccountSyncConflicts(
	userId: string,
	conflicts: ReadonlyArray<ISyncConflictItem>
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	accountStore.shared.sync.conflicts.set(
		conflicts.filter(
			(conflict) =>
				conflict.userId === userId &&
				conflict.automaticResolution === undefined
		)
	);

	reconcileAccountSyncConflictLastError(userId);
	reconcileConflictBlocker(userId);

	return true;
}

export function removeAccountSyncConflict(
	userId: string,
	namespace: TSyncNamespace
) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	accountStore.shared.sync.conflicts.set(
		accountStore.shared.sync.conflicts
			.get()
			.filter(
				(conflict) =>
					conflict.userId !== userId ||
					conflict.namespace !== namespace
			)
	);

	reconcileAccountSyncConflictLastError(userId);
	reconcileConflictBlocker(userId);

	return true;
}

export function upsertAccountSyncConflict(conflict: ISyncConflictItem) {
	if (!checkCurrentSyncUser(conflict.userId)) {
		return false;
	}
	if (conflict.automaticResolution !== undefined) {
		return removeAccountSyncConflict(conflict.userId, conflict.namespace);
	}

	accountStore.shared.sync.conflicts.set([
		...accountStore.shared.sync.conflicts
			.get()
			.filter(
				(item) =>
					item.userId !== conflict.userId ||
					item.namespace !== conflict.namespace
			),
		conflict,
	]);

	reconcileAccountSyncConflictLastError(conflict.userId);
	reconcileConflictBlocker(conflict.userId);

	return true;
}

export function clearAccountSyncRuntimeConflicts() {
	const userId = accountStore.shared.user.get()?.id;

	if (userId !== undefined) {
		for (const namespace of accountStore.shared.sync.remoteConflictNamespaces.get()) {
			clearRemoteConflictNoticeTimer(userId, namespace);
			remoteConflictNoticeMutations.delete(
				createRemoteConflictNoticeKey(userId, namespace)
			);
		}
		for (const key of autoResolutionCounts.keys()) {
			if (key.startsWith(`${userId}:`)) {
				autoResolutionCounts.delete(key);
			}
		}
	}

	accountStore.shared.sync.conflicts.set([]);
	accountStore.shared.sync.autoResolvingNamespaces.set([]);
	accountStore.shared.sync.hasIsolatedState.set(false);
	accountStore.shared.sync.remoteConflictNamespaces.set([]);
	if (userId !== undefined) {
		reconcileAccountSyncConflictLastError(userId);
	}
	setExternallyOwnedOverlayRequested('account.sync-conflict', false);
}

export function refreshAccountSyncQueueRuntime(userId: string) {
	if (!checkCurrentSyncUser(userId)) {
		return false;
	}

	const pendingCount = readDirtyQueueEntries(userId).filter(
		({ paused }) => paused === null
	).length;

	accountStore.shared.sync.pendingCount.set(pendingCount);
	accountStore.shared.sync.queueRevision.set(
		accountStore.shared.sync.queueRevision.get() + 1
	);

	return true;
}

export function completeAccountSyncConflictResolutionRuntime(
	userId: string,
	namespace: TSyncNamespace,
	runtimeMutationId?: string
) {
	if (!removeAccountSyncConflict(userId, namespace)) {
		return false;
	}

	refreshAccountSyncQueueRuntime(userId);

	reconcileAccountSyncConflictLastError(userId);

	const stateEpoch = accountStore.shared.user.get()?.state_epoch;
	if (stateEpoch !== undefined) {
		void postAccountSyncBroadcastMessage({
			namespaces: [namespace],
			operationId: createAccountClientId(),
			...(runtimeMutationId === undefined ? {} : { runtimeMutationId }),
			runtimeReason: 'conflict-resolved',
			state_epoch: stateEpoch,
			tabId: 'runtime',
			type: 'dirty',
			userId,
		});
	}

	return true;
}
