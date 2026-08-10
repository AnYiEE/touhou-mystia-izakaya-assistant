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
	refreshAccountSessions,
	revokeAccountSession,
} from '@/features/account/client/api';
import { checkCurrentAccountAuthContext } from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';
import type {
	IAccountSessionInitialData,
	IAccountSessionRecord,
	IAccountUserProfile,
} from '@/features/account/contracts';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import {
	type IAccountActionController,
	handleUnauthorizedAccountActionError,
	handleUnauthorizedAccountError,
} from './controller';
import { ACCOUNT_MANAGER_MESSAGE_MAP } from './copy';

interface IUseAccountSessionsOptions {
	bootstrapStatus: ReturnType<typeof accountStore.shared.bootstrapStatus.get>;
	controller: IAccountActionController;
	csrfToken: string | null;
	passwordMustChange: boolean;
	sessionInitialData: IAccountSessionInitialData | null;
	user: IAccountUserProfile | null;
	vibrate: () => void;
}

interface IUseAccountSessionsResult {
	accountSessions: IAccountSessionRecord[];
	accountSessionsUserId: string | null;
	handleRefreshSessions: () => void;
	handleRevokeSession: () => void;
	handleRevokeSessionCancel: () => void;
	handleRevokeSessionOpen: (sessionId: string) => void;
	isSessionListLoading: boolean;
	revokeTargetSessionId: string | null;
	revokingSessionId: string | null;
	sessionListUpdatedAtRef: RefObject<number>;
	setAccountSessions: Dispatch<SetStateAction<IAccountSessionRecord[]>>;
	setAccountSessionsUserId: Dispatch<SetStateAction<string | null>>;
}

export function useAccountSessions(
	options: IUseAccountSessionsOptions
): IUseAccountSessionsResult {
	const {
		bootstrapStatus,
		controller: { isSubmitting, setIsSubmitting, setMessage },
		csrfToken,
		passwordMustChange,
		sessionInitialData,
		user,
		vibrate,
	} = options;
	const [isSessionListLoading, setIsSessionListLoading] = useState(false);

	const [accountSessions, setAccountSessions] = useState<
		IAccountSessionRecord[]
	>([]);

	const [accountSessionsUserId, setAccountSessionsUserId] = useState<
		string | null
	>(null);

	const [revokeTargetSessionId, setRevokeTargetSessionId] = useState<
		string | null
	>(null);

	const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
		null
	);

	const sessionListUpdatedAtRef = useRef(0);

	const sessionListRequestIdRef = useRef(0);

	const sessionsFetchRequestedUserIdRef = useRef<string | null>(null);

	const refreshAccountSessionsForCurrentUser = useCallback(
		({ silent = false }: { silent?: boolean } = {}) => {
			if (user === null || csrfToken === null || passwordMustChange) {
				sessionListRequestIdRef.current += 1;
				setIsSessionListLoading(false);
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				return Promise.resolve(false);
			}

			const userId = user.id;
			const expectedUserContext = { expectedUserId: userId };
			const requestId = sessionListRequestIdRef.current + 1;
			sessionListRequestIdRef.current = requestId;
			setIsSessionListLoading(true);
			const isLatestRequest = () =>
				sessionListRequestIdRef.current === requestId;
			const isCurrentUserRequest = () =>
				isLatestRequest() &&
				accountStore.shared.user.get()?.id === userId &&
				!accountStore.shared.passwordMustChange.get();

			return refreshAccountSessions()
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

					setAccountSessions(result.data.sessions);
					sessionListUpdatedAtRef.current = Date.now();
					setAccountSessionsUserId(userId);
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

					console.warn('Failed to list account sessions.', {
						errorCode: getLogSafeErrorCode(error),
					});
					if (!silent) {
						setMessage(
							Error.isError(error)
								? error.message
								: ACCOUNT_MANAGER_MESSAGE_MAP.sessionRefreshFailed
						);
					}

					return false;
				})
				.finally(() => {
					if (isLatestRequest()) {
						setIsSessionListLoading(false);
					}
				});
		},
		[csrfToken, passwordMustChange, setMessage, user]
	);

	useEffect(() => {
		if (user === null || csrfToken === null || passwordMustChange) {
			sessionsFetchRequestedUserIdRef.current = null;
			sessionListRequestIdRef.current += 1;
			setIsSessionListLoading(false);
			if (
				bootstrapStatus === 'anonymous' ||
				bootstrapStatus === 'loggedIn' ||
				passwordMustChange
			) {
				setAccountSessions([]);
				sessionListUpdatedAtRef.current = Date.now();
				setAccountSessionsUserId(null);
				accountStore.shared.sessionInitialData.set(null);
			}
			return;
		}
		if (sessionInitialData?.user_id === user.id) {
			accountStore.shared.sessionInitialData.set(null);
			sessionsFetchRequestedUserIdRef.current = user.id;
			if (
				sessionInitialData.rendered_at < sessionListUpdatedAtRef.current
			) {
				return;
			}
			setAccountSessions(sessionInitialData.sessions);
			sessionListUpdatedAtRef.current = sessionInitialData.rendered_at;
			setAccountSessionsUserId(user.id);
			return;
		}
		if (sessionInitialData !== null) {
			accountStore.shared.sessionInitialData.set(null);
			setAccountSessions([]);
			sessionListUpdatedAtRef.current = Date.now();
			setAccountSessionsUserId(null);
			sessionsFetchRequestedUserIdRef.current = null;
		}
		if (
			accountSessionsUserId === user.id ||
			sessionsFetchRequestedUserIdRef.current === user.id
		) {
			return;
		}

		sessionsFetchRequestedUserIdRef.current = user.id;
		sessionListUpdatedAtRef.current = Date.now();
		void refreshAccountSessionsForCurrentUser({ silent: true });
	}, [
		accountSessionsUserId,
		bootstrapStatus,
		csrfToken,
		passwordMustChange,
		refreshAccountSessionsForCurrentUser,
		sessionInitialData,
		user,
	]);

	const handleRefreshSessions = useCallback(() => {
		vibrate();
		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Refresh Sessions'
		);
		void refreshAccountSessionsForCurrentUser();
	}, [refreshAccountSessionsForCurrentUser, vibrate]);

	const handleRevokeSessionOpen = useCallback((sessionId: string) => {
		setRevokeTargetSessionId(sessionId);
	}, []);

	const handleRevokeSessionCancel = useCallback(() => {
		setRevokeTargetSessionId(null);
	}, []);

	const handleRevokeSession = useCallback(() => {
		if (
			csrfToken === null ||
			user === null ||
			revokeTargetSessionId === null ||
			isSubmitting
		) {
			return;
		}

		vibrate();

		const sessionId = revokeTargetSessionId;

		trackEvent(
			trackEvent.category.click,
			'Account Auth Button',
			'Revoke Session'
		);

		const expectedAuthContext = {
			expectedCsrfToken: csrfToken,
			expectedUserId: user.id,
		};
		setRevokeTargetSessionId(null);
		setRevokingSessionId(sessionId);
		setIsSubmitting(true);
		setMessage(null);

		revokeAccountSession(sessionId, csrfToken)
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

				setAccountSessions((prev) =>
					prev.filter((session) => session.id !== sessionId)
				);
				sessionListUpdatedAtRef.current = Date.now();
				setMessage(ACCOUNT_MANAGER_MESSAGE_MAP.sessionRevoked);
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
					Error.isError(error)
						? error.message
						: ACCOUNT_MANAGER_MESSAGE_MAP.sessionRevokeFailed
				);
			})
			.finally(() => {
				setRevokingSessionId(null);
				setIsSubmitting(false);
			});
	}, [
		csrfToken,
		isSubmitting,
		revokeTargetSessionId,
		setIsSubmitting,
		setMessage,
		user,
		vibrate,
	]);

	return {
		accountSessions,
		accountSessionsUserId,
		handleRefreshSessions,
		handleRevokeSession,
		handleRevokeSessionCancel,
		handleRevokeSessionOpen,
		isSessionListLoading,
		revokeTargetSessionId,
		revokingSessionId,
		sessionListUpdatedAtRef,
		setAccountSessions,
		setAccountSessionsUserId,
	};
}
