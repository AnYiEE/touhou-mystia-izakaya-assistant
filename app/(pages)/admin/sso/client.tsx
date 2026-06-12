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
	type TAdminActionResult,
	checkAdminAction,
	listAdminSsoClientsAction,
} from '../actions';
import {
	type IAdminMeData,
	type IAdminSsoClientListData,
} from '@/lib/account/shared/types';
import { clearAdminSession } from '@/lib/account/client/adminSession';

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminActionResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

export interface IAdminSsoClientsInitialData {
	admin: IAdminMeData | null;
	clients: IAdminSsoClientListData | null;
	isAuthLoading: boolean;
	message: string | null;
	renderedAt: number;
}

interface IAdminSsoClientsClientProps {
	initialData: IAdminSsoClientsInitialData;
}

const AdminSsoClientRow = memo<{
	client: IAdminSsoClientListData['clients'][number];
	initialNowTimestamp: number;
}>(function AdminSsoClientRow({ client, initialNowTimestamp }) {
	const isDisabled = client.disabled_at !== null;

	return (
		<AdminTableRow className={cn(isDisabled && 'opacity-75')}>
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
				<span
					className={cn(
						'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
						isDisabled
							? 'border-warning/30 bg-warning/15 text-warning-700 dark:text-warning-600'
							: 'border-success/30 bg-success/15 text-success-700 dark:text-success'
					)}
				>
					{isDisabled ? '已禁用' : '已启用'}
				</span>
			</td>
			<td className={tableNowrapCellClassName}>
				{client.secret_hashes.length}
			</td>
			<td className={tableNowrapCellClassName}>
				{client.status_callback_url === null
					? '无'
					: isDisabled
						? '已暂停'
						: '已配置'}
			</td>
			<td className={tableNowrapCellClassName}>
				<TimeAgo
					initialNowTimestamp={initialNowTimestamp}
					timestamp={client.created_at}
				/>
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

export default function AdminSsoClientsClient({
	initialData,
}: IAdminSsoClientsClientProps) {
	const requestIdRef = useRef(0);
	const isServerInitialClientsRef = useRef(initialData.clients !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [clients, setClients] = useState<IAdminSsoClientListData | null>(
		initialData.clients
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);

	const refreshClients = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsLoading(true);
		setMessage(null);

		void listAdminSsoClientsAction()
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						setClients(null);
						return;
					}

					setMessage(result.message);
					return;
				}

				setClients(result.data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
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

		void checkAdminAction()
			.then((result) => {
				if (requestIdRef.current !== requestId) {
					return;
				}
				if (result.status === 'error') {
					if (checkAdminUnauthorizedActionResult(result)) {
						clearAdminSession();
						setAdmin(null);
						return;
					}

					setMessage(result.message);
					return;
				}

				setAdmin(result.data);
			})
			.catch((error: unknown) => {
				if (requestIdRef.current !== requestId) {
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
		if (initialData.admin !== null) {
			setIsAuthLoading(false);
			return;
		}

		checkAdmin();
	}, [checkAdmin, initialData.admin]);

	useEffect(() => {
		if (admin !== null) {
			if (isServerInitialClientsRef.current) {
				isServerInitialClientsRef.current = false;
				return;
			}

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
	const disabledClientCount =
		clients?.clients.filter((client) => client.disabled_at !== null)
			.length ?? 0;
	const initialNowTimestamp = initialData.renderedAt;

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

			<AdminPanel className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="客户端数量"
					value={clients === null ? '读取中' : clientCount}
				/>
				<AdminMetric
					label="已禁用"
					value={clients === null ? '读取中' : disabledClientCount}
				/>
				<AdminMetric
					label="状态回调"
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
					label="secret hash总数"
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
							<th className={tableHeadCellClassName}>状态</th>
							<th className={tableHeadCellClassName}>
								Secret Hashes
							</th>
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
								initialNowTimestamp={initialNowTimestamp}
							/>
						))}
					</tbody>
				</AdminTable>
			)}
		</AdminShell>
	);
}
