'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faClock,
	faPlus,
	faRotate,
	faServer,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Link, cn } from '@/design/ui/components';

import {
	AdminEmptyState,
	AdminHeader,
	AdminMessage,
	AdminMetric,
	AdminPanel,
	AdminShell,
	AdminTable,
	AdminTableHeader,
	AdminTableRow,
} from '../components';
import TimeAgo from '@/components/timeAgo';

import {
	type IAdminMeData,
	fetchAdminMe,
	listAdminSsoClients,
} from '@/lib/account/client/api';
import { type IAdminSsoClientListData } from '@/lib/account/shared/types';
import {
	checkAdminSessionUnauthorized,
	clearAdminSession,
} from '@/lib/account/client/adminSession';

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;

const AdminSsoClientRow = memo<{
	client: IAdminSsoClientListData['clients'][number];
}>(function AdminSsoClientRow({ client }) {
	return (
		<AdminTableRow>
			<td className={cn(tableCellClassName, 'w-80 max-w-80')}>
				<div className="min-w-0 max-w-72">
					<p className="truncate text-small font-medium leading-5 text-foreground-800">
						{client.name}
					</p>
					<p className="truncate font-mono text-[0.7rem] leading-4 text-foreground-400">
						{client.id}
					</p>
				</div>
			</td>
			<td className={tableNowrapCellClassName}>
				{client.secret_hashes.length}
			</td>
			<td className={tableNowrapCellClassName}>
				{client.status_callback_url === null ? '无' : '已配置'}
			</td>
			<td className={tableNowrapCellClassName}>
				<TimeAgo timestamp={client.created_at} />
			</td>
			<td className={cn(tableNowrapCellClassName, 'text-right')}>
				<Link
					animationUnderline={false}
					className="rounded-small px-2 py-1 text-small text-primary-600 transition-background hover:bg-primary/15 motion-reduce:transition-none dark:text-primary"
					href={`/admin/sso/${encodeURIComponent(client.id)}`}
				>
					编辑
				</Link>
			</td>
		</AdminTableRow>
	);
});

export default function AdminSsoClientsPage() {
	const requestIdRef = useRef(0);
	const [admin, setAdmin] = useState<IAdminMeData | null>(null);
	const [clients, setClients] = useState<IAdminSsoClientListData | null>(
		null
	);
	const [isAuthLoading, setIsAuthLoading] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const refreshClients = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsLoading(true);
		setMessage(null);

		void listAdminSsoClients()
			.then((data) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setClients(data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					setClients(null);
					return;
				}
				setMessage(
					error instanceof Error ? error.message : '读取SSO客户端失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsLoading(false);
				}
			});
	}, []);

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
			.then((data) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				setAdmin(data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (checkAdminSessionUnauthorized(error)) {
					clearAdminSession();
					setAdmin(null);
					return;
				}
				setMessage(
					error instanceof Error
						? error.message
						: '读取管理员状态失败'
				);
			})
			.finally(() => {
				if (requestIdRef.current === requestId) {
					setIsAuthLoading(false);
				}
			});
	}, []);

	useEffect(
		() => () => {
			requestIdRef.current += 1;
		},
		[]
	);

	useEffect(() => {
		checkAdmin();
	}, [checkAdmin]);

	useEffect(() => {
		if (admin !== null) {
			refreshClients();
		}
	}, [admin, refreshClients]);

	if (isAuthLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="正在校验管理员会话"
					title="SSO客户端"
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

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin"
							variant="flat"
						>
							返回管理员页
						</Button>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="SSO客户端"
				/>
			</AdminShell>
		);
	}

	const clientCount = clients?.clients.length ?? 0;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin"
							startContent={
								<FontAwesomeIcon
									icon={faUsers}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							用户管理
						</Button>
						<Button
							isLoading={isLoading}
							startContent={
								isLoading ? null : (
									<FontAwesomeIcon
										icon={faRotate}
										className="w-3.5"
									/>
								)
							}
							variant="flat"
							onPress={refreshClients}
						>
							刷新
						</Button>
						<Button
							as={Link}
							animationUnderline={false}
							color="primary"
							href="/admin/sso/new"
							startContent={
								<FontAwesomeIcon
									icon={faPlus}
									className="w-3.5"
								/>
							}
							variant="flat"
						>
							新建
						</Button>
					</>
				}
				icon={faServer}
				title="SSO客户端"
			/>

			<AdminPanel className="grid gap-4 sm:grid-cols-3">
				<AdminMetric
					label="客户端数量"
					value={clients === null ? '读取中' : clientCount}
				/>
				<AdminMetric
					label="回调配置"
					value={
						clients === null
							? '读取中'
							: clients.clients.filter(
									(client) =>
										client.status_callback_url !== null
								).length
					}
				/>
				<AdminMetric
					label="secret总数"
					value={
						clients === null
							? '读取中'
							: clients.clients.reduce(
									(sum, client) =>
										sum + client.secret_hashes.length,
									0
								)
					}
				/>
			</AdminPanel>

			{message !== null && <AdminMessage message={message} />}

			{clients === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取SSO客户端
				</AdminEmptyState>
			) : clients.clients.length === 0 ? (
				<AdminEmptyState icon={faServer}>暂无SSO客户端</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<th className={tableHeadCellClassName}>客户端</th>
							<th className={tableHeadCellClassName}>Secrets</th>
							<th className={tableHeadCellClassName}>状态回调</th>
							<th className={tableHeadCellClassName}>创建时间</th>
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
						{clients.clients.map((client) => (
							<AdminSsoClientRow
								key={client.id}
								client={client}
							/>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
