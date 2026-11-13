'use client';

import { useCallback, useState } from 'react';

import { ACCOUNT_SYNC_STATUS_MAP } from '@/domain/account/contracts';

import { deleteAccountData } from '@/features/account/client/api';
import { ACCOUNT_CLIENT_MESSAGE_KEYS } from '@/features/account/client/copy';
import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import { accountMessages } from '@/features/account/client/messages';
import {
	checkCurrentAccountAuthContext,
	refreshAccountState,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { postAccountSyncBroadcastMessage } from '@/features/account/client/sync/broadcast';
import {
	readDirtyQueueEntries,
	readIsolatedDirtyQueueNamespaces,
} from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { flushAccountSyncQueueUntilIdle } from '@/features/account/client/sync/flush';
import { pauseAccountSyncForEmptyCloud } from '@/features/account/client/sync/remoteState';
import { withAccountSyncOperationLease } from '@/features/account/client/sync/syncOperationLease';
import {
	executeAccountLogoutWorkspace,
	executeActiveAccountDeletionWorkspace,
} from '@/features/account/client/workspace/lifecycle';
import { captureAccountWorkspace } from '@/features/account/client/workspace/workspaceStore';
import type { IAccountUserProfile } from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import { pushOverlayChild } from '@/features/overlays/client';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { useI18n } from '@/shared/i18n/useI18n';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';
import { ACCOUNT_MANAGER_MESSAGE_KEYS } from './copy';
import { logoutRecoveryStore } from './logoutRecoveryStore';

interface IUseAccountDestructiveActionsOptions {
	controller: IAccountActionController;
	csrfToken: string | null;
	isAccountSyncAllowed: boolean;
	user: IAccountUserProfile | null;
	vibrate: () => void;
}

interface IUseAccountDestructiveActionsResult {
	handleDeleteAccount: () => void;
	handleDeleteAccountCancel: () => void;
	handleDeleteAccountPopoverOpenChange: (isOpen: boolean) => void;
	handleDeleteData: () => void;
	handleDeleteDataCancel: () => void;
	handleDeleteDataPopoverOpenChange: (isOpen: boolean) => void;
	handleLogout: () => void;
	handleLogoutAll: () => void;
	isDeleteAccountPopoverOpen: boolean;
	isDeleteDataPopoverOpen: boolean;
}

export function useAccountDestructiveActions(
	options: IUseAccountDestructiveActionsOptions
): IUseAccountDestructiveActionsResult {
	const { locale, t } = useI18n(accountMessages);

	const {
		controller: { isSubmitting, setIsSubmitting, setMessage },
		csrfToken,
		isAccountSyncAllowed,
		user,
		vibrate,
	} = options;

	const [isDeleteDataPopoverOpen, setIsDeleteDataPopoverOpen] =
		useState(false);
	const [isDeleteAccountPopoverOpen, setIsDeleteAccountPopoverOpen] =
		useState(false);

	const logoutAfterFlush = useCallback(
		(operation: 'all' | 'current', trackName: string) => {
			if (csrfToken === null || isSubmitting || user === null) {
				return;
			}

			vibrate();

			trackEvent(
				trackEvent.category.click,
				'Account Auth Button',
				trackName
			);

			setIsSubmitting(true);
			setMessage(null);

			const expectedAuthContext = {
				expectedCsrfToken: csrfToken,
				expectedUserId: user.id,
			};

			const openRecovery = (
				reason: 'sync-failed' | 'sync-unavailable'
			) => {
				pushOverlayChild({
					childId: 'account.logout-recovery',
					onOpenChild: () => {
						logoutRecoveryStore.set({ operation, reason });
					},
					parentId: 'account.main',
				});
			};
			const runLogout = async (): Promise<void> => {
				const canSync =
					isAccountSyncAllowed &&
					user.sync_status !== ACCOUNT_SYNC_STATUS_MAP.pausedEmpty;
				if (canSync) {
					const isFlushed = await flushAccountSyncQueueUntilIdle();
					if (!isFlushed) {
						if (
							!checkCurrentAccountAuthContext(
								expectedAuthContext
							) ||
							accountStore.shared.user.get() === null ||
							accountStore.shared.sync.lastError.get() ===
								'unauthorized'
						) {
							return;
						}
						openRecovery('sync-failed');
						return;
					}
				} else {
					const hasUnuploadedChanges =
						readDirtyQueueEntries(user.id).length > 0 ||
						readIsolatedDirtyQueueNamespaces(user.id).length > 0;
					if (hasUnuploadedChanges) {
						openRecovery('sync-unavailable');
						return;
					}
				}

				const completion = await executeAccountLogoutWorkspace({
					action: operation,
					expected: captureAccountWorkspace(),
				});
				if (completion === 'guest' || completion === 'ready') {
					return;
				}
				if (typeof completion === 'object') {
					setMessage(completion.message);
					return;
				}
				if (completion === 'busy') {
					setMessage(ACCOUNT_CLIENT_MESSAGE_KEYS.operationBusy);
					return;
				}
				switch (completion) {
					case 'account-mismatch':
					case 'locked':
					case 'pending-recovery':
						return;
				}
				setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.logoutSyncFailed);
			};
			void runLogout()
				.catch((error: unknown) => {
					setMessage(
						Error.isError(error)
							? error.message
							: ACCOUNT_MANAGER_MESSAGE_KEYS.logoutSyncFailed
					);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		},
		[
			csrfToken,
			isAccountSyncAllowed,
			isSubmitting,
			setIsSubmitting,
			setMessage,
			user,
			vibrate,
		]
	);

	const handleLogout = useCallback(() => {
		logoutAfterFlush('current', 'Logout');
	}, [logoutAfterFlush]);

	const handleLogoutAll = useCallback(() => {
		logoutAfterFlush('all', 'Logout All');
	}, [logoutAfterFlush]);

	const handleDeleteData = useCallback(() => {
		if (
			!isAccountSyncAllowed ||
			csrfToken === null ||
			isSubmitting ||
			user === null
		) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Sync Button',
			'Delete Data'
		);

		setIsDeleteDataPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const deleteStartedAt = Date.now();

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedUserContext = { expectedUserId: user.id };

		void withAccountSyncOperationLease(
			user.id,
			'delete-data',
			async (operationId) => {
				const result = await deleteAccountData(
					csrfToken,
					user.state_epoch,
					user.sync_generation
				);
				if (result.status === 'error') {
					return { operationId, pauseResult: null, result };
				}
				const pauseResult = await pauseAccountSyncForEmptyCloud({
					stateEpoch: result.data.state_epoch,
					syncGeneration: result.data.sync_generation,
					userId: user.id,
				});
				return { operationId, pauseResult, result };
			}
		)
			.then(async (leaseResult) => {
				if (leaseResult === null) {
					setMessage(ACCOUNT_CLIENT_MESSAGE_KEYS.operationBusy);
					return;
				}
				const { operationId, pauseResult, result } = leaseResult;
				if (result.status === 'error') {
					if (
						handleUnauthorizedAccountActionError(
							result,
							expectedSessionContext
						)
					) {
						return;
					}
					if (
						!checkCurrentAccountAuthContext(expectedSessionContext)
					) {
						return;
					}
					if (
						result.httpStatus === 409 &&
						(result.message === 'state-epoch-mismatch' ||
							result.message === 'sync-generation-mismatch')
					) {
						setMessage(
							ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataChangedRefreshing
						);
						try {
							await refreshAccountState();
						} catch (error) {
							if (
								handleUnauthorizedAccountError(
									error,
									expectedSessionContext
								) ||
								!checkCurrentAccountAuthContext(
									expectedSessionContext
								)
							) {
								return;
							}
							setMessage(
								ACCOUNT_CLIENT_MESSAGE_KEYS.accountStateRefreshFailed
							);
							return;
						}
						if (
							checkCurrentAccountAuthContext(
								expectedSessionContext
							)
						) {
							setMessage(
								ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataChangedReconfirm
							);
						}
						return;
					}

					setMessage(result.message);
					return;
				}
				if (!checkCurrentAccountAuthContext(expectedUserContext)) {
					return;
				}

				const { state_epoch } = result.data;

				if (!pauseResult) {
					throw new Error('account-sync-pause-incomplete');
				}
				return postAccountSyncBroadcastMessage({
					deleteStartedAt,
					namespaces: [],
					operationId,
					state_epoch,
					tabId: 'local',
					type: 'data-deleted',
					userId: user.id,
				})
					.then(() => {
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage(
							ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataCleared
						);
					})
					.catch((error: unknown) => {
						console.warn(
							'Account data deletion broadcast failed.',
							{ errorCode: getLogSafeErrorCode(error) }
						);
						if (
							!checkCurrentAccountAuthContext(expectedUserContext)
						) {
							return;
						}

						setMessage(
							ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataCleared
						);
					});
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}

				const errorCode = Error.isError(error)
					? error.message
					: 'account-sync-pause-incomplete';
				if (errorCode === 'account-sync-pause-incomplete') {
					accountStore.shared.sync.lastError.set(errorCode);
				}
				setMessage(
					getAccountClientErrorMessage(
						errorCode,
						locale,
						t(ACCOUNT_MANAGER_MESSAGE_KEYS.cloudDataClearFailed)
					)
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [
		csrfToken,
		isAccountSyncAllowed,
		isSubmitting,
		locale,
		setIsSubmitting,
		setMessage,
		t,
		user,
		vibrate,
	]);

	const handleDeleteAccount = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
			return;
		}

		vibrate();

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Delete Account'
		);

		setIsDeleteAccountPopoverOpen(false);
		setIsSubmitting(true);
		setMessage(null);

		const expectedSessionContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		const expectedWorkspace = captureAccountWorkspace();

		void executeActiveAccountDeletionWorkspace(expectedWorkspace)
			.then((completion) => {
				if (completion === 'guest') {
					accountStore.closeAccountModal();
					return;
				}
				if (typeof completion === 'object') {
					setMessage(completion.message);
					return;
				}
				if (completion === 'busy') {
					setMessage(ACCOUNT_CLIENT_MESSAGE_KEYS.operationBusy);
					return;
				}
				switch (completion) {
					case 'account-mismatch':
					case 'locked':
					case 'pending-recovery':
						return;
				}
				setMessage(ACCOUNT_MANAGER_MESSAGE_KEYS.accountDeleteFailed);
			})
			.catch((error: unknown) => {
				console.warn('Failed to delete or clean up account state.', {
					errorCode: getLogSafeErrorCode(error),
				});
				if (!checkCurrentAccountAuthContext(expectedSessionContext)) {
					return;
				}
				setMessage(
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_KEYS.accountDeleteFailed
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, setIsSubmitting, setMessage, user, vibrate]);

	const handleDeleteDataPopoverOpenChange = useCallback((isOpen: boolean) => {
		setIsDeleteDataPopoverOpen(isOpen);
		if (isOpen) {
			setIsDeleteAccountPopoverOpen(false);
		}
	}, []);

	const handleDeleteAccountPopoverOpenChange = useCallback(
		(isOpen: boolean) => {
			setIsDeleteAccountPopoverOpen(isOpen);
			if (isOpen) {
				setIsDeleteDataPopoverOpen(false);
			}
		},
		[]
	);

	const handleDeleteDataCancel = useCallback(() => {
		setIsDeleteDataPopoverOpen(false);
	}, []);

	const handleDeleteAccountCancel = useCallback(() => {
		setIsDeleteAccountPopoverOpen(false);
	}, []);

	return {
		handleDeleteAccount,
		handleDeleteAccountCancel,
		handleDeleteAccountPopoverOpenChange,
		handleDeleteData,
		handleDeleteDataCancel,
		handleDeleteDataPopoverOpenChange,
		handleLogout,
		handleLogoutAll,
		isDeleteAccountPopoverOpen,
		isDeleteDataPopoverOpen,
	};
}
