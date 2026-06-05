'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@heroui/input';
import { useParams } from 'next/navigation';

import Heading from '@/components/heading';
import TimeAgo from '@/components/timeAgo';
import { Button, Link } from '@/design/ui/components';
import {
	AccountApiError,
	type IAdminMeData,
	type IAdminUserDetailData,
	deleteAdminUserSessions,
	disableAdminUser,
	enableAdminUser,
	fetchAdminMe,
	fetchAdminUser,
	resetAdminUserPassword,
} from '@/lib/account/client/api';
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from '@/lib/account/shared/constants';
import { accountStore } from '@/stores/account';

function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

function checkPasswordLength(password: string) {
	return (
		password.length >= PASSWORD_MIN_LENGTH &&
		password.length <= PASSWORD_MAX_LENGTH
	);
}

function checkAdminSessionUnauthorized(error: unknown) {
	return error instanceof AccountApiError && error.status === 401;
}

export default function AdminUserDetailPage() {
	const { id } = useParams<{ id: string }>();
	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [detail, setDetail] = useState<IAdminUserDetailData | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [password, setPassword] = useState('');
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const detailRequestIdRef = useRef(0);

	const createDetailRequestId = useCallback(() => {
		detailRequestIdRef.current += 1;
		return detailRequestIdRef.current;
	}, []);
	const checkDetailRequestId = useCallback(
		(requestId: number) => detailRequestIdRef.current === requestId,
		[]
	);

	const refreshDetail = useCallback(() => {
		const requestId = createDetailRequestId();
		setIsLoading(true);
		setMessage(null);
		void fetchAdminUser(id)
			.then((data) => {
				if (checkDetailRequestId(requestId)) {
					setDetail(data);
					setMessage(null);
				}
			})
			.catch((error: unknown) => {
				if (!checkDetailRequestId(requestId)) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setDetail(null);
				}
				setMessage(
					error instanceof Error ? error.message : '读取用户详情失败'
				);
			})
			.finally(() => {
				if (checkDetailRequestId(requestId)) {
					setIsLoading(false);
				}
			});
	}, [checkDetailRequestId, createDetailRequestId, id]);

	useEffect(
		() => () => {
			detailRequestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		let isMounted = true;
		void fetchAdminMe()
			.then((data) => {
				if (!isMounted) {
					return;
				}
				accountStore.shared.adminCsrfToken.set(data.csrf_token);
				setAdmin(data);
			})
			.catch((error: unknown) => {
				if (!isMounted) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
				} else {
					setMessage(
						error instanceof Error
							? error.message
							: '读取管理员状态失败'
					);
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsAuthLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (admin !== null) {
			setDetail(null);
			setMessage(null);
			setPassword('');
			refreshDetail();
		}
	}, [admin, id, refreshDetail]);

	if (isAuthLoading) {
		return (
			<div className="min-h-main-content space-y-4">
				<Heading isFirst>用户管理</Heading>
				<Button isLoading variant="flat">
					加载中
				</Button>
			</div>
		);
	}

	if (admin === null) {
		return (
			<div className="min-h-main-content space-y-4">
				<Heading isFirst>用户管理</Heading>
				<p className="text-sm text-foreground-500">
					{message ?? '请先返回管理员页登录。'}
				</p>
				<Link href="/admin">返回管理员页</Link>
			</div>
		);
	}

	if (detail === null) {
		return (
			<div className="min-h-main-content space-y-4">
				<Heading isFirst>用户管理</Heading>
				<Button
					isLoading={isLoading}
					variant="flat"
					onPress={refreshDetail}
				>
					刷新
				</Button>
				{message !== null && (
					<p className="text-sm text-foreground-500">{message}</p>
				)}
			</div>
		);
	}

	if (detail.user.id !== id) {
		return (
			<div className="min-h-main-content space-y-4">
				<Heading isFirst>用户管理</Heading>
				<Button isLoading={isLoading} variant="flat">
					加载中
				</Button>
			</div>
		);
	}

	const { namespaces, session_count: sessionCount, user } = detail;
	const { csrf_token: adminCsrfToken } = admin;
	const canDisableUser = user.status === 'active';
	const canEnableUser = user.status === 'disabled';
	const canResetPassword = user.status !== 'deleted';
	const isPasswordValid = checkPasswordLength(password);
	const runAction = (
		action: () => Promise<unknown>,
		success: string,
		onSuccess?: () => void
	) => {
		const requestId = createDetailRequestId();
		setIsLoading(true);
		setMessage(null);
		void action()
			.then(async () => {
				if (!checkDetailRequestId(requestId)) {
					return;
				}
				onSuccess?.();
				try {
					const data = await fetchAdminUser(id);
					if (checkDetailRequestId(requestId)) {
						setDetail(data);
						setMessage(success);
					}
				} catch (error: unknown) {
					if (checkDetailRequestId(requestId)) {
						if (checkAdminSessionUnauthorized(error)) {
							clearAdminSession();
							setAdmin(null);
						}
						setDetail(null);
						setMessage('操作已提交，但详情刷新失败，请手动刷新');
					}
				}
			})
			.catch((error: unknown) => {
				if (!checkDetailRequestId(requestId)) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setDetail(null);
				}
				setMessage(error instanceof Error ? error.message : '操作失败');
			})
			.finally(() => {
				if (checkDetailRequestId(requestId)) {
					setIsLoading(false);
				}
			});
	};

	return (
		<div className="min-h-main-content space-y-4">
			<Heading isFirst>用户管理</Heading>
			<Link href="/admin">返回用户列表</Link>
			<div className="space-y-1 text-sm">
				<p>用户名：{user.username}</p>
				<p>状态：{user.status}</p>
				<p>
					创建时间：
					<TimeAgo timestamp={user.created_at} />
				</p>
				<p>
					最近登录：
					{user.last_login_at === null ? (
						'无'
					) : (
						<TimeAgo timestamp={user.last_login_at} />
					)}
				</p>
				<p>活跃 session：{sessionCount}</p>
			</div>
			<div className="w-full space-y-2 lg:w-1/2">
				<Input
					label="新临时密码"
					type="password"
					value={password}
					onValueChange={setPassword}
				/>
				<div className="flex flex-wrap gap-2">
					<Button
						color="warning"
						isDisabled={!canResetPassword || !isPasswordValid}
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							runAction(
								() =>
									resetAdminUserPassword(
										id,
										{ password },
										adminCsrfToken
									),
								'密码已重置',
								() => {
									setPassword('');
								}
							);
						}}
					>
						重置密码
					</Button>
					<Button
						isDisabled={!canEnableUser}
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							runAction(
								() => enableAdminUser(id, adminCsrfToken),
								'用户已启用'
							);
						}}
					>
						启用用户
					</Button>
					<Button
						color="warning"
						isDisabled={!canDisableUser}
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							runAction(
								() => disableAdminUser(id, adminCsrfToken),
								'用户已禁用'
							);
						}}
					>
						禁用用户
					</Button>
					<Button
						color="danger"
						isLoading={isLoading}
						variant="flat"
						onPress={() => {
							runAction(
								() =>
									deleteAdminUserSessions(id, adminCsrfToken),
								'已踢出全部设备'
							);
						}}
					>
						踢出全部设备
					</Button>
				</div>
			</div>
			{message !== null && (
				<p className="text-sm text-foreground-500">{message}</p>
			)}
			<div className="overflow-x-auto">
				<table className="min-w-full text-left text-sm">
					<thead className="text-foreground-500">
						<tr>
							<th className="py-2 pr-4">Namespace</th>
							<th className="py-2 pr-4">Revision</th>
							<th className="py-2 pr-4">Schema</th>
							<th className="py-2 pr-4">更新时间</th>
						</tr>
					</thead>
					<tbody>
						{namespaces.map((namespace) => (
							<tr
								key={namespace.namespace}
								className="border-t border-default-200"
							>
								<td className="py-2 pr-4">
									{namespace.namespace}
								</td>
								<td className="py-2 pr-4">
									{namespace.revision}
								</td>
								<td className="py-2 pr-4">
									{namespace.schema_version}
								</td>
								<td className="py-2 pr-4">
									<TimeAgo timestamp={namespace.updated_at} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
