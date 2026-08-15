'use client';

import {
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { accountStore } from '@/features/account/client/state/accountStore';
import type {
	IAdminMeData,
	IAdminSsoUserClientGrant,
	IAdminSsoUserGrantsData,
	IAdminUserDetailData,
} from '@/features/account/contracts';
import {
	listAdminUserSsoGrants,
	revokeAdminUserSsoGrant,
	revokeAdminUserSsoGrants,
} from '@/features/account/sso/admin/client/api/grants';
import {
	clearAdminUserData,
	deleteAdminUserSessions,
	disableAdminUser,
	enableAdminUser,
	fetchAdminMe,
	refreshAdminUserDetail,
	resetAdminUserPassword,
	restoreAdminUser,
} from '@/features/admin/client/api';
import { ADMIN_LIST_DEBOUNCE_MS } from '@/features/admin/client/components/filters';
import {
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import type {
	IAdminUserDetailInitialData,
	TAdminUserDetailApiResult,
} from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	createAdminSsoGrantRevokeAllSuccessMessage,
	createAdminSuccessWithDetailRefreshFailureMessage,
} from '@/features/admin/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import type { TAdminUserDetailConfirmAction } from './contracts';

const pageInputRegexp = /^\d*$/u;

export function useAdminUserDetailController(
	initialData: IAdminUserDetailInitialData
) {
	const id = initialData.userId;

	const adminListHref = initialData.listHref;

	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);

	const [detail, setDetail] = useState<IAdminUserDetailData | null>(
		initialData.detail
	);

	const [message, setMessage] = useState<string | null>(initialData.message);

	const [password, setPassword] = useState('');

	const [confirmAction, setConfirmAction] =
		useState<TAdminUserDetailConfirmAction>(null);

	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);

	const [isLoading, setIsLoading] = useState(false);

	const [ssoGrantPage, setSsoGrantPage] = useState(
		initialData.ssoGrants?.page ?? 1
	);

	const [ssoGrantPageInput, setSsoGrantPageInput] = useState(
		String(initialData.ssoGrants?.page ?? 1)
	);

	const [ssoGrantPageSize, setSsoGrantPageSize] = useState<
		number | undefined
	>(initialData.ssoGrants?.page_size);

	const [ssoGrantQuery, setSsoGrantQuery] = useState('');

	const [ssoGrantTotalCount, setSsoGrantTotalCount] = useState<
		number | undefined
	>(initialData.ssoGrants?.total_count);

	const [ssoGrantTotalPages, setSsoGrantTotalPages] = useState(
		Math.max(1, initialData.ssoGrants?.total_pages ?? 1)
	);

	const [ssoGrants, setSsoGrants] = useState<IAdminSsoUserClientGrant[]>(
		initialData.ssoGrants?.grants ?? []
	);

	const [isSsoGrantLoading, setIsSsoGrantLoading] = useState(false);

	const [revokingSsoClientId, setRevokingSsoClientId] = useState<
		string | null
	>(null);

	const [isRevokingAllSsoGrants, setIsRevokingAllSsoGrants] = useState(false);

	const detailRequestIdRef = useRef(0);

	const ssoGrantRequestIdRef = useRef(0);

	const ssoGrantMutationRequestIdRef = useRef(0);

	const detailMutationInFlightRef = useRef(false);

	const ssoGrantMutationInFlightRef = useRef(false);

	const isServerInitialDetailRef = useRef(initialData.isDetailServerLoaded);

	const hasRequestedInitialSsoGrantsRef = useRef(
		initialData.ssoGrants !== null
	);

	const ssoGrantQueryTimeoutRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null);

	const adminCsrfToken = admin?.csrf_token;

	const createDetailRequestId = useCallback(() => {
		detailRequestIdRef.current += 1;
		return detailRequestIdRef.current;
	}, []);

	const checkDetailRequestId = useCallback(
		(requestId: number) => detailRequestIdRef.current === requestId,
		[]
	);

	const createSsoGrantRequestId = useCallback(() => {
		ssoGrantRequestIdRef.current += 1;
		return ssoGrantRequestIdRef.current;
	}, []);

	const checkSsoGrantRequestId = useCallback(
		(requestId: number) => ssoGrantRequestIdRef.current === requestId,
		[]
	);

	const createSsoGrantMutationRequestId = useCallback(() => {
		ssoGrantMutationRequestIdRef.current += 1;
		return ssoGrantMutationRequestIdRef.current;
	}, []);

	const checkSsoGrantMutationRequestId = useCallback(
		(requestId: number) =>
			ssoGrantMutationRequestIdRef.current === requestId,
		[]
	);

	const cancelPendingSsoGrantQueryRefresh = useCallback(() => {
		if (ssoGrantQueryTimeoutRef.current === null) {
			return;
		}

		clearTimeout(ssoGrantQueryTimeoutRef.current);
		ssoGrantQueryTimeoutRef.current = null;
	}, []);

	const handleActionError = useCallback(
		(error: Extract<TAdminUserDetailApiResult, { status: 'error' }>) => {
			if (isAdminSessionInvalidResult(error)) {
				clearAdminSession();
				setAdmin(null);
				setDetail(null);
			}

			setMessage(error.displayMessage);
		},
		[]
	);

	const refreshDetail = useCallback(() => {
		setIsLoading(true);
		setConfirmAction(null);
		setMessage(null);

		const requestId = createDetailRequestId();
		return refreshAdminUserDetail(id)
			.then((result) => {
				if (!checkDetailRequestId(requestId)) {
					return false;
				}
				if (result.status === 'ok') {
					setDetail(result.detail);
					setMessage(null);
					return true;
				}

				handleActionError(result);
				return false;
			})
			.catch((error: unknown) => {
				if (!checkDetailRequestId(requestId)) {
					return false;
				}
				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.userDetailReadFailed
				);
				return false;
			})
			.finally(() => {
				if (checkDetailRequestId(requestId)) {
					setIsLoading(false);
				}
			});
	}, [checkDetailRequestId, createDetailRequestId, handleActionError, id]);

	const runAction = useCallback(
		(
			action: () => Promise<TAdminUserDetailApiResult>,
			success: string,
			onSuccess?: () => void
		) => {
			if (detailMutationInFlightRef.current) {
				return;
			}

			detailMutationInFlightRef.current = true;
			setIsLoading(true);
			setConfirmAction(null);
			setMessage(null);

			const requestId = createDetailRequestId();
			void action()
				.then((result) => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						handleActionError(result);
						return;
					}
					if (result.status === 'mutation-committed-detail-error') {
						onSuccess?.();
						setMessage(
							createAdminSuccessWithDetailRefreshFailureMessage(
								success,
								result.detailError.displayMessage
							)
						);
						return;
					}

					onSuccess?.();
					setDetail(result.detail);
					setMessage(success);
				})
				.catch((error: unknown) => {
					if (!checkDetailRequestId(requestId)) {
						return;
					}
					setMessage(
						Error.isError(error)
							? error.message
							: ADMIN_MESSAGE_MAP.operationFailed
					);
				})
				.finally(() => {
					detailMutationInFlightRef.current = false;
					if (checkDetailRequestId(requestId)) {
						setIsLoading(false);
					}
				});
		},
		[checkDetailRequestId, createDetailRequestId, handleActionError]
	);

	const handleResetPassword = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Reset Password'
		);

		runAction(
			() => resetAdminUserPassword(id, { password }, adminCsrfToken),
			'密码已重置',
			() => {
				setPassword('');
			}
		);
	}, [adminCsrfToken, id, password, runAction]);

	const handleEnableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Enable User'
		);

		runAction(() => enableAdminUser(id, adminCsrfToken), '用户已启用');
	}, [adminCsrfToken, id, runAction]);

	const handleRestoreUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Restore User'
		);

		runAction(
			() => restoreAdminUser(id, adminCsrfToken),
			'账号已恢复为禁用状态'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleDisableUser = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Disable User'
		);

		runAction(() => disableAdminUser(id, adminCsrfToken), '用户已禁用');
	}, [adminCsrfToken, id, runAction]);

	const handleDeleteUserSessions = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Delete Sessions'
		);

		runAction(
			() => deleteAdminUserSessions(id, adminCsrfToken),
			'已踢出全部设备'
		);
	}, [adminCsrfToken, id, runAction]);

	const handleClearUserData = useCallback(() => {
		if (adminCsrfToken === undefined) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Clear Data'
		);

		runAction(
			() => clearAdminUserData(id, adminCsrfToken),
			'账号数据已清空'
		);
	}, [adminCsrfToken, id, runAction]);

	const applySsoGrantData = useCallback((data: IAdminSsoUserGrantsData) => {
		setSsoGrants(data.grants);
		setSsoGrantPage(data.page);
		setSsoGrantPageSize(data.page_size);
		setSsoGrantTotalCount(data.total_count);
		setSsoGrantTotalPages(Math.max(1, data.total_pages));
	}, []);

	const requestSsoGrants = useCallback(
		(nextPage: number, nextQuery: string) => {
			if (admin === null) {
				return;
			}

			setIsSsoGrantLoading(true);
			setMessage(null);

			const requestId = createSsoGrantRequestId();
			void listAdminUserSsoGrants(id, {
				page: nextPage,
				query: nextQuery.trim(),
			})
				.then((result) => {
					if (!checkSsoGrantRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						if (isAdminSessionInvalidResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setDetail(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					applySsoGrantData(result.data);
				})
				.catch((error: unknown) => {
					if (!checkSsoGrantRequestId(requestId)) {
						return;
					}
					setMessage(
						Error.isError(error)
							? error.message
							: ADMIN_MESSAGE_MAP.ssoGrantReadFailed
					);
				})
				.finally(() => {
					if (checkSsoGrantRequestId(requestId)) {
						setIsSsoGrantLoading(false);
					}
				});
		},
		[
			admin,
			applySsoGrantData,
			checkSsoGrantRequestId,
			createSsoGrantRequestId,
			id,
		]
	);

	const refreshSsoGrants = useCallback(
		(nextPage = ssoGrantPage) => {
			requestSsoGrants(nextPage, ssoGrantQuery);
		},
		[requestSsoGrants, ssoGrantPage, ssoGrantQuery]
	);

	const handleSsoGrantQueryChange = useCallback(
		(value: string) => {
			setSsoGrantQuery(value);
			cancelPendingSsoGrantQueryRefresh();

			if (admin === null || detail?.user.id !== id) {
				return;
			}

			ssoGrantQueryTimeoutRef.current = setTimeout(() => {
				ssoGrantQueryTimeoutRef.current = null;
				requestSsoGrants(1, value);
			}, ADMIN_LIST_DEBOUNCE_MS);
		},
		[admin, cancelPendingSsoGrantQueryRefresh, detail, id, requestSsoGrants]
	);

	const handleRevokeAllSsoGrants = useCallback(() => {
		if (
			adminCsrfToken === undefined ||
			ssoGrantMutationInFlightRef.current
		) {
			return;
		}

		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Revoke All Grants',
			id
		);

		setIsRevokingAllSsoGrants(true);
		ssoGrantMutationInFlightRef.current = true;
		setConfirmAction(null);
		setMessage(null);

		const requestId = createSsoGrantMutationRequestId();
		void revokeAdminUserSsoGrants(id, adminCsrfToken)
			.then((result) => {
				if (!checkSsoGrantMutationRequestId(requestId)) {
					return;
				}
				if (result.status === 'error') {
					if (isAdminSessionInvalidResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setDetail(null);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				setMessage(
					createAdminSsoGrantRevokeAllSuccessMessage(
						result.data.revoked_count
					)
				);
				refreshSsoGrants(1);
			})
			.catch((error: unknown) => {
				if (!checkSsoGrantMutationRequestId(requestId)) {
					return;
				}
				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.ssoGrantRevokeAllFailed
				);
			})
			.finally(() => {
				ssoGrantMutationInFlightRef.current = false;
				if (checkSsoGrantMutationRequestId(requestId)) {
					setIsRevokingAllSsoGrants(false);
				}
			});
	}, [
		adminCsrfToken,
		checkSsoGrantMutationRequestId,
		createSsoGrantMutationRequestId,
		id,
		refreshSsoGrants,
	]);

	const handleRefreshDetail = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin User Action Button',
			'Refresh Detail'
		);
		void refreshDetail().then((shouldRefreshSsoGrants) => {
			if (shouldRefreshSsoGrants) {
				refreshSsoGrants(1);
			}
		});
	}, [refreshDetail, refreshSsoGrants]);

	const handlePreviousSsoGrantPage = useCallback(() => {
		refreshSsoGrants(Math.max(1, ssoGrantPage - 1));
	}, [refreshSsoGrants, ssoGrantPage]);

	const handleNextSsoGrantPage = useCallback(() => {
		refreshSsoGrants(ssoGrantPage + 1);
	}, [refreshSsoGrants, ssoGrantPage]);

	const handleSsoGrantPageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setSsoGrantPageInput(value);
		}
	}, []);

	const handleSsoGrantPageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();

			const targetPage = Number.parseInt(ssoGrantPageInput, 10);
			if (!Number.isSafeInteger(targetPage) || targetPage < 1) {
				setSsoGrantPageInput(String(ssoGrantPage));
				return;
			}

			refreshSsoGrants(Math.min(targetPage, ssoGrantTotalPages));
		},
		[refreshSsoGrants, ssoGrantPage, ssoGrantPageInput, ssoGrantTotalPages]
	);

	const handleRevokeSsoGrant = useCallback(
		(clientId: string) => {
			if (
				adminCsrfToken === undefined ||
				ssoGrantMutationInFlightRef.current
			) {
				return;
			}

			trackEvent(
				trackEvent.category.click,
				'Admin User Action Button',
				'Revoke Grant',
				`${id}:${clientId}`
			);

			setRevokingSsoClientId(clientId);
			ssoGrantMutationInFlightRef.current = true;
			setConfirmAction(null);
			setMessage(null);

			const requestId = createSsoGrantMutationRequestId();
			void revokeAdminUserSsoGrant(id, clientId, adminCsrfToken)
				.then((result) => {
					if (!checkSsoGrantMutationRequestId(requestId)) {
						return;
					}
					if (result.status === 'error') {
						if (isAdminSessionInvalidResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setDetail(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					setMessage(ADMIN_MESSAGE_MAP.ssoGrantRevoked);
					refreshSsoGrants(ssoGrantPage);
				})
				.catch((error: unknown) => {
					if (!checkSsoGrantMutationRequestId(requestId)) {
						return;
					}
					setMessage(
						Error.isError(error)
							? error.message
							: ADMIN_MESSAGE_MAP.ssoGrantRevokeFailed
					);
				})
				.finally(() => {
					ssoGrantMutationInFlightRef.current = false;
					if (checkSsoGrantMutationRequestId(requestId)) {
						setRevokingSsoClientId(null);
					}
				});
		},
		[
			adminCsrfToken,
			checkSsoGrantMutationRequestId,
			createSsoGrantMutationRequestId,
			id,
			refreshSsoGrants,
			ssoGrantPage,
		]
	);

	useEffect(
		() => () => {
			cancelPendingSsoGrantQueryRefresh();
			detailRequestIdRef.current += 1;
			ssoGrantRequestIdRef.current += 1;
			ssoGrantMutationRequestIdRef.current += 1;
		},
		[cancelPendingSsoGrantQueryRefresh]
	);

	useEffect(() => {
		if (initialData.admin !== null) {
			accountStore.shared.adminCsrfToken.set(
				initialData.admin.csrf_token
			);
			setIsAuthLoading(false);
			return;
		}

		let isMounted = true;
		void fetchAdminMe()
			.then((result) => {
				if (!isMounted) {
					return;
				}
				if (result.status === 'error') {
					if (isAdminSessionInvalidResult(result)) {
						clearAdminSession();
						setAdmin(null);
					} else {
						setMessage(result.displayMessage);
					}
					return;
				}

				accountStore.shared.adminCsrfToken.set(result.data.csrf_token);
				setAdmin(result.data);
			})
			.catch((error: unknown) => {
				if (!isMounted) {
					return;
				}
				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.adminStateReadFailed
				);
			})
			.finally(() => {
				if (isMounted) {
					setIsAuthLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [initialData.admin]);

	useEffect(() => {
		if (admin !== null) {
			if (isServerInitialDetailRef.current) {
				isServerInitialDetailRef.current = false;
				return;
			}

			setDetail(null);
			setMessage(null);
			setPassword('');
			void refreshDetail();
		}
	}, [admin, id, refreshDetail]);

	useEffect(() => {
		if (
			!hasRequestedInitialSsoGrantsRef.current &&
			initialData.ssoGrants === null &&
			admin !== null &&
			detail !== null &&
			detail.user.id === id
		) {
			hasRequestedInitialSsoGrantsRef.current = true;
			refreshSsoGrants(1);
		}
	}, [admin, detail, id, initialData.ssoGrants, refreshSsoGrants]);

	useEffect(() => {
		if (admin === null || detail?.user.id !== id) {
			cancelPendingSsoGrantQueryRefresh();
		}
	}, [admin, cancelPendingSsoGrantQueryRefresh, detail, id]);

	useEffect(() => {
		setSsoGrantPageInput(String(ssoGrantPage));
	}, [ssoGrantPage]);

	return {
		admin,
		adminListHref,
		confirmAction,
		detail,
		handleClearUserData,
		handleDeleteUserSessions,
		handleDisableUser,
		handleEnableUser,
		handleNextSsoGrantPage,
		handlePreviousSsoGrantPage,
		handleRefreshDetail,
		handleResetPassword,
		handleRestoreUser,
		handleRevokeAllSsoGrants,
		handleRevokeSsoGrant,
		handleSsoGrantPageInputChange,
		handleSsoGrantPageJumpSubmit,
		handleSsoGrantQueryChange,
		id,
		isAuthLoading,
		isLoading,
		isRevokingAllSsoGrants,
		isSsoGrantLoading,
		message,
		password,
		revokingSsoClientId,
		setConfirmAction,
		setPassword,
		ssoGrantPage,
		ssoGrantPageInput,
		ssoGrantPageSize,
		ssoGrantQuery,
		ssoGrants,
		ssoGrantTotalCount,
		ssoGrantTotalPages,
	};
}
