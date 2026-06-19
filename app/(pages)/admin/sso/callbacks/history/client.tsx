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

import {
	faClock,
	faClockRotateLeft,
	faMagnifyingGlass,
	faShieldHalved,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';

import { Input } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoCallbackDeliveryStatusBadge,
	AdminSsoMetadata,
	AdminSsoOperationNav,
	createAdminSsoDateTimeText,
	createAdminSsoPageInputValue,
	createAdminSsoTimeInputValue,
	getAdminSsoCallbackEventLabel,
	parseAdminSsoPageInput,
	parseAdminSsoTimeInputValue,
} from '../../components';
import {
	AdminAdvancedFilterPopover,
	AdminConfirmButton,
	AdminDropdownFilter,
	AdminEmptyState,
	AdminFilterActionButton,
	AdminFilterPanel,
	AdminHeader,
	AdminHeaderActionLink,
	AdminLoadingState,
	AdminMessage,
	AdminMetric,
	AdminMetricPanel,
	AdminPagination,
	AdminSearchInput,
	AdminShell,
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
	adminAdvancedFilterInputClassNames,
} from '../../../components';
import { trackEvent } from '@/components/analytics';

import { createAdminSsoHref } from '../../locationState';
import {
	type TAdminApiResult,
	cleanupAdminSsoCallbackDeliveries,
	fetchAdminMe,
	listAdminSsoCallbackDeliveries,
} from '../../../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAdminMeData,
	IAdminSsoCallbackDeliveryListData,
	TAdminSsoCallbackDeliveryStatus,
	TAdminSsoCallbackEvent,
} from '@/lib/account/shared/types';

type TCallbackEventFilter = '' | TAdminSsoCallbackEvent;
type TCallbackDeliveryStatusFilter = '' | TAdminSsoCallbackDeliveryStatus;
type TConfirmAction = 'cleanup' | null;

const pageInputRegexp = /^\d*$/u;

const eventOptions = [
	{ label: '全部事件', value: '' },
	{ label: '客户端删除', value: 'client_deleted' },
	{ label: '客户端禁用', value: 'client_disabled' },
	{ label: '授权撤销', value: 'grant_revoked' },
	{ label: 'Secret轮换', value: 'secret_rotated' },
	{ label: '用户删除', value: 'user_deleted' },
	{ label: '用户禁用', value: 'user_disabled' },
	{ label: '资料更新', value: 'user_profile_updated' },
] as const;

const statusOptions = [
	{ label: '全部状态', value: '' },
	{ label: '成功', value: 'succeeded' },
	{ label: '失败', value: 'failed' },
	{ label: '最终失败', value: 'final_failed' },
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

export interface IAdminSsoCallbackHistoryInitialData {
	admin: IAdminMeData | null;
	clientId: string;
	deliveries: IAdminSsoCallbackDeliveryListData | null;
	endTime?: number;
	event: TCallbackEventFilter;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	startTime?: number;
	status: TCallbackDeliveryStatusFilter;
	userId: string;
}

interface IAdminSsoCallbackHistoryClientProps {
	initialData: IAdminSsoCallbackHistoryInitialData;
}

const AdminSsoCallbackDeliveryRow = memo<{
	delivery: IAdminSsoCallbackDeliveryListData['deliveries'][number];
}>(function AdminSsoCallbackDeliveryRow({ delivery }) {
	return (
		<AdminTableRow>
			<AdminTableCell isNowrap>#{delivery.id}</AdminTableCell>
			<AdminTableCell isNowrap>
				<AdminSsoCallbackDeliveryStatusBadge status={delivery.status} />
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{getAdminSsoCallbackEventLabel(delivery.event)}
			</AdminTableCell>
			<AdminTableCell>
				<AdminTableActionLink
					href={`/admin/sso/${encodeURIComponent(delivery.client_id)}`}
					onPress={() => {
						trackEvent(
							trackEvent.category.click,
							'Admin SSO Callback History Button',
							'Open Client',
							delivery.client_id
						);
					}}
				>
					{delivery.client_id}
				</AdminTableActionLink>
			</AdminTableCell>
			<AdminTableCell>
				{delivery.user_id === null ? (
					<span className="text-foreground-400">客户端级</span>
				) : (
					<AdminTableActionLink
						href={`/admin/users/${encodeURIComponent(delivery.user_id)}`}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Admin SSO Callback History Button',
								'Open User',
								delivery.user_id ?? ''
							);
						}}
					>
						{delivery.user_id}
					</AdminTableActionLink>
				)}
			</AdminTableCell>
			<AdminTableCell>
				<AdminSsoMetadata metadata={delivery.metadata} />
			</AdminTableCell>
			<AdminTableCell isNowrap>{delivery.attempt}</AdminTableCell>
			<AdminTableCell isNowrap>
				{delivery.http_status ?? '无'}
			</AdminTableCell>
			<AdminTableCell isNowrap>
				{delivery.duration_ms === null
					? '无'
					: `${delivery.duration_ms}ms`}
			</AdminTableCell>
			<AdminTableCell isNowrap>{delivery.queue_key}</AdminTableCell>
			<AdminTableCell isNowrap>
				{createAdminSsoDateTimeText(delivery.created_at)}
			</AdminTableCell>
			<AdminTableCell className="max-w-72">
				<span className="line-clamp-2 break-words text-foreground-500">
					{delivery.error ?? '无'}
				</span>
			</AdminTableCell>
		</AdminTableRow>
	);
});

export default function AdminSsoCallbackHistoryClient({
	initialData,
}: IAdminSsoCallbackHistoryClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const pageRef = useRef(initialData.deliveries?.page ?? 1);
	const isServerInitialRef = useRef(initialData.deliveries !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [deliveries, setDeliveries] =
		useState<IAdminSsoCallbackDeliveryListData | null>(
			initialData.deliveries
		);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.deliveries?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.deliveries?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [clientIdInput, setClientIdInput] = useState(initialData.clientId);
	const [userIdInput, setUserIdInput] = useState(initialData.userId);
	const [eventFilter, setEventFilter] = useState<TCallbackEventFilter>(
		initialData.event
	);
	const [statusFilter, setStatusFilter] =
		useState<TCallbackDeliveryStatusFilter>(initialData.status);
	const [startTimeInput, setStartTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.startTime)
	);
	const [endTimeInput, setEndTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.endTime)
	);
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [isCleaning, setIsCleaning] = useState(false);

	const createListOptions = useCallback(
		(nextPage = page) => {
			const startTime = parseAdminSsoTimeInputValue(startTimeInput);
			const endTime = parseAdminSsoTimeInputValue(endTimeInput);

			return {
				page: nextPage,
				pageSize: deliveries?.page_size ?? 20,
				...(clientIdInput.trim() === ''
					? {}
					: { clientId: clientIdInput.trim() }),
				...(endTime === undefined ? {} : { endTime }),
				...(eventFilter === '' ? {} : { event: eventFilter }),
				...(queryInput.trim() === ''
					? {}
					: { query: queryInput.trim() }),
				...(startTime === undefined ? {} : { startTime }),
				...(statusFilter === '' ? {} : { status: statusFilter }),
				...(userIdInput.trim() === ''
					? {}
					: { userId: userIdInput.trim() }),
			};
		},
		[
			clientIdInput,
			deliveries?.page_size,
			endTimeInput,
			eventFilter,
			page,
			queryInput,
			startTimeInput,
			statusFilter,
			userIdInput,
		]
	);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				setDeliveries(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshDeliveries = useCallback(
		(nextPage = page) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminSsoCallbackDeliveries(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setDeliveries(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO投递历史失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[createListOptions, handleErrorResult, page]
	);
	const refreshDeliveriesRef = useRef(refreshDeliveries);
	refreshDeliveriesRef.current = refreshDeliveries;

	const refreshCurrentDeliveries = useCallback(() => {
		refreshDeliveriesRef.current(pageRef.current);
	}, []);

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
					handleErrorResult(result);
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
	}, [handleErrorResult]);

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
			if (isServerInitialRef.current) {
				isServerInitialRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshDeliveries(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshDeliveries]);

	useEffect(() => {
		pageRef.current = page;
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/callbacks/history') {
			return;
		}

		const startTime = parseAdminSsoTimeInputValue(startTimeInput);
		const endTime = parseAdminSsoTimeInputValue(endTimeInput);
		const nextHref = createAdminSsoHref('/admin/sso/callbacks/history', {
			clientId: clientIdInput,
			event: eventFilter,
			page,
			query: queryInput,
			status: statusFilter,
			userId: userIdInput,
			...(endTime === undefined ? {} : { endTime }),
			...(startTime === undefined ? {} : { startTime }),
		});
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
	}, [
		clientIdInput,
		endTimeInput,
		eventFilter,
		page,
		pathname,
		queryInput,
		router,
		startTimeInput,
		statusFilter,
		userIdInput,
	]);

	const handleRefresh = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Callback History Button',
			'Refresh'
		);
		refreshCurrentDeliveries();
	}, [refreshCurrentDeliveries]);

	const handleCleanup = useCallback(() => {
		const csrfToken = admin?.csrf_token;
		if (csrfToken === undefined) {
			setMessage('admin-session-expired');
			return;
		}
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Callback History Button',
			'Cleanup History'
		);

		setIsCleaning(true);
		setConfirmAction(null);
		setMessage(null);
		void cleanupAdminSsoCallbackDeliveries(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleErrorResult(result);
					return;
				}

				setMessage(
					`已清理${result.data.deleted_count}条投递历史，按时间${result.data.deleted_by_age}条，按上限${result.data.deleted_by_cap}条`
				);
				refreshCurrentDeliveries();
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error ? error.message : '清理投递历史失败'
				);
			})
			.finally(() => {
				setIsCleaning(false);
			});
	}, [admin?.csrf_token, handleErrorResult, refreshCurrentDeliveries]);

	const handleQueryInputChange = useCallback((value: string) => {
		setPage(1);
		setQueryInput(value);
	}, []);

	const handleClientIdInputChange = useCallback((value: string) => {
		setPage(1);
		setClientIdInput(value);
	}, []);

	const handleUserIdInputChange = useCallback((value: string) => {
		setPage(1);
		setUserIdInput(value);
	}, []);

	const handleEventAction = useCallback((key: Key) => {
		setPage(1);
		setEventFilter(String(key) as TCallbackEventFilter);
	}, []);

	const handleStatusAction = useCallback((key: Key) => {
		setPage(1);
		setStatusFilter(String(key) as TCallbackDeliveryStatusFilter);
	}, []);

	const handleStartTimeInputChange = useCallback((value: string) => {
		setPage(1);
		setStartTimeInput(value);
	}, []);

	const handleEndTimeInputChange = useCallback((value: string) => {
		setPage(1);
		setEndTimeInput(value);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, deliveries?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [deliveries?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(
				parseAdminSsoPageInput(pageInput, deliveries?.total_pages ?? 1)
			);
		},
		[deliveries?.total_pages, pageInput]
	);

	const rows = useMemo(
		() =>
			deliveries?.deliveries.map((delivery) => (
				<AdminSsoCallbackDeliveryRow
					key={delivery.id}
					delivery={delivery}
				/>
			)) ?? [],
		[deliveries?.deliveries]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="SSO投递历史"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<AdminHeaderActionLink href="/admin/sso/callbacks">
							返回Callback队列
						</AdminHeaderActionLink>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="SSO投递历史"
				/>
			</AdminShell>
		);
	}

	const failedCount =
		deliveries?.deliveries.filter(
			(delivery) => delivery.status !== 'succeeded'
		).length ?? 0;
	const advancedFilterCount = [
		clientIdInput,
		userIdInput,
		startTimeInput,
		endTimeInput,
	].filter((value) => value.trim() !== '').length;

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminHeaderActionLink href="/admin/sso/callbacks">
							Callback队列
						</AdminHeaderActionLink>
						<AdminHeaderActionLink href="/admin/sso">
							返回SSO客户端
						</AdminHeaderActionLink>
					</>
				}
				icon={faClockRotateLeft}
				title="SSO投递历史"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/callbacks/history" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页历史"
					value={
						deliveries === null
							? '读取中'
							: deliveries.deliveries.length
					}
				/>
				<AdminMetric
					label="筛选总数"
					value={
						deliveries === null ? '读取中' : deliveries.total_count
					}
				/>
				<AdminMetric
					label="当前页异常"
					value={deliveries === null ? '读取中' : failedCount}
				/>
				<AdminMetric
					label="页码"
					value={deliveries === null ? '读取中' : deliveries.page}
				/>
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索投递历史"
					icon={faMagnifyingGlass}
					placeholder="Delivery ID、Queue Key、客户端ID、用户ID、错误"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<AdminAdvancedFilterPopover activeCount={advancedFilterCount}>
					<Input
						aria-label="按客户端ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="客户端ID"
						value={clientIdInput}
						onValueChange={handleClientIdInputChange}
					/>
					<Input
						aria-label="按用户ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="用户ID"
						value={userIdInput}
						onValueChange={handleUserIdInputChange}
					/>
					<Input
						aria-label="开始时间"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="开始时间"
						type="datetime-local"
						value={startTimeInput}
						onValueChange={handleStartTimeInputChange}
					/>
					<Input
						aria-label="结束时间"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="结束时间"
						type="datetime-local"
						value={endTimeInput}
						onValueChange={handleEndTimeInputChange}
					/>
				</AdminAdvancedFilterPopover>
				<AdminDropdownFilter
					ariaLabel="筛选事件"
					options={eventOptions}
					value={eventFilter}
					onAction={handleEventAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选状态"
					options={statusOptions}
					value={statusFilter}
					onAction={handleStatusAction}
				/>
				<AdminFilterActionButton
					isLoading={isLoading}
					onPress={handleRefresh}
				>
					刷新
				</AdminFilterActionButton>
			</AdminFilterPanel>

			{message !== null && <AdminMessage message={message} />}

			<AdminMetricPanel className="grid-cols-1">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="text-small text-foreground-500">
						清理会应用系统保留期和最大历史行数限制
					</span>
					<AdminConfirmButton
						color="danger"
						confirmAction="cleanup"
						confirmLabel="确认清理"
						icon={faTrash}
						isLoading={isCleaning}
						openAction={confirmAction}
						onOpenChange={setConfirmAction}
						onConfirm={handleCleanup}
					>
						清理历史
					</AdminConfirmButton>
				</div>
			</AdminMetricPanel>

			{deliveries === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取投递历史
				</AdminEmptyState>
			) : deliveries.deliveries.length === 0 ? (
				<AdminEmptyState icon={faClockRotateLeft}>
					暂无投递历史
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>ID</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>事件</AdminTableHeadCell>
							<AdminTableHeadCell>客户端</AdminTableHeadCell>
							<AdminTableHeadCell>用户</AdminTableHeadCell>
							<AdminTableHeadCell>元数据</AdminTableHeadCell>
							<AdminTableHeadCell>尝试</AdminTableHeadCell>
							<AdminTableHeadCell>HTTP</AdminTableHeadCell>
							<AdminTableHeadCell>耗时</AdminTableHeadCell>
							<AdminTableHeadCell>队列键</AdminTableHeadCell>
							<AdminTableHeadCell>创建时间</AdminTableHeadCell>
							<AdminTableHeadCell>错误</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{rows}</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={deliveries?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={deliveries?.page_size}
				totalCount={deliveries?.total_count}
				totalLabel="条投递历史"
				totalPages={Math.max(1, deliveries?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
