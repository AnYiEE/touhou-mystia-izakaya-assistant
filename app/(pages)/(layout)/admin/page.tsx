'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowRightFromBracket,
	faChevronDown,
	faClock,
	faKey,
	faMagnifyingGlass,
	faRotate,
	faShieldHalved,
	faUser,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import TimeAgo from '@/components/timeAgo';
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
import { accountStore } from '@/stores/account';
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
	getAdminStatusLabel,
} from './components';

const statusOptions: Array<{ label: string; value: TUserStatus | 'all' }> = [
	{ label: '全部状态', value: 'all' },
	{ label: '正常', value: 'active' },
	{ label: '禁用', value: 'disabled' },
	{ label: '已删除', value: 'deleted' },
];

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;

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

export default function AdminPage() {
	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [adminAuthStatus, setAdminAuthStatus] =
		useState<TAdminAuthStatus>('checking');
	const [users, setUsers] = useState<IAdminUserListData | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [password, setPassword] = useState('');
	const [query, setQuery] = useState('');
	const [queryInput, setQueryInput] = useState('');
	const [status, setStatus] = useState<TUserStatus | ''>('');
	const [username, setUsername] = useState('');
	const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);
	const [isUsersLoading, setIsUsersLoading] = useState(false);
	const adminAuthRequestIdRef = useRef(0);
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

	useEffect(() => {
		const timeoutId = globalThis.setTimeout(() => {
			setPage(1);
			setQuery(queryInput);
		}, 300);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [queryInput]);

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
					<AdminPanel className="flex items-center gap-3 text-sm text-foreground-500">
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
				<div className="grid gap-4 lg:grid-cols-[minmax(0,32rem)_minmax(18rem,1fr)]">
					<AdminPanel className="space-y-4">
						<AdminPanelTitle icon={faUser}>
							管理员凭据
						</AdminPanelTitle>
						<Input
							autoComplete="username"
							label="管理员用户名"
							startContent={<AdminInputIcon icon={faUser} />}
							value={username}
							onValueChange={setUsername}
						/>
						<Input
							autoComplete="current-password"
							label="管理员密码"
							startContent={<AdminInputIcon icon={faKey} />}
							type="password"
							value={password}
							onValueChange={setPassword}
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
							onPress={() => {
								if (isAdminActionLoading) {
									return;
								}
								if (trimmedUsername.length === 0) {
									return;
								}

								const requestId =
									adminAuthRequestIdRef.current + 1;
								adminAuthRequestIdRef.current = requestId;
								setIsAdminActionLoading(true);
								setMessage(null);
								void loginAdmin({
									password,
									username: trimmedUsername,
								})
									.then((data) => {
										if (
											adminAuthRequestIdRef.current !==
											requestId
										) {
											return;
										}

										accountStore.shared.adminCsrfToken.set(
											data.csrf_token
										);
										setAdmin(data);
										setAdminAuthStatus('authenticated');
										setPassword('');
									})
									.catch((error: unknown) => {
										if (
											adminAuthRequestIdRef.current !==
											requestId
										) {
											return;
										}

										setMessage(
											error instanceof Error
												? error.message
												: '管理员登录失败'
										);
									})
									.finally(() => {
										if (
											adminAuthRequestIdRef.current !==
											requestId
										) {
											return;
										}

										setIsAdminActionLoading(false);
									});
							}}
						>
							登录
						</Button>
						{message !== null && <AdminMessage message={message} />}
					</AdminPanel>

					<AdminPanel className="grid content-start gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
						<AdminMetric label="会话" value="受保护" />
						<AdminMetric label="入口" value="账号后台" />
						<AdminMetric label="范围" value="用户数据" />
					</AdminPanel>
				</div>
			</AdminShell>
		);
	}

	const userCount = users?.users.length ?? 0;
	const pageSize = users?.page_size ?? 0;
	const canGoNext = users !== null && users.users.length >= users.page_size;
	const statusFilterKey = getStatusFilterKey(status);
	const statusFilterLabel = getFilterStatusLabel(status);

	return (
		<AdminShell>
			<AdminHeader
				actions={
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
						onPress={() => {
							if (isAdminActionLoading) {
								return;
							}

							const requestId = adminAuthRequestIdRef.current + 1;
							adminAuthRequestIdRef.current = requestId;
							refreshUsersRequestIdRef.current += 1;
							setIsUsersLoading(false);
							setIsAdminActionLoading(true);
							setMessage(null);
							void logoutAdmin(admin.csrf_token)
								.then(() => {
									if (
										adminAuthRequestIdRef.current !==
										requestId
									) {
										return;
									}

									clearAdminSession();
									setAdmin(null);
									setAdminAuthStatus('unauthenticated');
									setUsers(null);
								})
								.catch((error: unknown) => {
									if (
										adminAuthRequestIdRef.current !==
										requestId
									) {
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
											: '退出管理员失败'
									);
								})
								.finally(() => {
									if (
										adminAuthRequestIdRef.current !==
										requestId
									) {
										return;
									}

									setIsAdminActionLoading(false);
								});
						}}
					>
						退出管理员
					</Button>
				}
				icon={faUsers}
				title="用户管理"
			/>

			<AdminPanel className="grid gap-4 sm:grid-cols-3">
				<AdminMetric
					label="本页用户"
					value={
						users === null ? '读取中' : `${userCount} / ${pageSize}`
					}
				/>
				<AdminMetric
					label="页码"
					value={`第 ${users?.page ?? page} 页`}
				/>
				<AdminMetric label="筛选状态" value={statusFilterLabel} />
			</AdminPanel>

			<AdminPanel className="space-y-4">
				<AdminPanelTitle icon={faMagnifyingGlass}>筛选</AdminPanelTitle>
				<div className="grid w-full items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_6.5rem]">
					<Input
						aria-label="搜索用户名"
						classNames={{ inputWrapper: 'h-12 min-h-12' }}
						placeholder="搜索用户名"
						startContent={
							<AdminInputIcon icon={faMagnifyingGlass} />
						}
						value={queryInput}
						onValueChange={(value) => {
							setQueryInput(value);
						}}
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
								<span className="text-sm">
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
							onAction={(key) => {
								setPage(1);
								setStatus(
									key === 'all' ? '' : (key as TUserStatus)
								);
							}}
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
						onPress={() => {
							const nextQuery = queryInput;
							const shouldRefreshImmediately =
								nextQuery === query && page === 1;

							setQuery(queryInput);
							setPage(1);
							if (shouldRefreshImmediately) {
								refreshUsers(nextQuery, 1);
							}
						}}
					>
						刷新
					</Button>
				</div>
			</AdminPanel>

			{message !== null && <AdminMessage message={message} />}

			{users === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取用户列表
				</AdminEmptyState>
			) : users.users.length === 0 ? (
				<AdminEmptyState icon={faUsers}>没有匹配的用户</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<th className={tableHeadCellClassName}>用户名</th>
							<th className={tableHeadCellClassName}>状态</th>
							<th className={tableHeadCellClassName}>创建时间</th>
							<th className={tableHeadCellClassName}>最近登录</th>
							<th
								className={cn(
									tableHeadCellClassName,
									'text-right'
								)}
							>
								操作
							</th>
						</tr>
					</AdminTableHeader>
					<tbody>
						{users.users.map((user) => (
							<AdminTableRow key={user.id}>
								<td
									className={cn(
										tableCellClassName,
										'w-72 max-w-72'
									)}
								>
									<div className="min-w-0 max-w-64">
										<p className="truncate text-sm font-medium leading-5 text-foreground-800">
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
										<span className="text-foreground-400">
											无
										</span>
									) : (
										<TimeAgo
											timestamp={user.last_login_at}
										/>
									)}
								</td>
								<td
									className={cn(
										tableNowrapCellClassName,
										'text-right'
									)}
								>
									<Link
										animationUnderline={false}
										href={`/admin/users/${encodeURIComponent(user.id)}`}
										className="rounded-small px-2 py-1 text-sm text-primary-600 transition-background hover:bg-primary/15 motion-reduce:transition-none dark:text-primary"
									>
										详情
									</Link>
								</td>
							</AdminTableRow>
						))}
					</tbody>
				</AdminTable>
			)}

			<div className="flex flex-wrap items-center justify-between gap-3 rounded-small border border-default-200/80 bg-default-50/50 px-3 py-2 text-sm text-foreground-500 dark:bg-default-100/10">
				<span>
					第 {users?.page ?? page} 页
					{users !== null && ` · 每页 ${users.page_size}`}
				</span>
				<div className="flex items-center gap-2">
					<Button
						isDisabled={page <= 1 || isUsersLoading}
						size="sm"
						variant="flat"
						onPress={() => {
							setPage((current) => Math.max(1, current - 1));
						}}
					>
						上一页
					</Button>
					<Button
						isDisabled={isUsersLoading || !canGoNext}
						size="sm"
						variant="flat"
						onPress={() => {
							setPage((current) => current + 1);
						}}
					>
						下一页
					</Button>
				</div>
			</div>
		</AdminShell>
	);
}
