'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@heroui/input';

import Heading from '@/components/heading';
import TimeAgo from '@/components/timeAgo';
import { Button, Link } from '@/design/ui/components';
import {
	AccountApiError,
	type IAdminMeData,
	type IAdminUserListData,
	fetchAdminMe,
	listAdminUsers,
	loginAdmin,
	logoutAdmin,
} from '@/lib/account/client/api';
import { type TUserStatus } from '@/lib/account/shared/types';
import { accountStore } from '@/stores/account';

const statusOptions: Array<{ label: string; value: TUserStatus | '' }> = [
	{ label: '全部状态', value: '' },
	{ label: '正常', value: 'active' },
	{ label: '禁用', value: 'disabled' },
	{ label: '已删除', value: 'deleted' },
];

type TAdminAuthStatus =
	| 'authenticated'
	| 'checking'
	| 'error'
	| 'unauthenticated';

function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

function checkAdminSessionUnauthorized(error: unknown) {
	return error instanceof AccountApiError && error.status === 401;
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
	const [isLoading, setIsLoading] = useState(false);
	const adminAuthRequestIdRef = useRef(0);
	const refreshUsersRequestIdRef = useRef(0);
	const trimmedUsername = username.trim();

	const refreshUsers = useCallback(
		(overrideQuery?: string, overridePage?: number) => {
			const requestId = refreshUsersRequestIdRef.current + 1;
			refreshUsersRequestIdRef.current = requestId;
			setIsLoading(true);
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

					setIsLoading(false);
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
				<div className="min-h-main-content space-y-4">
					<Heading isFirst>管理员</Heading>
					<p className="text-sm text-foreground-500">
						正在检查管理员登录状态
					</p>
				</div>
			);
		}

		if (adminAuthStatus === 'error') {
			return (
				<div className="min-h-main-content space-y-4">
					<Heading isFirst>管理员</Heading>
					{message !== null && (
						<p className="text-sm text-foreground-500">{message}</p>
					)}
					<Button variant="flat" onPress={checkAdminAuth}>
						重试
					</Button>
				</div>
			);
		}

		return (
			<div className="min-h-main-content space-y-4">
				<Heading isFirst>管理员</Heading>
				<div className="w-full space-y-3 lg:w-1/2">
					<Input
						label="管理员用户名"
						value={username}
						onValueChange={setUsername}
					/>
					<Input
						label="管理员密码"
						type="password"
						value={password}
						onValueChange={setPassword}
					/>
					<Button
						color="primary"
						isDisabled={
							isLoading ||
							trimmedUsername.length === 0 ||
							password.length === 0
						}
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							if (isLoading) {
								return;
							}
							if (trimmedUsername.length === 0) {
								return;
							}

							const requestId = adminAuthRequestIdRef.current + 1;
							adminAuthRequestIdRef.current = requestId;
							setIsLoading(true);
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

									setIsLoading(false);
								});
						}}
					>
						登录
					</Button>
				</div>
				{message !== null && (
					<p className="text-sm text-foreground-500">{message}</p>
				)}
			</div>
		);
	}

	return (
		<div className="min-h-main-content space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Heading isFirst>管理员</Heading>
				<Button
					isDisabled={isLoading}
					isLoading={isLoading}
					variant="flat"
					onPress={() => {
						if (isLoading) {
							return;
						}

						const requestId = adminAuthRequestIdRef.current + 1;
						adminAuthRequestIdRef.current = requestId;
						refreshUsersRequestIdRef.current += 1;
						setIsLoading(true);
						setMessage(null);
						void logoutAdmin(admin.csrf_token)
							.then(() => {
								if (
									adminAuthRequestIdRef.current !== requestId
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
									adminAuthRequestIdRef.current !== requestId
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
									adminAuthRequestIdRef.current !== requestId
								) {
									return;
								}

								setIsLoading(false);
							});
					}}
				>
					退出管理员
				</Button>
			</div>
			<div className="grid w-full gap-2 lg:w-2/3 lg:grid-cols-[1fr_12rem_auto]">
				<Input
					label="搜索用户名"
					value={queryInput}
					onValueChange={(value) => {
						setQueryInput(value);
					}}
				/>
				<label className="flex flex-col gap-1 text-sm text-foreground-500">
					<span>状态</span>
					<select
						value={status}
						onChange={(event) => {
							setPage(1);
							setStatus(event.target.value as TUserStatus | '');
						}}
						className="h-12 rounded-medium bg-default-100 px-3 text-foreground outline-none"
					>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<Button
					color="primary"
					isLoading={isLoading}
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
			{message !== null && (
				<p className="text-sm text-foreground-500">{message}</p>
			)}
			<div className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-foreground-500">
						<tr>
							<th className="py-2 pr-4">用户名</th>
							<th className="py-2 pr-4">状态</th>
							<th className="py-2 pr-4">创建时间</th>
							<th className="py-2 pr-4">最近登录</th>
							<th className="py-2 pr-4">操作</th>
						</tr>
					</thead>
					<tbody>
						{users?.users.map((user) => (
							<tr
								key={user.id}
								className="border-t border-default-200"
							>
								<td className="py-2 pr-4">{user.username}</td>
								<td className="py-2 pr-4">{user.status}</td>
								<td className="py-2 pr-4">
									<TimeAgo timestamp={user.created_at} />
								</td>
								<td className="py-2 pr-4">
									{user.last_login_at === null ? (
										'无'
									) : (
										<TimeAgo
											timestamp={user.last_login_at}
										/>
									)}
								</td>
								<td className="py-2 pr-4">
									<Link href={`/admin/users/${user.id}`}>
										详情
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="flex items-center gap-2 text-sm text-foreground-500">
				<Button
					isDisabled={page <= 1 || isLoading}
					variant="flat"
					onPress={() => {
						setPage((current) => Math.max(1, current - 1));
					}}
				>
					上一页
				</Button>
				<span>第 {users?.page ?? page} 页</span>
				<Button
					isDisabled={
						isLoading ||
						users === null ||
						users.users.length < users.page_size
					}
					variant="flat"
					onPress={() => {
						setPage((current) => current + 1);
					}}
				>
					下一页
				</Button>
			</div>
		</div>
	);
}
