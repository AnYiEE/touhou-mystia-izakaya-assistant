'use client';

import { useCallback, useState } from 'react';

import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import {
	AccountApiError,
	type TAccountApiResult,
	deleteAccount,
	deleteAccountData,
	logoutAccount,
	logoutAllAccount,
} from '@/features/account/client/api';
import { createAccountClientId } from '@/features/account/client/clientId';
import { ACCOUNT_CLIENT_MESSAGE_MAP } from '@/features/account/client/copy';
import { getAccountClientErrorMessage } from '@/features/account/client/errorMessage';
import {
	checkCurrentAccountAuthContext,
	refreshAccountState,
	resetAccountStateIfCurrent,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import { removeAccountSyncBaseSnapshotsForAccountDeletion } from '@/features/account/client/sync/baseSnapshot';
import { postAccountSyncBroadcastMessage } from '@/features/account/client/sync/broadcast';
import { removeAccountSyncConflictResolutionJournals } from '@/features/account/client/sync/conflictResolutionJournal';
import { removeDirtyQueueEntries } from '@/features/account/client/sync/dirtyQueue/collisionEvidence';
import { flushAccountSyncQueueUntilIdle } from '@/features/account/client/sync/flush';
import { removeAccountSyncLeaseForAccountDeletion } from '@/features/account/client/sync/lease';
import { pauseAccountSyncForEmptyCloud } from '@/features/account/client/sync/remoteState';
import {
	markAccountSyncResetGenerationDeleted,
	withAccountSyncResetGenerationLock,
} from '@/features/account/client/sync/resetGeneration';
import { removeAccountSyncMetaForAccountDeletion } from '@/features/account/client/sync/snapshot';
import {
	removeAccountSyncOperationForAccountDeletion,
	withAccountSyncOperationLease,
} from '@/features/account/client/sync/syncOperationLease';
import type { IAccountUserProfile } from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';
import { ACCOUNT_MANAGER_MESSAGE_MAP } from './copy';

const LOGOUT_SKIPPED = Symbol('logout-skipped');
type TLogoutAfterFlushResult =
	| TAccountApiResult<unknown>
	| typeof LOGOUT_SKIPPED;

interface IUseAccountDestructiveActionsOptions {
	controller: IAccountActionController;
	csrfToken: string | null;
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
	const {
		controller: { isSubmitting, setIsSubmitting, setMessage },

		csrfToken,

		user,
		vibrate,
	} = options;
	const [isDeleteDataPopoverOpen, setIsDeleteDataPopoverOpen] =
		useState(false);

	const [isDeleteAccountPopoverOpen, setIsDeleteAccountPopoverOpen] =
		useState(false);

	const logoutAfterFlush = useCallback(
		(
			action: (csrfToken: string) => Promise<TAccountApiResult<unknown>>,
			trackName: string
		) => {
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

			void flushAccountSyncQueueUntilIdle()
				.then(async (isFlushed): Promise<TLogoutAfterFlushResult> => {
					if (!isFlushed) {
						if (
							!checkCurrentAccountAuthContext(expectedAuthContext)
						) {
							return LOGOUT_SKIPPED;
						}
						if (accountStore.shared.user.get() === null) {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						const syncLastError =
							accountStore.shared.sync.lastError.get();
						if (syncLastError === 'unauthorized') {
							resetAccountStateIfCurrent(expectedAuthContext);
							return LOGOUT_SKIPPED;
						}

						setMessage(
							ACCOUNT_MANAGER_MESSAGE_MAP.syncPendingBeforeLogout
						);

						return LOGOUT_SKIPPED;
					}

					return await action(csrfToken);
				})
				.then((result) => {
					if (result === LOGOUT_SKIPPED) {
						return;
					}
					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedAuthContext
							)
						) {
							return;
						}
						setMessage(result.message);
						return;
					}

					if (resetAccountStateIfCurrent(expectedAuthContext)) {
						void publishAccountRuntimeInvalidation({
							reason:
								trackName === 'Logout All'
									? 'logout-all'
									: 'logout',
							stateEpoch: user.state_epoch,
							userId: user.id,
						});
					}
				})
				.catch((error: unknown) => {
					if (
						error instanceof AccountApiError &&
						error.status === 401
					) {
						if (resetAccountStateIfCurrent(expectedAuthContext)) {
							void publishAccountRuntimeInvalidation({
								reason: 'session-expired',
								stateEpoch: user.state_epoch,
								userId: user.id,
							});
						}
						return;
					}

					setMessage(
						Error.isError(error)
							? error.message
							: ACCOUNT_MANAGER_MESSAGE_MAP.logoutSyncFailed
					);
				})
				.finally(() => {
					setIsSubmitting(false);
				});
		},
		[csrfToken, isSubmitting, setIsSubmitting, setMessage, user, vibrate]
	);

	const handleLogout = useCallback(() => {
		logoutAfterFlush(logoutAccount, 'Logout');
	}, [logoutAfterFlush]);

	const handleLogoutAll = useCallback(() => {
		logoutAfterFlush(logoutAllAccount, 'Logout All');
	}, [logoutAfterFlush]);

	const handleDeleteData = useCallback(() => {
		if (csrfToken === null || isSubmitting || user === null) {
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
					setMessage(ACCOUNT_CLIENT_MESSAGE_MAP.operationBusy);
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
							ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataChangedRefreshing
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
								ACCOUNT_CLIENT_MESSAGE_MAP.accountStateRefreshFailed
							);
							return;
						}
						if (
							checkCurrentAccountAuthContext(
								expectedSessionContext
							)
						) {
							setMessage(
								ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataChangedReconfirm
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
							ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataCleared
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
							ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataCleared
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
						ACCOUNT_MANAGER_MESSAGE_MAP.cloudDataClearFailed
					)
				);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}, [csrfToken, isSubmitting, setIsSubmitting, setMessage, user, vibrate]);

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
		const expectedUserContext = { expectedUserId: user.id };

		void deleteAccount(csrfToken)
			.then(async (result) => {
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

					setMessage(result.message);
					return;
				}

				void publishAccountRuntimeInvalidation({
					reason: 'account-deleted',
					stateEpoch: user.state_epoch,
					userId: user.id,
				});

				try {
					const didCleanUp = await withAccountSyncResetGenerationLock(
						user.id,
						() => {
							const deletedMarker =
								markAccountSyncResetGenerationDeleted({
									operationId: createAccountClientId(),
									stateEpoch: user.state_epoch,
									userId: user.id,
								});
							if (deletedMarker === null) {
								return false;
							}
							removeAccountSyncOperationForAccountDeletion(
								user.id
							);
							removeDirtyQueueEntries(user.id);
							removeAccountSyncBaseSnapshotsForAccountDeletion(
								user.id
							);
							removeAccountSyncConflictResolutionJournals(
								user.id
							);
							removeAccountSyncMetaForAccountDeletion(user.id);
							removeAccountSyncLeaseForAccountDeletion(user.id);
							return true;
						},
						{ ifAvailable: false }
					);
					if (didCleanUp !== true) {
						throw new Error(
							'account-deletion-local-cleanup-failed'
						);
					}
				} finally {
					resetAccountStateIfCurrent(expectedUserContext);
				}
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
						: ACCOUNT_MANAGER_MESSAGE_MAP.accountDeleteFailed
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
