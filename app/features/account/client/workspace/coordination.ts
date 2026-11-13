import {
	consumeAccountRuntimeInvalidationOperation,
	createAccountRuntimeSignalKey,
	parseAccountRuntimeSignal,
} from '@/features/account/client/accountRuntimeInvalidation';
import { refreshAccountStateFromInvalidation } from '@/features/account/client/session';
import { ACCOUNT_STORAGE_KEY_MAP } from '@/features/account/client/storage';
import { subscribeAccountSyncBroadcastMessage } from '@/features/account/client/sync/broadcast';
import { getAccountSyncTabId } from '@/features/account/client/sync/clientRuntime';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';

import { type IStoredAccountWorkspaceTransition } from './contracts';
import {
	readAccountWorkspaceTransition,
	restoreWorkspaceRuntimeFromStorage,
} from './transition';
import { captureAccountWorkspace } from './workspaceStore';

function getTransitionReason(
	value: ReturnType<typeof readAccountWorkspaceTransition>
): IStoredAccountWorkspaceTransition['reason'] | null {
	return value.status === 'current' ? value.marker.reason : null;
}

function checkOwnerChanged(
	previous: ReturnType<typeof captureAccountWorkspace>,
	next: ReturnType<typeof captureAccountWorkspace>
) {
	const previousOwner = previous.owner;
	const nextOwner = next.owner;
	return (
		previousOwner?.generation !== nextOwner?.generation ||
		previousOwner?.kind !== nextOwner?.kind ||
		(previousOwner?.kind === 'account' &&
			nextOwner?.kind === 'account' &&
			previousOwner.userId !== nextOwner.userId)
	);
}

function reloadForWorkspaceGeneration(generation: number) {
	const reloadKey = `account-workspace-reload:${generation}`;
	try {
		if (sessionStorage.getItem(reloadKey) === '1') {
			return;
		}
		sessionStorage.setItem(reloadKey, '1');
	} catch {
		/* Reload is still the safe fallback when dedupe storage is unavailable. */
	}
	location.reload();
}

export function startAccountWorkspaceCoordinationClient() {
	restoreWorkspaceRuntimeFromStorage();
	let observedTransitionReason:
		IStoredAccountWorkspaceTransition['reason'] | null = null;
	let transitionRecoveryTimer: ReturnType<typeof setInterval> | null = null;
	const stopTransitionRecoveryTimer = () => {
		if (transitionRecoveryTimer !== null) {
			clearInterval(transitionRecoveryTimer);
			transitionRecoveryTimer = null;
		}
	};
	const reconcileTransitionAfterLease = () => {
		const transition = readAccountWorkspaceTransition();
		if (transition.status !== 'current') {
			stopTransitionRecoveryTimer();
			return;
		}
		transitionRecoveryTimer ??= setInterval(() => {
			const currentTransition = readAccountWorkspaceTransition();
			if (currentTransition.status !== 'current') {
				stopTransitionRecoveryTimer();
				return;
			}
			void refreshAccountStateFromInvalidation().catch(() => {});
		}, 16_000);
	};
	reconcileTransitionAfterLease();

	const unsubscribeBroadcast = subscribeAccountSyncBroadcastMessage(
		(message) => {
			if (message.tabId === getAccountSyncTabId()) {
				return;
			}
			if (message.type === 'account-updated') {
				if (message.accountRuntime !== undefined) {
					const signal = parseAccountRuntimeSignal({
						key: createAccountRuntimeSignalKey(message.userId),
						value: JSON.stringify({
							...message.accountRuntime,
							operationId: message.operationId,
							state_epoch: message.state_epoch,
							userId: message.userId,
						}),
					});
					if (signal === null) {
						return;
					}
				} else if (
					typeof message.operationId !== 'string' ||
					message.operationId === '' ||
					typeof message.userId !== 'string' ||
					message.userId === '' ||
					!isNonNegativeSafeInteger(message.state_epoch)
				) {
					return;
				}
				if (
					!consumeAccountRuntimeInvalidationOperation(
						`${message.userId}:${message.operationId}`
					)
				) {
					return;
				}
				void refreshAccountStateFromInvalidation().catch(() => {});
				return;
			}
			if (message.type === 'profile-updated') {
				void refreshAccountStateFromInvalidation().catch(() => {});
			}
		}
	);

	const handleStorage = (event: StorageEvent) => {
		if (event.key === ACCOUNT_STORAGE_KEY_MAP.workspaceTransition) {
			const transition = readAccountWorkspaceTransition();
			if (transition.status === 'current') {
				observedTransitionReason = transition.marker.reason;
				reconcileTransitionAfterLease();
			} else {
				stopTransitionRecoveryTimer();
			}
			restoreWorkspaceRuntimeFromStorage();
			return;
		}
		if (event.key === ACCOUNT_STORAGE_KEY_MAP.workspaceOwner) {
			const previous = captureAccountWorkspace();
			const transition = readAccountWorkspaceTransition();
			const reason =
				getTransitionReason(transition) ?? observedTransitionReason;
			restoreWorkspaceRuntimeFromStorage();
			const next = captureAccountWorkspace();
			stopTransitionRecoveryTimer();
			if (!checkOwnerChanged(previous, next)) {
				return;
			}
			observedTransitionReason = null;
			void refreshAccountStateFromInvalidation().catch(() => {});
			if (reason !== 'account-disabled' && reason !== 'active-delete') {
				reloadForWorkspaceGeneration(next.generation);
			}
			return;
		}
		if (
			event.key?.startsWith(
				`${ACCOUNT_STORAGE_KEY_MAP.runtimeSignal}:`
			) !== true
		) {
			return;
		}
		const signal = parseAccountRuntimeSignal({
			key: event.key,
			value: event.newValue,
		});
		if (
			signal === null ||
			!consumeAccountRuntimeInvalidationOperation(
				`${signal.userId}:${signal.operationId}`
			)
		) {
			return;
		}
		void refreshAccountStateFromInvalidation().catch(() => {});
	};

	globalThis.addEventListener('storage', handleStorage);

	return () => {
		stopTransitionRecoveryTimer();
		unsubscribeBroadcast();
		globalThis.removeEventListener('storage', handleStorage);
	};
}
