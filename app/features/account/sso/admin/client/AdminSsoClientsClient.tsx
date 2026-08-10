'use client';

import {
	faBullhorn,
	faClock,
	faMagnifyingGlass,
	faPlus,
	faServer,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@heroui/theme';
import { usePathname, useRouter } from 'next/navigation';
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

import TimeAgo from '@/design/ui/components/timeAgo';

import type {
	IAdminMeData,
	IAdminSsoClientListData,
} from '@/features/account/contracts';
import type { IAdminSsoClientsInitialData } from '@/features/account/sso/admin/contracts';
import {
	ADMIN_SSO_CALLBACK_CONFIGURATION_FILTER_OPTIONS,
	ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP,
	ADMIN_SSO_CLIENT_STATUS_FILTER_OPTIONS,
	ADMIN_SSO_GRANT_PRESENCE_FILTER_OPTIONS,
	ADMIN_SSO_MESSAGE_MAP,
} from '@/features/account/sso/admin/copy';
import { fetchAdminMe } from '@/features/admin/client/api';
import {
	AdminEmptyState,
	AdminLoadingState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminDropdownFilter,
	AdminFilterActionButton,
	AdminSearchInput,
} from '@/features/admin/client/components/filters';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminFilterPanel,
	AdminMetric,
	AdminMetricPanel,
	AdminMutedText,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import {
	AdminEntityCell,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import {
	createAdminDateTimeText,
	createAdminPageInputValue,
	parseAdminPageInput,
} from '@/features/admin/client/inputValues';
import {
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';
import { createAdminHref } from '@/features/admin/navigation';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import { listAdminSsoClients } from './api/clients';
import { AdminSsoOperationNav } from './components/operationNav';
import { AdminSsoClientStatusBadge } from './components/statusBadges';
import {
	type IAdminSsoLocationState,
	createAdminSsoClientDetailHref,
} from './navigation';

type TClientStatusFilter = '' | 'active' | 'disabled';
type TCallbackFilter = '' | 'configured' | 'missing';
type TGrantFilter = '' | 'has' | 'none';

const pageInputRegexp = /^\d*$/u;

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
					? ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP.missing
					: isDisabled
						? ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP.paused
						: ADMIN_SSO_CALLBACK_CONFIGURATION_LABEL_MAP.configured}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{createAdminDateTimeText(client.last_secret_used_at)}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				<TimeAgo
					initialNowTimestamp={initialNowTimestamp}
					timestamp={client.created_at}
				/>
			</AdminTableCell>
			<AdminTableCell isNowrap className="text-right">
				<AdminTableActionLink
					href={createAdminHref('/admin/sso/grants', {
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
		createAdminPageInputValue(initialData.clients?.page ?? 1)
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
						if (isAdminSessionInvalidResult(result)) {
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
						Error.isError(error)
							? error.message
							: ADMIN_SSO_MESSAGE_MAP.clientReadFailed
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
					if (isAdminSessionInvalidResult(result)) {
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
					Error.isError(error)
						? error.message
						: ADMIN_MESSAGE_MAP.adminStateReadFailed
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
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshClients]);

	useEffect(() => {
		setPageInput(createAdminPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso') {
			return;
		}

		const nextHref = createAdminHref('/admin/sso', listLocationState);
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
			setPage(parseAdminPageInput(pageInput, clients?.total_pages ?? 1));
		},
		[clients?.total_pages, pageInput]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label={ADMIN_STATUS_LABEL_MAP.sessionReading}
				subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
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
					subtitle={message ?? ADMIN_MESSAGE_MAP.adminSignInRequired}
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
							? ADMIN_STATUS_LABEL_MAP.reading
							: clients.metrics.active_client_count
					}
				/>
				<AdminMetric
					label="已禁用"
					value={
						clients === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: clients.metrics.disabled_client_count
					}
				/>
				<AdminMetric
					label="有效授权"
					value={
						clients === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: clients.metrics.active_grant_count
					}
				/>
				<AdminMetric
					label="待投递Callback"
					value={
						clients === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: clients.metrics.pending_callback_count
					}
				/>
				<AdminMetric
					label="失败Callback"
					value={
						clients === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: clients.metrics.failed_callback_count
					}
				/>
				<AdminMetric
					label="未消费Ticket"
					value={
						clients === null
							? ADMIN_STATUS_LABEL_MAP.reading
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
				<AdminDropdownFilter
					ariaLabel="筛选客户端状态"
					options={ADMIN_SSO_CLIENT_STATUS_FILTER_OPTIONS}
					value={statusFilter}
					onAction={handleStatusAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选Callback配置"
					options={ADMIN_SSO_CALLBACK_CONFIGURATION_FILTER_OPTIONS}
					value={callbackFilter}
					onAction={handleCallbackAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选授权状态"
					options={ADMIN_SSO_GRANT_PRESENCE_FILTER_OPTIONS}
					value={grantFilter}
					onAction={handleGrantAction}
				/>
				<AdminFilterActionButton
					isLoading={isLoading}
					onPress={handleRefreshClients}
				>
					刷新
				</AdminFilterActionButton>
			</AdminFilterPanel>

			{message !== null && <AdminMessage message={message} />}

			{clients === null ? (
				<AdminEmptyState icon={faClock}>
					{ADMIN_SSO_MESSAGE_MAP.clientListReading}
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
