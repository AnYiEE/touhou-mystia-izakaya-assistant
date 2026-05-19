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

function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

function checkAdminSessionUnauthorized(error: unknown) {
	return error instanceof AccountApiError && error.status === 401;
}

export default function AdminPage() {
	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [users, setUsers] = useState<IAdminUserListData | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [page, setPage] = useState(1);
	const [password, setPassword] = useState('');
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<TUserStatus | ''>('');
	const [username, setUsername] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const refreshUsersRequestIdRef = useRef(0);

	const refreshUsers = useCallback(() => {
		const requestId = refreshUsersRequestIdRef.current + 1;
		refreshUsersRequestIdRef.current = requestId;
		setIsLoading(true);
		setMessage(null);
		void listAdminUsers({ page, query, status })
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
					setUsers(null);
				}
				setMessage(
					error instanceof Error ? error.message : '读取用户列表失败'
				);
			})
			.finally(() => {
				if (refreshUsersRequestIdRef.current !== requestId) {
					return;
				}

				setIsLoading(false);
			});
	}, [page, query, status]);

	useEffect(() => {
		void fetchAdminMe()
			.then((data) => {
				accountStore.shared.adminCsrfToken.set(data.csrf_token);
				setAdmin(data);
			})
			.catch(() => {
				clearAdminSession();
				setAdmin(null);
			});
	}, []);

	useEffect(() => {
		if (admin !== null) {
			refreshUsers();
		}
	}, [admin, refreshUsers]);

	if (admin === null) {
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
							username.length === 0 || password.length === 0
						}
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							setIsLoading(true);
							setMessage(null);
							void loginAdmin({ password, username })
								.then((data) => {
									accountStore.shared.adminCsrfToken.set(
										data.csrf_token
									);
									setAdmin(data);
									setPassword('');
								})
								.catch((error: unknown) => {
									setMessage(
										error instanceof Error
											? error.message
											: '管理员登录失败'
									);
								})
								.finally(() => {
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
					variant="flat"
					onPress={() => {
						refreshUsersRequestIdRef.current += 1;
						void logoutAdmin(admin.csrf_token).finally(() => {
							clearAdminSession();
							setAdmin(null);
							setIsLoading(false);
							setMessage(null);
							setUsers(null);
						});
					}}
				>
					退出管理员
				</Button>
			</div>
			<div className="grid w-full gap-2 lg:w-2/3 lg:grid-cols-[1fr_12rem_auto]">
				<Input
					label="搜索用户名"
					value={query}
					onValueChange={(value) => {
						setPage(1);
						setQuery(value);
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
					onPress={refreshUsers}
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
