'use client';

import {
	type Key,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBullhorn,
	faClock,
	faMagnifyingGlass,
	faPlus,
	faRotate,
	faServer,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Button, cn } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoDropdownFilter,
	AdminSsoFilterButton,
	AdminSsoOperationNav,
	createAdminSsoDateTimeText,
	createAdminSsoPageInputValue,
	parseAdminSsoPageInput,
} from './components';
import {
	type IAdminSsoLocationState,
	createAdminSsoClientDetailHref,
	createAdminSsoHref,
} from './locationState';
import {
	AdminEmptyState,
	AdminEntityCell,
	AdminFilterPanel,
	AdminHeader,
	AdminHeaderActionLink,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminMutedText,
	AdminPagination,
	AdminSearchInput,
	AdminShell,
	AdminSsoClientStatusBadge,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '../components';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import {
	type TAdminApiResult,
	fetchAdminMe,
	listAdminSsoClients,
} from '../api';
import {
	type IAdminMeData,
	type IAdminSsoClientListData,
} from '@/lib/account/shared/types';
import { clearAdminSession } from '@/lib/account/client/adminSession';

type TClientStatusFilter = '' | 'active' | 'disabled';
type TCallbackFilter = '' | 'configured' | 'missing';
type TGrantFilter = '' | 'has' | 'none';

const pageInputRegexp = /^\d*$/u;

const clientStatusOptions = [
	{ label: '全部状态', value: '' },
	{ label: '已启用', value: 'active' },
	{ label: '已禁用', value: 'disabled' },
] as const;

const callbackOptions = [
	{ label: '全部Callback', value: '' },
	{ label: '已配置Callback', value: 'configured' },
	{ label: '未配置Callback', value: 'missing' },
] as const;

const grantOptions = [
	{ label: '全部授权', value: '' },
	{ label: '已有授权', value: 'has' },
	{ label: '暂无授权', value: 'none' },
] as const;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

export interface IAdminSsoClientsInitialData {
	admin: IAdminMeData | null;
	callback: TCallbackFilter;
	clients: IAdminSsoClientListData | null;
	grant: TGrantFilter;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	status: TClientStatusFilter;
}

interface IAdminSsoClientsClientProps {
	initialData: IAdminSsoClientsInitialData;
}

const AdminSsoClientRow = memo<{
	client: IAdminSsoClientListData['clients'][number];
	initialNowTimestamp: number;
	listLocationState: IAdminSsoLocationState;
}>(function AdminSsoClientRow({
	client,
	initialNowTimestamp,
	listLocationState,
}) {
	const isDisabled = client.disabled_at !== null;

	return (
		<AdminTableRow className={cn(isDisabled && 'opacity-75')}>
			<AdminTableCell className="w-80 max-w-80">
				<AdminEntityCell
					className="max-w-72"
					id={client.id}
					title={client.name}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminSsoClientStatusBadge disabledAt={client.disabled_at} />
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{client.active_secret_count}
			</AdminTableCell>
			<AdminTableCell isNowrap>{client.grant_count}</AdminTableCell>
			<AdminTableCell isNowrap>
				{client.pending_callback_count}
				{client.failed_callback_count > 0 && (
					<AdminMutedText>
						{' / '}
						{client.failed_callback_count}失败
					</AdminMutedText>
				)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{client.pending_ticket_count}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{client.status_callback_url === null
					? '无'
					: isDisabled
						? '已暂停'
						: '已配置'}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{createAdminSsoDateTimeText(client.last_secret_used_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<TimeAgo
					initialNowTimestamp={initialNowTimestamp}
					timestamp={client.created_at}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap className="text-right">
				<AdminTableActionLink
					href={createAdminSsoHref('/admin/sso/grants', {
						clientId: client.id,
					})}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Admin SSO Client Button',
							'Open Grants',
							client.id
						);
					}}
				>
					授权
				</AdminTableActionLink>
				<AdminTableActionLink
					href={createAdminSsoClientDetailHref(
						client.id,
						listLocationState
					)}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Admin SSO Client Button',
							'Edit',
							client.id
						);
					}}
				>
					编辑
				</AdminTableActionLink>
			</AdminTableCell>
		</AdminTableRow>
	);
});

export default function AdminSsoClientsClient({
	initialData,
}: IAdminSsoClientsClientProps) {
	const pathname = usePathname();
	const router = useRouter();
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
	const [page, setPage] = useState(initialData.clients?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.clients?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [statusFilter, setStatusFilter] = useState<TClientStatusFilter>(
		initialData.status
	);
	const [callbackFilter, setCallbackFilter] = useState<TCallbackFilter>(
		initialData.callback
	);
	const [grantFilter, setGrantFilter] = useState<TGrantFilter>(
		initialData.grant
	);

	const listLocationState = useMemo<IAdminSsoLocationState>(
		() => ({
			callback: callbackFilter,
			grant: grantFilter,
			page,
			query: queryInput,
			status: statusFilter,
		}),
		[callbackFilter, grantFilter, page, queryInput, statusFilter]
	);

	const createListOptions = useCallback(
		(nextPage = page) => ({
			page: nextPage,
			pageSize: clients?.page_size ?? 20,
			...(callbackFilter === '' ? {} : { callback: callbackFilter }),
			...(grantFilter === '' ? {} : { hasGrants: grantFilter === 'has' }),
			...(queryInput.trim() === '' ? {} : { query: queryInput.trim() }),
			...(statusFilter === '' ? {} : { status: statusFilter }),
		}),
		[
			callbackFilter,
			clients?.page_size,
			grantFilter,
			page,
			queryInput,
			statusFilter,
		]
	);

	const refreshClients = useCallback(
		(nextPage = page) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminSsoClients(createListOptions(nextPage))
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

						setMessage(result.displayMessage);
						return;
					}

					setClients(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO客户端失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[createListOptions, page]
	);

	const checkAdmin = useCallback(() => {
		requestIdRef.current += 1;
		const requestId = requestIdRef.current;
		setIsAuthLoading(true);
		setMessage(null);

		void fetchAdminMe()
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

					setMessage(result.displayMessage);
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
		let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialClientsRef.current) {
				isServerInitialClientsRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshClients(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshClients]);

	useEffect(() => {
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso') {
			return;
		}

		const nextHref = createAdminSsoHref('/admin/sso', listLocationState);
		const currentHref = `${globalThis.location.pathname}${globalThis.location.search}`;

		if (currentHref === nextHref) {
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			router.replace(nextHref, { scroll: false });
		}, ADMIN_SSO_LIST_DEBOUNCE_MS);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [listLocationState, pathname, router]);

	const handleLeaveSsoClientList = useCallback(() => {
		requestIdRef.current += 1;
		setIsLoading(false);
	}, []);

	const handleRefreshClients = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
			'Refresh'
		);
		refreshClients(page);
	}, [page, refreshClients]);

	const handleNewSsoClient = useCallback(() => {
		trackEvent(trackEvent.category.click, 'Admin SSO Client Button', 'New');
	}, []);

	const handleQueryInputChange = useCallback((value: string) => {
		setPage(1);
		setQueryInput(value);
	}, []);

	const handleStatusAction = useCallback((key: Key) => {
		setPage(1);
		setStatusFilter(String(key) as TClientStatusFilter);
	}, []);

	const handleCallbackAction = useCallback((key: Key) => {
		setPage(1);
		setCallbackFilter(String(key) as TCallbackFilter);
	}, []);

	const handleGrantAction = useCallback((key: Key) => {
		setPage(1);
		setGrantFilter(String(key) as TGrantFilter);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, clients?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [clients?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(
				parseAdminSsoPageInput(pageInput, clients?.total_pages ?? 1)
			);
		},
		[clients?.total_pages, pageInput]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="SSO客户端"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink href="/admin">
							返回管理员页
						</AdminHeaderActionLink>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="SSO客户端"
				/>
			</AdminShell>
		);
	}

	const initialNowTimestamp = initialData.renderedAt;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink
							href="/admin"
							icon={faUsers}
							onPress={handleLeaveSsoClientList}
						>
							用户管理
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
							onPress={handleLeaveSsoClientList}
						>
							站点通知
						</AdminHeaderActionLink>
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
							onPress={handleRefreshClients}
						>
							刷新
						</Button>
						<AdminHeaderActionLink
							color="primary"
							href="/admin/sso/new"
							icon={faPlus}
							onPress={handleNewSsoClient}
						>
							新建
						</AdminHeaderActionLink>
					</>
				}
				icon={faServer}
				title="SSO客户端"
			/>

			<AdminSsoOperationNav activeHref="/admin/sso" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-6">
				<AdminMetric
					label="启用客户端"
					value={
						clients === null
							? '读取中'
							: clients.metrics.active_client_count
					}
				/>
				<AdminMetric
					label="已禁用"
					value={
						clients === null
							? '读取中'
							: clients.metrics.disabled_client_count
					}
				/>
				<AdminMetric
					label="有效授权"
					value={
						clients === null
							? '读取中'
							: clients.metrics.active_grant_count
					}
				/>
				<AdminMetric
					label="待投递Callback"
					value={
						clients === null
							? '读取中'
							: clients.metrics.pending_callback_count
					}
				/>
				<AdminMetric
					label="失败Callback"
					value={
						clients === null
							? '读取中'
							: clients.metrics.failed_callback_count
					}
				/>
				<AdminMetric
					label="未消费Ticket"
					value={
						clients === null
							? '读取中'
							: clients.metrics.pending_ticket_count
					}
				/>
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索SSO客户端"
					icon={faMagnifyingGlass}
					placeholder="搜索客户端名称或ID"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<AdminSsoDropdownFilter
					ariaLabel="筛选客户端状态"
					options={clientStatusOptions}
					value={statusFilter}
					onAction={handleStatusAction}
				/>
				<AdminSsoDropdownFilter
					ariaLabel="筛选Callback配置"
					options={callbackOptions}
					value={callbackFilter}
					onAction={handleCallbackAction}
				/>
				<AdminSsoDropdownFilter
					ariaLabel="筛选授权状态"
					options={grantOptions}
					value={grantFilter}
					onAction={handleGrantAction}
				/>
				<AdminSsoFilterButton
					isLoading={isLoading}
					onPress={handleRefreshClients}
				>
					刷新
				</AdminSsoFilterButton>
			</AdminFilterPanel>

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
							<AdminTableHeadCell>SSO客户端</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>
								Active Secret
							</AdminTableHeadCell>
							<AdminTableHeadCell>授权</AdminTableHeadCell>
							<AdminTableHeadCell>Callback</AdminTableHeadCell>
							<AdminTableHeadCell>Tickets</AdminTableHeadCell>
							<AdminTableHeadCell>状态回调</AdminTableHeadCell>
							<AdminTableHeadCell>最后使用</AdminTableHeadCell>
							<AdminTableHeadCell>创建时间</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{clients.clients.map((client) => (
							<AdminSsoClientRow
								key={client.id}
								client={client}
								initialNowTimestamp={initialNowTimestamp}
								listLocationState={listLocationState}
							/>
						))}
					</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={clients?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={clients?.page_size}
				totalCount={clients?.total_count}
				totalLabel="个客户端"
				totalPages={Math.max(1, clients?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
