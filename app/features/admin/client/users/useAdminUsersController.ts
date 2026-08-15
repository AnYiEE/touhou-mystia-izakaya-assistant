'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { type TUserStatus } from '@/domain/account/contracts';

import { accountStore } from '@/features/account/client/state/accountStore';
import type {
	IAdminMeData,
	IAdminUserListData,
} from '@/features/account/contracts';
import {
	fetchAdminMe,
	listAdminUsers,
	loginAdmin,
	logoutAdmin,
} from '@/features/admin/client/api';
import { ADMIN_LIST_DEBOUNCE_MS } from '@/features/admin/client/components/filters';
import {
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import type {
	IAdminPageInitialData,
	TAdminAuthStatus,
} from '@/features/admin/contracts';
import { ADMIN_MESSAGE_MAP } from '@/features/admin/copy';
import { getAdminListHref } from '@/features/admin/navigation';
import { trackEvent } from '@/features/analytics/client/trackEvent';

const pageInputRegexp = /^\d*$/u;

export function useAdminUsersController(initialData: IAdminPageInitialData) {
	const router = useRouter();
	const pathname = usePathname();
	const isAdminListPath = pathname === '/admin';

	const accountBootstrapStatus = accountStore.shared.bootstrapStatus.use();
	const accountUser = accountStore.shared.user.use();
	const accountUserId = accountUser?.id ?? null;

	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [adminAuthStatus, setAdminAuthStatus] = useState<TAdminAuthStatus>(
		initialData.authStatus
	);
	const [users, setUsers] = useState<IAdminUserListData | null>(
		initialData.users
	);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.page);
	const [pageInput, setPageInput] = useState(String(initialData.page));
	const [password, setPassword] = useState('');
	const [query, setQuery] = useState(initialData.query);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [status, setStatus] = useState<TUserStatus | ''>(initialData.status);
	const [username, setUsername] = useState('');
	const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
	const [isUsersLoading, setIsUsersLoading] = useState(false);

	const adminAuthRequestIdRef = useRef(0);
	const isAdminListPathRef = useRef(isAdminListPath);
	const isListStateInitializedRef = useRef(false);
	const isServerInitialUsersRef = useRef(initialData.users !== null);
	const lastServerRenderedAtRef = useRef(initialData.renderedAt);
	const queryInputTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);
	const syncedServerQueryInputRef = useRef<string | null>(null);
	const refreshUsersRequestIdRef = useRef(0);
	const skipNextAutoRefreshRef = useRef(false);
	const lastCheckedAccountUserIdRef = useRef<string | null>(accountUserId);
	const trimmedUsername = username.trim();

	const cancelPendingQuerySync = useCallback(() => {
		if (queryInputTimeoutRef.current === null) {
			return;
		}

		clearTimeout(queryInputTimeoutRef.current);
		queryInputTimeoutRef.current = null;
	}, []);

	const refreshUsers = useCallback(
		(overrideQuery?: string, overridePage?: number) => {
			if (!isAdminListPathRef.current) {
				refreshUsersRequestIdRef.current += 1;
				setIsUsersLoading(false);
				return;
			}

			const requestId = refreshUsersRequestIdRef.current + 1;
			refreshUsersRequestIdRef.current = requestId;

			setIsUsersLoading(true);
			setMessage(null);

			void listAdminUsers({
				page: overridePage ?? page,
				query: overrideQuery ?? query,
				status,
			})
				.then((result) => {
					if (refreshUsersRequestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						if (isAdminSessionInvalidResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setAdminAuthStatus('unauthenticated');
							setUsers(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					setUsers(result.data);
					setMessage(null);
				})
				.catch((error: unknown) => {
					if (refreshUsersRequestIdRef.current !== requestId) {
						return;
					}

					setMessage(
						Error.isError(error)
							? error.message
							: ADMIN_MESSAGE_MAP.userListReadFailed
					);
				})
				.finally(() => {
					if (refreshUsersRequestIdRef.current !== requestId) {
						return;
					}

					setIsUsersLoading(false);
				});
		},
		[page, query, status]
	);

	const checkAdminAuth = useCallback(() => {
		const requestId = adminAuthRequestIdRef.current + 1;
		adminAuthRequestIdRef.current = requestId;

		setAdminAuthStatus('checking');
		setMessage(null);

		void fetchAdminMe()
			.then((result) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (isAdminSessionInvalidResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setAdminAuthStatus('unauthenticated');
						return;
					}

					setAdmin(null);
					setAdminAuthStatus('error');
					setMessage(result.displayMessage);
					return;
				}

				accountStore.shared.adminCsrfToken.set(result.data.csrf_token);
				setAdmin(result.data);
				setAdminAuthStatus('authenticated');
			})
			.catch((error: unknown) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setAdmin(null);
				setAdminAuthStatus('error');
				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.adminAuthCheckFailed
				);
			});
	}, []);

	const handleLogin = useCallback(() => {
		if (isAdminActionLoading) {
			return;
		}
		if (trimmedUsername.length === 0) {
			return;
		}

		trackEvent(trackEvent.category.click, 'Admin Auth Button', 'Login');

		const requestId = adminAuthRequestIdRef.current + 1;
		adminAuthRequestIdRef.current = requestId;

		setIsAdminActionLoading(true);
		setMessage(null);

		void loginAdmin({ password, username: trimmedUsername })
			.then((result) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					setMessage(result.displayMessage);
					return;
				}

				accountStore.shared.adminCsrfToken.set(result.data.csrf_token);
				setAdmin(result.data);
				setAdminAuthStatus('authenticated');
				setPassword('');
			})
			.catch((error: unknown) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.adminLoginFailed
				);
			})
			.finally(() => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setIsAdminActionLoading(false);
			});
	}, [isAdminActionLoading, password, trimmedUsername]);

	const handleLogout = useCallback(() => {
		if (admin === null) {
			return;
		}
		if (isAdminActionLoading) {
			return;
		}

		trackEvent(trackEvent.category.click, 'Admin Auth Button', 'Logout');

		const requestId = adminAuthRequestIdRef.current + 1;
		adminAuthRequestIdRef.current = requestId;
		refreshUsersRequestIdRef.current += 1;

		setIsUsersLoading(false);
		setIsAdminActionLoading(true);
		setMessage(null);

		void logoutAdmin(admin.csrf_token)
			.then((result) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (isAdminSessionInvalidResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setAdminAuthStatus('unauthenticated');
						setUsers(null);
						return;
					}

					setMessage(result.displayMessage);
					return;
				}

				clearAdminSession();
				setAdmin(null);
				setAdminAuthStatus('unauthenticated');
				setUsers(null);
			})
			.catch((error: unknown) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.adminLogoutFailed
				);
			})
			.finally(() => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setIsAdminActionLoading(false);
			});
	}, [admin, isAdminActionLoading]);

	const handleQueryInputChange = useCallback((value: string) => {
		setQueryInput(value);
	}, []);

	const handleStatusAction = useCallback((value: TUserStatus | '') => {
		setPage(1);
		setStatus(value);
	}, []);

	const handleRefreshPress = useCallback(() => {
		const nextQuery = queryInput;

		cancelPendingQuerySync();
		skipNextAutoRefreshRef.current = nextQuery !== query || page !== 1;
		setQuery(queryInput);
		setPage(1);
		refreshUsers(nextQuery, 1);
	}, [cancelPendingQuerySync, page, query, queryInput, refreshUsers]);

	const handleLeaveUserList = useCallback(() => {
		refreshUsersRequestIdRef.current += 1;
		setIsUsersLoading(false);
	}, []);

	const handleOpenSsoClientList = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Open List From Users'
		);
		handleLeaveUserList();
	}, [handleLeaveUserList]);

	const handleOpenUserDetail = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin User Detail Button',
			'Open Detail'
		);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((current) => Math.max(1, current - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((current) => current + 1);
	}, []);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();

			const targetPage = Number.parseInt(pageInput, 10);
			if (!Number.isSafeInteger(targetPage) || targetPage < 1) {
				setPageInput(String(page));
				return;
			}

			const maxPage = Math.max(1, users?.total_pages ?? targetPage);
			setPage(Math.min(targetPage, maxPage));
		},
		[page, pageInput, users?.total_pages]
	);

	useEffect(
		() => () => {
			cancelPendingQuerySync();
			refreshUsersRequestIdRef.current += 1;
		},
		[cancelPendingQuerySync]
	);

	useEffect(() => {
		if (lastServerRenderedAtRef.current !== initialData.renderedAt) {
			const shouldSyncQueryInput =
				queryInput === query || queryInput === initialData.query;

			lastServerRenderedAtRef.current = initialData.renderedAt;
			isServerInitialUsersRef.current = initialData.users !== null;
			refreshUsersRequestIdRef.current += 1;

			if (shouldSyncQueryInput) {
				cancelPendingQuerySync();
				syncedServerQueryInputRef.current = initialData.query;
			}

			setAdmin(initialData.admin);
			setAdminAuthStatus(initialData.authStatus);
			setUsers(initialData.users);
			setMessage(initialData.message);
			setPage(initialData.page);
			setPageInput(String(initialData.page));
			setQuery(initialData.query);
			if (shouldSyncQueryInput) {
				setQueryInput(initialData.query);
			}
			setStatus(initialData.status);
			setIsUsersLoading(false);

			if (initialData.admin !== null) {
				accountStore.shared.adminCsrfToken.set(
					initialData.admin.csrf_token
				);
			}
		}
	}, [
		cancelPendingQuerySync,
		initialData.admin,
		initialData.authStatus,
		initialData.message,
		initialData.page,
		initialData.query,
		initialData.renderedAt,
		initialData.status,
		initialData.users,
		query,
		queryInput,
	]);

	useEffect(() => {
		isAdminListPathRef.current = isAdminListPath;

		if (!isAdminListPath) {
			cancelPendingQuerySync();
			refreshUsersRequestIdRef.current += 1;
			setIsUsersLoading(false);
			return;
		}

		setIsUsersLoading(false);
	}, [cancelPendingQuerySync, isAdminListPath]);

	useEffect(() => {
		if (!isAdminListPathRef.current) {
			return;
		}
		if (syncedServerQueryInputRef.current === queryInput) {
			syncedServerQueryInputRef.current = null;
			return;
		}
		syncedServerQueryInputRef.current = null;

		if (!isListStateInitializedRef.current) {
			isListStateInitializedRef.current = true;
			return;
		}

		queryInputTimeoutRef.current = setTimeout(() => {
			queryInputTimeoutRef.current = null;
			if (!isAdminListPathRef.current) {
				return;
			}

			setPage(1);
			setQuery(queryInput);
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			cancelPendingQuerySync();
		};
	}, [cancelPendingQuerySync, queryInput]);

	useEffect(() => {
		if (!isAdminListPath) {
			return;
		}

		const nextHref = getAdminListHref({ page, query, status });
		const currentHref = `${location.pathname}${location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isAdminListPath, page, query, router, status]);

	useEffect(() => {
		setPageInput(String(page));
	}, [page]);

	useEffect(() => {
		if (users === null) {
			return;
		}

		const totalPages = Math.max(1, users.total_pages);
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, users]);

	useEffect(() => {
		if (initialData.authStatus !== 'checking') {
			if (initialData.admin !== null) {
				accountStore.shared.adminCsrfToken.set(
					initialData.admin.csrf_token
				);
			}
			return;
		}

		checkAdminAuth();
	}, [checkAdminAuth, initialData.admin, initialData.authStatus]);

	useEffect(() => {
		if (
			accountBootstrapStatus !== 'loggedIn' ||
			accountUser === null ||
			accountUserId === null
		) {
			lastCheckedAccountUserIdRef.current = null;
			if (
				admin?.auth_source === 'user' &&
				adminAuthStatus !== 'checking'
			) {
				checkAdminAuth();
			}
			return;
		}
		if (
			adminAuthStatus === 'checking' ||
			lastCheckedAccountUserIdRef.current === accountUserId ||
			admin?.auth_source === 'credentials'
		) {
			return;
		}
		if (
			admin?.auth_source === 'user' &&
			admin.username === accountUser.username
		) {
			lastCheckedAccountUserIdRef.current = accountUserId;
			return;
		}

		lastCheckedAccountUserIdRef.current = accountUserId;
		checkAdminAuth();
	}, [
		accountBootstrapStatus,
		accountUser,
		accountUserId,
		admin,
		adminAuthStatus,
		checkAdminAuth,
	]);

	useEffect(() => {
		if (admin !== null) {
			return;
		}

		const handleWindowFocus = () => {
			if (adminAuthStatus === 'checking') {
				return;
			}

			checkAdminAuth();
		};
		const handleVisibilityChange = () => {
			if (
				document.visibilityState !== 'visible' ||
				adminAuthStatus === 'checking'
			) {
				return;
			}

			checkAdminAuth();
		};

		globalThis.addEventListener('focus', handleWindowFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			globalThis.removeEventListener('focus', handleWindowFocus);
			document.removeEventListener(
				'visibilitychange',
				handleVisibilityChange
			);
		};
	}, [admin, adminAuthStatus, checkAdminAuth]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialUsersRef.current) {
				isServerInitialUsersRef.current = false;
			} else if (skipNextAutoRefreshRef.current) {
				skipNextAutoRefreshRef.current = false;
			} else {
				timeoutId = setTimeout(() => {
					refreshUsers();
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
		};
	}, [admin, refreshUsers]);

	return {
		admin,
		adminAuthStatus,
		checkAdminAuth,
		handleLeaveUserList,
		handleLogin,
		handleLogout,
		handleNextPage,
		handleOpenSsoClientList,
		handleOpenUserDetail,
		handlePageInputChange,
		handlePageJumpSubmit,
		handlePreviousPage,
		handleQueryInputChange,
		handleRefreshPress,
		handleStatusAction,
		isAdminActionLoading,
		isUsersLoading,
		message,
		page,
		pageInput,
		password,
		query,
		queryInput,
		setPassword,
		setUsername,
		status,
		trimmedUsername,
		username,
		users,
	};
}
