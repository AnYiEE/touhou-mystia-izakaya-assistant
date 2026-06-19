'use client';

import {
	type Key,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faBullhorn,
	faChevronDown,
	faClock,
	faKey,
	faMagnifyingGlass,
	faRotate,
	faServer,
	faShieldHalved,
	faUser,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Input,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminEmptyState,
	AdminEntityCell,
	AdminErrorRetryState,
	AdminFilterPanel,
	AdminHeader,
	AdminHeaderActionLink,
	AdminInputIcon,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminMutedText,
	AdminPagination,
	AdminPanel,
	AdminPanelTitle,
	AdminSearchInput,
	AdminShell,
	AdminStatusBadge,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
	getAdminStatusLabel,
} from './components';
import {
	type IAdminListLocationState,
	getAdminListHref,
	getAdminUserDetailHref,
} from './listState';

import {
	type TAdminApiResult,
	fetchAdminMe,
	listAdminUsers,
	loginAdmin,
	logoutAdmin,
} from './api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import {
	type IAdminMeData,
	type IAdminUserListData,
	type TUserStatus,
} from '@/lib/account/shared/types';
import { accountStore as store } from '@/stores';

const statusOptions: Array<{ label: string; value: TUserStatus | 'all' }> = [
	{ label: '全部状态', value: 'all' },
	{ label: '正常', value: 'active' },
	{ label: '已禁用', value: 'disabled' },
	{ label: '已删除', value: 'deleted' },
];

const pageInputRegexp = /^\d*$/u;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

export type TAdminAuthStatus =
	| 'authenticated'
	| 'checking'
	| 'error'
	| 'unauthenticated';

export interface IAdminPageInitialData {
	admin: IAdminMeData | null;
	authStatus: TAdminAuthStatus;
	message: string | null;
	page: number;
	query: string;
	renderedAt: number;
	status: TUserStatus | '';
	users: IAdminUserListData | null;
}

function getFilterStatusLabel(status: TUserStatus | '') {
	return status === '' ? '全部状态' : getAdminStatusLabel(status);
}

function getStatusFilterKey(status: TUserStatus | '') {
	return status === '' ? 'all' : status;
}

interface IAdminLoginPanelProps {
	isAdminActionLoading: boolean;
	message: string | null;
	onLogin: () => void;
	onPasswordChange: (value: string) => void;
	onUsernameChange: (value: string) => void;
	password: string;
	trimmedUsername: string;
	username: string;
}

const AdminLoginPanel = memo<IAdminLoginPanelProps>(function AdminLoginPanel({
	isAdminActionLoading,
	message,
	onLogin,
	onPasswordChange,
	onUsernameChange,
	password,
	trimmedUsername,
	username,
}) {
	return (
		<AdminPanel className="space-y-4">
			<AdminPanelTitle icon={faUser}>管理员凭据</AdminPanelTitle>
			<Input
				autoComplete="username"
				label="管理员用户名"
				startContent={<AdminInputIcon icon={faUser} />}
				value={username}
				onValueChange={onUsernameChange}
			/>
			<Input
				autoComplete="current-password"
				label="管理员密码"
				startContent={<AdminInputIcon icon={faKey} />}
				type="password"
				value={password}
				onValueChange={onPasswordChange}
			/>
			<Button
				fullWidth
				color="primary"
				isDisabled={
					isAdminActionLoading ||
					trimmedUsername.length === 0 ||
					password.length === 0
				}
				isLoading={isAdminActionLoading}
				startContent={
					isAdminActionLoading ? null : (
						<FontAwesomeIcon
							icon={faShieldHalved}
							className="w-3.5"
						/>
					)
				}
				variant="flat"
				onPress={onLogin}
			>
				登录
			</Button>
			{message !== null && <AdminMessage message={message} />}
		</AdminPanel>
	);
});

interface IAdminUserMetricsProps {
	page: number;
	pageSize: number;
	statusFilterLabel: string;
	totalCount: number | null;
	totalPages: number | null;
	userCount: number;
	users: IAdminUserListData | null;
}

const AdminUserMetrics = memo<IAdminUserMetricsProps>(
	function AdminUserMetrics({
		page,
		pageSize,
		statusFilterLabel,
		totalCount,
		totalPages,
		userCount,
		users,
	}) {
		return (
			<AdminMetricPanel className="sm:grid-cols-2 lg:grid-cols-4">
				<AdminMetric
					label="用户总数"
					value={
						users === null ? '读取中' : `${totalCount ?? userCount}`
					}
				/>
				<AdminMetric
					label="页码"
					value={
						users === null
							? `第${page}页`
							: `第${users.page} / ${Math.max(1, totalPages ?? 0)}页`
					}
				/>
				<AdminMetric
					label="本页用户"
					value={
						users === null ? '读取中' : `${userCount} / ${pageSize}`
					}
				/>
				<AdminMetric label="筛选状态" value={statusFilterLabel} />
			</AdminMetricPanel>
		);
	}
);

interface IAdminUserFilterPanelProps {
	isUsersLoading: boolean;
	onQueryInputChange: (value: string) => void;
	onRefresh: () => void;
	onStatusAction: (key: Key) => void;
	queryInput: string;
	statusFilterKey: string;
	statusFilterLabel: string;
}

const AdminUserFilterPanel = memo<IAdminUserFilterPanelProps>(
	function AdminUserFilterPanel({
		isUsersLoading,
		onQueryInputChange,
		onRefresh,
		onStatusAction,
		queryInput,
		statusFilterKey,
		statusFilterLabel,
	}) {
		return (
			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索用户名或用户ID"
					icon={faMagnifyingGlass}
					placeholder="搜索用户名或用户ID"
					value={queryInput}
					onValueChange={onQueryInputChange}
				/>
				<Dropdown showArrow>
					<DropdownTrigger>
						<Button
							className="h-12 min-h-12 w-full min-w-0 gap-2 px-3 md:w-auto md:flex-none"
							endContent={
								<FontAwesomeIcon
									icon={faChevronDown}
									className="w-3 text-default-500"
								/>
							}
							variant="flat"
						>
							<span className="text-small">
								{statusFilterLabel}
							</span>
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						disallowEmptySelection
						aria-label="筛选用户状态"
						selectedKeys={[statusFilterKey]}
						selectionMode="single"
						variant="flat"
						itemClasses={{
							base: 'transition-background motion-reduce:transition-none',
						}}
						onAction={onStatusAction}
					>
						{statusOptions.map((option) => (
							<DropdownItem
								key={option.value}
								textValue={option.label}
							>
								{option.label}
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
				<Button
					className="h-12 min-h-12 w-full md:w-auto md:flex-none"
					color="primary"
					isLoading={isUsersLoading}
					startContent={
						isUsersLoading ? null : (
							<FontAwesomeIcon
								icon={faRotate}
								className="w-3.5"
							/>
						)
					}
					variant="flat"
					onPress={onRefresh}
				>
					刷新
				</Button>
			</AdminFilterPanel>
		);
	}
);

interface IAdminUserListRowProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	user: IAdminUserListData['users'][number];
}

const AdminUserListRow = memo<IAdminUserListRowProps>(
	function AdminUserListRow({
		initialNowTimestamp,
		listLocationState,
		onOpenUserDetail,
		user,
	}) {
		return (
			<AdminTableRow>
				<AdminTableCell className="w-72 max-w-72">
					<AdminEntityCell
						className="max-w-64"
						id={user.id}
						title={user.nickname ?? user.username}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<AdminStatusBadge status={user.status} />
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<TimeAgo
						initialNowTimestamp={initialNowTimestamp}
						timestamp={user.created_at}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{user.last_login_at === null ? (
						<AdminMutedText>无</AdminMutedText>
					) : (
						<TimeAgo
							initialNowTimestamp={initialNowTimestamp}
							timestamp={user.last_login_at}
						/>
					)}
				</AdminTableCell>
				<AdminTableCell isNowrap className="text-right">
					<AdminTableActionLink
						href={getAdminUserDetailHref(
							user.id,
							listLocationState
						)}
						onPress={onOpenUserDetail}
					>
						详情
					</AdminTableActionLink>
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

interface IAdminUserTableProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData;
}

const AdminUserTable = memo<IAdminUserTableProps>(function AdminUserTable({
	initialNowTimestamp,
	listLocationState,
	onOpenUserDetail,
	users,
}) {
	return (
		<AdminTable>
			<AdminTableHeader>
				<tr>
					<AdminTableHeadCell>用户名</AdminTableHeadCell>
					<AdminTableHeadCell>状态</AdminTableHeadCell>
					<AdminTableHeadCell>创建时间</AdminTableHeadCell>
					<AdminTableHeadCell>最近登录</AdminTableHeadCell>
					<AdminTableHeadCell className="text-right">
						操作
					</AdminTableHeadCell>
				</tr>
			</AdminTableHeader>
			<tbody>
				{users.users.map((user) => (
					<AdminUserListRow
						key={user.id}
						initialNowTimestamp={initialNowTimestamp}
						listLocationState={listLocationState}
						onOpenUserDetail={onOpenUserDetail}
						user={user}
					/>
				))}
			</tbody>
		</AdminTable>
	);
});

interface IAdminUserListContentProps {
	initialNowTimestamp: number;
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData | null;
}

const AdminUserListContent = memo<IAdminUserListContentProps>(
	function AdminUserListContent({
		initialNowTimestamp,
		listLocationState,
		onOpenUserDetail,
		users,
	}) {
		if (users === null) {
			return (
				<AdminEmptyState icon={faClock}>
					正在读取用户列表
				</AdminEmptyState>
			);
		}

		if (users.users.length === 0) {
			return (
				<AdminEmptyState icon={faUsers}>没有匹配的用户</AdminEmptyState>
			);
		}

		return (
			<AdminUserTable
				initialNowTimestamp={initialNowTimestamp}
				listLocationState={listLocationState}
				onOpenUserDetail={onOpenUserDetail}
				users={users}
			/>
		);
	}
);

export default function AdminPageClient({
	initialData,
}: {
	initialData: IAdminPageInitialData;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const isAdminListPath = pathname === '/admin';

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
	const queryInputTimeoutRef = useRef<ReturnType<
		typeof globalThis.setTimeout
	> | null>(null);
	const syncedServerQueryInputRef = useRef<string | null>(null);
	const refreshUsersRequestIdRef = useRef(0);
	const skipNextAutoRefreshRef = useRef(false);
	const trimmedUsername = username.trim();

	const cancelPendingQuerySync = useCallback(() => {
		if (queryInputTimeoutRef.current === null) {
			return;
		}

		globalThis.clearTimeout(queryInputTimeoutRef.current);
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
						if (checkAdminUnauthorizedActionResult(result)) {
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
						error instanceof Error
							? error.message
							: '读取用户列表失败'
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
					if (checkAdminUnauthorizedActionResult(result)) {
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

				store.shared.adminCsrfToken.set(result.data.csrf_token);
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
					error instanceof Error
						? error.message
						: '检查管理员登录状态失败'
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

				store.shared.adminCsrfToken.set(result.data.csrf_token);
				setAdmin(result.data);
				setAdminAuthStatus('authenticated');
				setPassword('');
			})
			.catch((error: unknown) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				setMessage(
					error instanceof Error ? error.message : '管理员登录失败'
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
					if (checkAdminUnauthorizedActionResult(result)) {
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
					error instanceof Error ? error.message : '退出管理员失败'
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

	const handleStatusAction = useCallback((key: Key) => {
		setPage(1);
		setStatus(key === 'all' ? '' : (key as TUserStatus));
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
			lastServerRenderedAtRef.current = initialData.renderedAt;
			isServerInitialUsersRef.current = initialData.users !== null;
			syncedServerQueryInputRef.current = initialData.query;
			refreshUsersRequestIdRef.current += 1;

			cancelPendingQuerySync();
			setAdmin(initialData.admin);
			setAdminAuthStatus(initialData.authStatus);
			setUsers(initialData.users);
			setMessage(initialData.message);
			setPage(initialData.page);
			setPageInput(String(initialData.page));
			setQuery(initialData.query);
			setQueryInput(initialData.query);
			setStatus(initialData.status);
			setIsUsersLoading(false);

			if (initialData.admin !== null) {
				store.shared.adminCsrfToken.set(initialData.admin.csrf_token);
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

		queryInputTimeoutRef.current = globalThis.setTimeout(() => {
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
		const currentHref = `${globalThis.location.pathname}${globalThis.location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			globalThis.clearTimeout(timeoutId);
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
				store.shared.adminCsrfToken.set(initialData.admin.csrf_token);
			}
			return;
		}

		checkAdminAuth();
	}, [checkAdminAuth, initialData.admin, initialData.authStatus]);

	useEffect(() => {
		let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialUsersRef.current) {
				isServerInitialUsersRef.current = false;
			} else if (skipNextAutoRefreshRef.current) {
				skipNextAutoRefreshRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshUsers();
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, refreshUsers]);

	if (admin === null) {
		if (adminAuthStatus === 'checking') {
			return (
				<AdminLoadingState
					icon={faShieldHalved}
					label="读取会话状态"
					subtitle="正在校验管理员会话"
					title="管理员"
				/>
			);
		}

		if (adminAuthStatus === 'error') {
			return (
				<AdminErrorRetryState
					icon={faShieldHalved}
					message={message}
					subtitle="管理员会话检查失败"
					title="管理员"
					onRetry={checkAdminAuth}
				/>
			);
		}

		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="账号后台控制台"
					title="管理员登录"
				/>
				<AdminLoginPanel
					isAdminActionLoading={isAdminActionLoading}
					message={message}
					password={password}
					trimmedUsername={trimmedUsername}
					username={username}
					onLogin={handleLogin}
					onPasswordChange={setPassword}
					onUsernameChange={setUsername}
				/>
			</AdminShell>
		);
	}

	const userCount = users?.users.length ?? 0;
	const pageSize = users?.page_size ?? 0;
	const totalCount = users?.total_count ?? null;
	const totalPages = users?.total_pages ?? null;
	const listLocationState = { page, query, status };
	const statusFilterKey = getStatusFilterKey(status);
	const statusFilterLabel = getFilterStatusLabel(status);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
							onPress={handleLeaveUserList}
						>
							站点通知
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/sso"
							icon={faServer}
							onPress={handleOpenSsoClientList}
						>
							SSO客户端
						</AdminHeaderActionLink>
						<Button
							isDisabled={isAdminActionLoading}
							isLoading={isAdminActionLoading}
							startContent={
								isAdminActionLoading ? null : (
									<FontAwesomeIcon
										icon={faArrowRightFromBracket}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={handleLogout}
						>
							退出管理员
						</Button>
					</>
				}
				icon={faUsers}
				title="用户管理"
			/>

			<AdminUserMetrics
				page={page}
				pageSize={pageSize}
				statusFilterLabel={statusFilterLabel}
				totalCount={totalCount}
				totalPages={totalPages}
				userCount={userCount}
				users={users}
			/>

			<AdminUserFilterPanel
				isUsersLoading={isUsersLoading}
				queryInput={queryInput}
				statusFilterKey={statusFilterKey}
				statusFilterLabel={statusFilterLabel}
				onQueryInputChange={handleQueryInputChange}
				onRefresh={handleRefreshPress}
				onStatusAction={handleStatusAction}
			/>

			{message !== null && <AdminMessage message={message} />}

			<AdminUserListContent
				initialNowTimestamp={initialData.renderedAt}
				listLocationState={listLocationState}
				onOpenUserDetail={handleOpenUserDetail}
				users={users}
			/>

			<AdminPagination
				currentPage={users?.page ?? page}
				isLoading={isUsersLoading}
				pageInput={pageInput}
				pageSize={users?.page_size}
				totalCount={users?.total_count}
				totalLabel="个用户"
				totalPages={Math.max(1, users?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
