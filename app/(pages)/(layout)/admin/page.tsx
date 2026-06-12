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

import { useRouter, useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
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
	Link,
	cn,
} from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';
import {
	AdminEmptyState,
	AdminHeader,
	AdminInputIcon,
	AdminMessage,
	AdminMetric,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
	AdminStatusBadge,
	AdminTable,
	AdminTableHeader,
	AdminTableRow,
	type IAdminListLocationState,
	getAdminListHref,
	getAdminListPageFromSearchValue,
	getAdminListStatusFromSearchValue,
	getAdminStatusLabel,
	getAdminUserDetailHref,
} from './components';

import {
	type IAdminMeData,
	type IAdminUserListData,
	fetchAdminMe,
	listAdminUsers,
	loginAdmin,
	logoutAdmin,
} from '@/lib/account/client/api';
import {
	checkAdminSessionUnauthorized,
	clearAdminSession,
} from '@/lib/account/client/adminSession';
import { type TUserStatus } from '@/lib/account/shared/types';
import { accountStore, globalStore } from '@/stores';

const statusOptions: Array<{ label: string; value: TUserStatus | 'all' }> = [
	{ label: '全部状态', value: 'all' },
	{ label: '正常', value: 'active' },
	{ label: '禁用', value: 'disabled' },
	{ label: '已删除', value: 'deleted' },
];

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;
const pageInputRegexp = /^\d*$/u;

type TAdminAuthStatus =
	| 'authenticated'
	| 'checking'
	| 'error'
	| 'unauthenticated';

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
			<AdminPanel className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
			</AdminPanel>
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
			<AdminPanel>
				<AdminPanelTitle icon={faMagnifyingGlass}>筛选</AdminPanelTitle>
				<div className="grid w-full items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_6.5rem]">
					<Input
						aria-label="搜索用户名或用户ID"
						classNames={{ inputWrapper: 'h-12 min-h-12' }}
						placeholder="搜索用户名或用户ID"
						startContent={
							<AdminInputIcon icon={faMagnifyingGlass} />
						}
						value={queryInput}
						onValueChange={onQueryInputChange}
					/>
					<Dropdown showArrow>
						<DropdownTrigger>
							<Button
								className="h-12 min-h-12 min-w-0 gap-2 px-3"
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
						className="h-12 min-h-12 w-full"
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
				</div>
			</AdminPanel>
		);
	}
);

interface IAdminUserListRowProps {
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	user: IAdminUserListData['users'][number];
}

const AdminUserListRow = memo<IAdminUserListRowProps>(
	function AdminUserListRow({ listLocationState, onOpenUserDetail, user }) {
		return (
			<AdminTableRow>
				<td className={cn(tableCellClassName, 'w-72 max-w-72')}>
					<div className="min-w-0 max-w-64">
						<p className="truncate text-small font-medium leading-5 text-foreground-800">
							{user.username}
						</p>
						<p className="truncate font-mono text-[0.7rem] leading-4 text-foreground-400">
							{user.id}
						</p>
					</div>
				</td>
				<td className={tableNowrapCellClassName}>
					<AdminStatusBadge status={user.status} />
				</td>
				<td className={tableNowrapCellClassName}>
					<TimeAgo timestamp={user.created_at} />
				</td>
				<td className={tableNowrapCellClassName}>
					{user.last_login_at === null ? (
						<span className="text-foreground-400">无</span>
					) : (
						<TimeAgo timestamp={user.last_login_at} />
					)}
				</td>
				<td className={cn(tableNowrapCellClassName, 'text-right')}>
					<Link
						animationUnderline={false}
						href={getAdminUserDetailHref(
							user.id,
							listLocationState
						)}
						className="rounded-small px-2 py-1 text-small text-primary-600 transition-background hover:bg-primary/15 motion-reduce:transition-none dark:text-primary"
						onPress={onOpenUserDetail}
					>
						详情
					</Link>
				</td>
			</AdminTableRow>
		);
	}
);

interface IAdminUserTableProps {
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData;
}

const AdminUserTable = memo<IAdminUserTableProps>(function AdminUserTable({
	listLocationState,
	onOpenUserDetail,
	users,
}) {
	return (
		<AdminTable>
			<AdminTableHeader>
				<tr>
					<th className={tableHeadCellClassName}>用户名</th>
					<th className={tableHeadCellClassName}>状态</th>
					<th className={tableHeadCellClassName}>创建时间</th>
					<th className={tableHeadCellClassName}>最近登录</th>
					<th className={cn(tableHeadCellClassName, 'text-right')}>
						操作
					</th>
				</tr>
			</AdminTableHeader>
			<tbody>
				{users.users.map((user) => (
					<AdminUserListRow
						key={user.id}
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
	listLocationState: IAdminListLocationState;
	onOpenUserDetail: () => void;
	users: IAdminUserListData | null;
}

const AdminUserListContent = memo<IAdminUserListContentProps>(
	function AdminUserListContent({
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
				listLocationState={listLocationState}
				onOpenUserDetail={onOpenUserDetail}
				users={users}
			/>
		);
	}
);

interface IAdminPaginationProps {
	isUsersLoading: boolean;
	onNextPage: () => void;
	onPageInputChange: (value: string) => void;
	onPageJumpSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
	onPreviousPage: () => void;
	page: number;
	pageInput: string;
	users: IAdminUserListData | null;
}

const AdminPagination = memo<IAdminPaginationProps>(function AdminPagination({
	isUsersLoading,
	onNextPage,
	onPageInputChange,
	onPageJumpSubmit,
	onPreviousPage,
	page,
	pageInput,
	users,
}) {
	const isHighAppearance = globalStore.persistence.highAppearance.use();
	const currentPage = users?.page ?? page;
	const totalPages = Math.max(1, users?.total_pages ?? page);
	const totalCount = users?.total_count ?? null;

	return (
		<div
			className={cn(
				'flex flex-wrap items-center justify-between gap-3 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500',
				isHighAppearance
					? 'bg-content1/40 backdrop-blur'
					: 'bg-default-50/50 dark:bg-default-100/10'
			)}
		>
			<span>
				第{currentPage} / {totalPages}页
				{users !== null &&
					` · 每页${users.page_size} · 共${totalCount ?? 0}个用户`}
			</span>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					isDisabled={page <= 1 || isUsersLoading}
					size="sm"
					variant="flat"
					onPress={onPreviousPage}
				>
					上一页
				</Button>
				<Button
					isDisabled={isUsersLoading || currentPage >= totalPages}
					size="sm"
					variant="flat"
					onPress={onNextPage}
				>
					下一页
				</Button>
				<form
					className="flex items-center gap-2"
					onSubmit={onPageJumpSubmit}
				>
					<Input
						aria-label="跳转页码"
						className="w-20"
						classNames={{
							input: 'text-center',
							inputWrapper: 'h-8 min-h-8',
						}}
						inputMode="numeric"
						placeholder="页码"
						size="sm"
						value={pageInput}
						onValueChange={onPageInputChange}
					/>
					<Button
						isDisabled={isUsersLoading || pageInput.length === 0}
						size="sm"
						type="submit"
						variant="light"
					>
						跳转
					</Button>
				</form>
			</div>
		</div>
	);
});

export default function AdminPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const initialPage = getAdminListPageFromSearchValue(
		searchParams.get('page')
	);
	const initialQuery = searchParams.get('query') ?? '';
	const initialStatus = getAdminListStatusFromSearchValue(
		searchParams.get('status')
	);

	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [adminAuthStatus, setAdminAuthStatus] =
		useState<TAdminAuthStatus>('checking');
	const [users, setUsers] = useState<IAdminUserListData | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [page, setPage] = useState(initialPage);
	const [pageInput, setPageInput] = useState(String(initialPage));
	const [password, setPassword] = useState('');
	const [query, setQuery] = useState(initialQuery);
	const [queryInput, setQueryInput] = useState(initialQuery);
	const [status, setStatus] = useState<TUserStatus | ''>(initialStatus);
	const [username, setUsername] = useState('');
	const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
	const [isUsersLoading, setIsUsersLoading] = useState(false);

	const adminAuthRequestIdRef = useRef(0);
	const isListStateInitializedRef = useRef(false);
	const refreshUsersRequestIdRef = useRef(0);
	const trimmedUsername = username.trim();

	const refreshUsers = useCallback(
		(overrideQuery?: string, overridePage?: number) => {
			const requestId = refreshUsersRequestIdRef.current + 1;
			refreshUsersRequestIdRef.current = requestId;

			setIsUsersLoading(true);
			setMessage(null);

			void listAdminUsers({
				page: overridePage ?? page,
				query: overrideQuery ?? query,
				status,
			})
				.then((data) => {
					if (refreshUsersRequestIdRef.current !== requestId) {
						return;
					}

					setUsers(data);
					setMessage(null);
				})
				.catch((error: unknown) => {
					if (refreshUsersRequestIdRef.current !== requestId) {
						return;
					}
					if (checkAdminSessionUnauthorized(error)) {
						clearAdminSession();
						setAdmin(null);
						setAdminAuthStatus('unauthenticated');
						setUsers(null);
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
			.then((data) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				accountStore.shared.adminCsrfToken.set(data.csrf_token);
				setAdmin(data);
				setAdminAuthStatus('authenticated');
			})
			.catch((error: unknown) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setAdminAuthStatus('unauthenticated');
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
			.then((data) => {
				if (adminAuthRequestIdRef.current !== requestId) {
					return;
				}

				accountStore.shared.adminCsrfToken.set(data.csrf_token);
				setAdmin(data);
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
			.then(() => {
				if (adminAuthRequestIdRef.current !== requestId) {
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

				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setAdminAuthStatus('unauthenticated');
					setUsers(null);
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
		const shouldRefreshImmediately = nextQuery === query && page === 1;

		setQuery(queryInput);
		setPage(1);

		if (shouldRefreshImmediately) {
			refreshUsers(nextQuery, 1);
		}
	}, [page, query, queryInput, refreshUsers]);

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

	useEffect(() => {
		if (!isListStateInitializedRef.current) {
			isListStateInitializedRef.current = true;
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			setPage(1);
			setQuery(queryInput);
		}, 300);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [queryInput]);

	useEffect(() => {
		router.replace(getAdminListHref({ page, query, status }), {
			scroll: false,
		});
	}, [page, query, router, status]);

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
		checkAdminAuth();
	}, [checkAdminAuth]);

	useEffect(() => {
		if (admin !== null) {
			refreshUsers();
		}
	}, [admin, refreshUsers]);

	if (admin === null) {
		if (adminAuthStatus === 'checking') {
			return (
				<AdminShell>
					<AdminHeader
						icon={faShieldHalved}
						subtitle="正在校验管理员会话"
						title="管理员"
					/>
					<AdminPanel className="flex items-center gap-3 text-small text-foreground-500">
						<Button isLoading variant="flat">
							加载中
						</Button>
						<span>读取会话状态</span>
					</AdminPanel>
				</AdminShell>
			);
		}

		if (adminAuthStatus === 'error') {
			return (
				<AdminShell>
					<AdminHeader
						actions={
							<Button
								color="primary"
								startContent={
									<FontAwesomeIcon
										icon={faRotate}
										className="w-3.5"
									/>
								}
								variant="flat"
								onPress={checkAdminAuth}
							>
								重试
							</Button>
						}
						icon={faShieldHalved}
						subtitle="管理员会话检查失败"
						title="管理员"
					/>
					{message !== null && <AdminMessage message={message} />}
				</AdminShell>
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
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin/sso"
							startContent={
								<FontAwesomeIcon
									icon={faServer}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							SSO客户端
						</Button>
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
				listLocationState={listLocationState}
				onOpenUserDetail={handleOpenUserDetail}
				users={users}
			/>

			<AdminPagination
				isUsersLoading={isUsersLoading}
				page={page}
				pageInput={pageInput}
				users={users}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
