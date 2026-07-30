'use client';

import {
	type Dispatch,
	type RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import {
	type TAccountApiResult,
	refreshAccountSsoGrants,
	revokeAccountSsoGrant,
} from '@/features/account/client/api';
import { checkCurrentAccountAuthContext } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import type {
	IAccountSessionRecord,
	IAccountSsoGrant,
	IAccountSsoGrantInitialData,
	IAccountSsoGrantListData,
	IAccountUserProfile,
} from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';

const accountSsoGrantsRequestMap = new Map<
	string,
	Promise<TAccountApiResult<IAccountSsoGrantListData>>
>();

function createAccountSsoGrantsRequestKey(userId: string, csrfToken: string) {
	return `${userId}:${csrfToken}`;
}

function refreshAccountSsoGrantsOnce(userId: string, csrfToken: string) {
	const requestKey = createAccountSsoGrantsRequestKey(userId, csrfToken);
	const currentRequest = accountSsoGrantsRequestMap.get(requestKey);
	if (currentRequest !== undefined) {
		return currentRequest;
	}

	const nextRequest = refreshAccountSsoGrants().finally(() => {
		if (accountSsoGrantsRequestMap.get(requestKey) === nextRequest) {
			accountSsoGrantsRequestMap.delete(requestKey);
		}
	});
	accountSsoGrantsRequestMap.set(requestKey, nextRequest);

	return nextRequest;
}

interface IUseAccountSsoGrantsOptions {
	bootstrapStatus: ReturnType<typeof accountStore.shared.bootstrapStatus.get>;
	controller: IAccountActionController;
	csrfToken: string | null;
	passwordMustChange: boolean;
	sessionListUpdatedAtRef: RefObject<number>;
	setAccountSessions: Dispatch<SetStateAction<IAccountSessionRecord[]>>;
	setAccountSessionsUserId: Dispatch<SetStateAction<string | null>>;
	ssoGrantInitialData: IAccountSsoGrantInitialData | null;
	user: IAccountUserProfile | null;
	vibrate: () => void;
}

interface IUseAccountSsoGrantsResult {
	handleRefreshSsoGrants: () => void;
	handleRevokeSsoGrant: () => void;
	handleRevokeSsoGrantCancel: () => void;
	handleRevokeSsoGrantOpen: (clientId: string) => void;
	isSsoGrantListLoading: boolean;
	revokeTargetClientId: string | null;
	revokingClientId: string | null;
	ssoGrants: IAccountSsoGrant[];
	ssoGrantsUserId: string | null;
}

export function useAccountSsoGrants(
	options: IUseAccountSsoGrantsOptions
): IUseAccountSsoGrantsResult {
	const {
		bootstrapStatus,
		controller: { isSubmitting, setIsSubmitting, setMessage },
		csrfToken,
		passwordMustChange,
		sessionListUpdatedAtRef,
		setAccountSessions,
		setAccountSessionsUserId,
		ssoGrantInitialData,
		user,
		vibrate,
	} = options;
	const [isSsoGrantListLoading, setIsSsoGrantListLoading] = useState(false);

	const [ssoGrants, setSsoGrants] = useState<IAccountSsoGrant[]>([]);

	const [ssoGrantsUserId, setSsoGrantsUserId] = useState<string | null>(null);

	const [revokeTargetClientId, setRevokeTargetClientId] = useState<
		string | null
	>(null);

	const [revokingClientId, setRevokingClientId] = useState<string | null>(
		null
	);

	const ssoGrantListUpdatedAtRef = useRef(0);

	const ssoGrantListRequestIdRef = useRef(0);

	const ssoGrantsFetchRequestedUserIdRef = useRef<string | null>(null);

	const refreshAccountSsoGrantsForCurrentUser = useCallback(
		({ silent = false }: { silent?: boolean } = {}) => {
			if (user === null || csrfToken === null || passwordMustChange) {
				ssoGrantListRequestIdRef.current += 1;
				setIsSsoGrantListLoading(false);
				setSsoGrants([]);
				setSsoGrantsUserId(null);
				return Promise.resolve(false);
			}

			const userId = user.id;
			const expectedUserContext = { expectedUserId: userId };
			const requestId = ssoGrantListRequestIdRef.current + 1;
			ssoGrantListRequestIdRef.current = requestId;
			setIsSsoGrantListLoading(true);
			const isLatestRequest = () =>
				ssoGrantListRequestIdRef.current === requestId;
			const isCurrentUserRequest = () =>
				isLatestRequest() &&
				accountStore.shared.user.get()?.id === userId &&
				!accountStore.shared.passwordMustChange.get();

			return refreshAccountSsoGrantsOnce(userId, csrfToken)
				.then((result) => {
					if (!isCurrentUserRequest()) {
						return false;
					}

					if (result.status === 'error') {
						if (
							handleUnauthorizedAccountActionError(
								result,
								expectedUserContext
							)
						) {
							return false;
						}

						if (!silent) {
							setMessage(result.message);
						}
						return false;
					}

					setSsoGrants(result.data.grants);
					setSsoGrantsUserId(userId);
					return true;
				})
				.catch((error: unknown) => {
					if (!isCurrentUserRequest()) {
						return false;
					}
					if (
						handleUnauthorizedAccountError(
							error,
							expectedUserContext
						)
					) {
						return false;
					}

					console.warn('Failed to list SSO grants.', {
						errorCode: getLogSafeErrorCode(error),
					});
					if (!silent) {
						setMessage(
							error instanceof Error
								? error.message
								: '已授权应用刷新失败'
						);
					}

					return false;
				})
				.finally(() => {
					if (isLatestRequest()) {
						setIsSsoGrantListLoading(false);
					}
				});
		},
		[csrfToken, passwordMustChange, setMessage, user]
	);

	useEffect(() => {
		if (user === null || csrfToken === null || passwordMustChange) {
			ssoGrantsFetchRequestedUserIdRef.current = null;
			ssoGrantListRequestIdRef.current += 1;
			setIsSsoGrantListLoading(false);
			if (
				bootstrapStatus === 'anonymous' ||
				bootstrapStatus === 'loggedIn' ||
				passwordMustChange
			) {
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				accountStore.shared.sessionInitialData.set(null);
				accountStore.shared.ssoGrantInitialData.set(null);
				setSsoGrants([]);
				ssoGrantListUpdatedAtRef.current = Date.now();
				setSsoGrantsUserId(null);
			}
			return;
		}

		if (ssoGrantInitialData?.user_id === user.id) {
			accountStore.shared.ssoGrantInitialData.set(null);
			ssoGrantsFetchRequestedUserIdRef.current = user.id;
			if (
				ssoGrantInitialData.rendered_at <
				ssoGrantListUpdatedAtRef.current
			) {
				return;
			}
			setSsoGrants(ssoGrantInitialData.grants);
			ssoGrantListUpdatedAtRef.current = ssoGrantInitialData.rendered_at;
			setSsoGrantsUserId(user.id);
			return;
		}
		if (ssoGrantInitialData !== null) {
			accountStore.shared.ssoGrantInitialData.set(null);
			setSsoGrants([]);
			ssoGrantListUpdatedAtRef.current = Date.now();
			setSsoGrantsUserId(null);
			ssoGrantsFetchRequestedUserIdRef.current = null;
		}
		if (
			ssoGrantsUserId === user.id ||
			ssoGrantsFetchRequestedUserIdRef.current === user.id
		) {
			return;
		}

		ssoGrantsFetchRequestedUserIdRef.current = user.id;
		ssoGrantListUpdatedAtRef.current = Date.now();
		void refreshAccountSsoGrantsForCurrentUser({ silent: true });
	}, [
		bootstrapStatus,
		csrfToken,
		passwordMustChange,
		refreshAccountSsoGrantsForCurrentUser,
		sessionListUpdatedAtRef,
		setAccountSessions,
		setAccountSessionsUserId,
		ssoGrantInitialData,
		ssoGrantsUserId,
		user,
	]);

	const handleRefreshSsoGrants = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account SSO Button',
			'Refresh Grants'
		);
		void refreshAccountSsoGrantsForCurrentUser();
	}, [refreshAccountSsoGrantsForCurrentUser, vibrate]);

	const handleRevokeSsoGrantOpen = useCallback((clientId: string) => {
		setRevokeTargetClientId(clientId);
	}, []);

	const handleRevokeSsoGrantCancel = useCallback(() => {
		setRevokeTargetClientId(null);
	}, []);

	const handleRevokeSsoGrant = useCallback(() => {
		if (
			csrfToken === null ||
			user === null ||
			revokeTargetClientId === null ||
			isSubmitting
		) {
			return;
		}

		vibrate();

		const clientId = revokeTargetClientId;

		trackEvent(
			trackEvent.category.click,
			'Account SSO Button',
			'Revoke Grant',
			clientId
		);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		setRevokeTargetClientId(null);
		setRevokingClientId(clientId);
		setIsSubmitting(true);

		revokeAccountSsoGrant(clientId, csrfToken)
			.then((result) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
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

				setSsoGrants((prev) =>
					prev.filter((grant) => grant.client.id !== clientId)
				);
				ssoGrantListUpdatedAtRef.current = Date.now();
				setMessage('已撤销授权');
			})
			.catch((error: unknown) => {
				if (!checkCurrentAccountAuthContext(expectedAuthContext)) {
					return;
				}

				if (
					handleUnauthorizedAccountError(error, expectedAuthContext)
				) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '撤销授权失败'
				);
			})
			.finally(() => {
				setRevokingClientId(null);
				setIsSubmitting(false);
			});
	}, [
		csrfToken,
		isSubmitting,
		revokeTargetClientId,
		setIsSubmitting,
		setMessage,
		user,
		vibrate,
	]);

	return {
		handleRefreshSsoGrants,
		handleRevokeSsoGrant,
		handleRevokeSsoGrantCancel,
		handleRevokeSsoGrantOpen,
		isSsoGrantListLoading,
		revokeTargetClientId,
		revokingClientId,
		ssoGrants,
		ssoGrantsUserId,
	};
}
