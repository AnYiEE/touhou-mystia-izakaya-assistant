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
	faBullhorn,
	faClock,
	faMagnifyingGlass,
	faRotate,
	faShieldHalved,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Input } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoCallbackQueueStatusBadge,
	AdminSsoMetadata,
	AdminSsoOperationNav,
	createAdminSsoDateTimeText,
	createAdminSsoPageInputValue,
	createAdminSsoTimeInputValue,
	getAdminSsoCallbackEventLabel,
	parseAdminSsoPageInput,
	parseAdminSsoTimeInputValue,
} from '../components';
import {
	AdminAdvancedFilterPopover,
	AdminConfirmButton,
	AdminDropdownFilter,
	AdminEmptyState,
	AdminFilterActionButton,
	AdminFilterPanel,
	AdminFilterReferencePanel,
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
} from '../../components';
import { trackEvent } from '@/components/analytics';

import { createAdminSsoHref } from '../locationState';
import {
	type TAdminApiResult,
	discardAdminSsoCallback,
	dispatchAdminSsoCallbacks,
	fetchAdminMe,
	listAdminSsoCallbacks,
	retryAdminSsoCallback,
} from '../../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAdminMeData,
	IAdminSsoCallbackQueueListData,
	TAdminSsoCallbackEvent,
	TAdminSsoCallbackQueueStatus,
} from '@/lib/account/shared/types';

type TCallbackEventFilter = '' | TAdminSsoCallbackEvent;
type TCallbackQueueStatusFilter = '' | TAdminSsoCallbackQueueStatus;
type TConfirmAction =
	| 'dispatch'
	| `discard:${number}`
	| `retry:${number}`
	| null;

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
	{ label: '待投递', value: 'pending' },
	{ label: '重试中', value: 'retrying' },
	{ label: '最终失败', value: 'final_failed' },
] as const;

const callbackFilterReferenceGroups = [
	{
		label: '事件',
		values: eventOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '状态',
		values: statusOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
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

export interface IAdminSsoCallbacksInitialData {
	admin: IAdminMeData | null;
	callbacks: IAdminSsoCallbackQueueListData | null;
	clientId: string;
	endTime?: number;
	event: TCallbackEventFilter;
	isAuthLoading: boolean;
	message: string | null;
	query: string;
	renderedAt: number;
	startTime?: number;
	status: TCallbackQueueStatusFilter;
	userId: string;
}

interface IAdminSsoCallbacksClientProps {
	initialData: IAdminSsoCallbacksInitialData;
}

interface IAdminSsoCallbackRowProps {
	callback: IAdminSsoCallbackQueueListData['callbacks'][number];
	confirmAction: TConfirmAction;
	isMutating: boolean;
	mutatingId: number | null;
	onDiscard: (id: number) => void;
	onOpenChange: (action: TConfirmAction) => void;
	onRetry: (id: number) => void;
}

const AdminSsoCallbackRow = memo<IAdminSsoCallbackRowProps>(
	function AdminSsoCallbackRow({
		callback,
		confirmAction,
		isMutating,
		mutatingId,
		onDiscard,
		onOpenChange,
		onRetry,
	}) {
		const isMutatingCurrentRow = mutatingId === callback.id;

		return (
			<AdminTableRow>
				<AdminTableCell isNowrap>#{callback.id}</AdminTableCell>
				<AdminTableCell isNowrap>
					<AdminSsoCallbackQueueStatusBadge
						status={callback.status}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{getAdminSsoCallbackEventLabel(callback.event)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminTableActionLink
						href={`/admin/sso/${encodeURIComponent(callback.client_id)}`}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Admin SSO Callback Button',
								'Open Client',
								callback.client_id
							);
						}}
					>
						{callback.client_id}
					</AdminTableActionLink>
				</AdminTableCell>
				<AdminTableCell>
					{callback.user_id === null ? (
						<span className="text-foreground-400">客户端级</span>
					) : (
						<AdminTableActionLink
							href={`/admin/users/${encodeURIComponent(callback.user_id)}`}
							onPress={() => {
								trackEvent(
									trackEvent.category.click,
									'Admin SSO Callback Button',
									'Open User',
									callback.user_id ?? ''
								);
							}}
						>
							{callback.user_id}
						</AdminTableActionLink>
					)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminSsoMetadata metadata={callback.metadata} />
				</AdminTableCell>
				<AdminTableCell isNowrap>{callback.attempts}</AdminTableCell>
				<AdminTableCell isNowrap>
					{createAdminSsoDateTimeText(callback.next_retry_at)}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{createAdminSsoDateTimeText(callback.created_at)}
				</AdminTableCell>
				<AdminTableCell className="max-w-72">
					<span className="line-clamp-2 break-words text-foreground-500">
						{callback.last_error ?? '无'}
					</span>
				</AdminTableCell>
				<AdminTableCell isNowrap className="text-right">
					<div className="flex flex-nowrap items-center justify-end gap-2">
						<AdminConfirmButton
							color="primary"
							confirmAction={`retry:${callback.id}`}
							confirmColor="primary"
							confirmLabel="确认重试"
							icon={faRotate}
							isDisabled={isMutating && !isMutatingCurrentRow}
							isLoading={isMutatingCurrentRow}
							openAction={confirmAction}
							size="sm"
							onOpenChange={onOpenChange}
							onConfirm={() => {
								onRetry(callback.id);
							}}
						>
							重试
						</AdminConfirmButton>
						<AdminConfirmButton
							color="danger"
							confirmAction={`discard:${callback.id}`}
							confirmLabel="确认丢弃"
							icon={faTrash}
							isDisabled={isMutating && !isMutatingCurrentRow}
							isLoading={isMutatingCurrentRow}
							openAction={confirmAction}
							size="sm"
							onOpenChange={onOpenChange}
							onConfirm={() => {
								onDiscard(callback.id);
							}}
						>
							丢弃
						</AdminConfirmButton>
					</div>
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

export default function AdminSsoCallbacksClient({
	initialData,
}: IAdminSsoCallbacksClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const pageRef = useRef(initialData.callbacks?.page ?? 1);
	const isServerInitialRef = useRef(initialData.callbacks !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [callbacks, setCallbacks] =
		useState<IAdminSsoCallbackQueueListData | null>(initialData.callbacks);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.callbacks?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.callbacks?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [clientIdInput, setClientIdInput] = useState(initialData.clientId);
	const [userIdInput, setUserIdInput] = useState(initialData.userId);
	const [eventFilter, setEventFilter] = useState<TCallbackEventFilter>(
		initialData.event
	);
	const [statusFilter, setStatusFilter] =
		useState<TCallbackQueueStatusFilter>(initialData.status);
	const [startTimeInput, setStartTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.startTime)
	);
	const [endTimeInput, setEndTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.endTime)
	);
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [mutatingId, setMutatingId] = useState<number | null>(null);
	const [isDispatching, setIsDispatching] = useState(false);
	const isMutatingCallback = mutatingId !== null || isDispatching;

	const createListOptions = useCallback(
		(nextPage = page) => {
			const startTime = parseAdminSsoTimeInputValue(startTimeInput);
			const endTime = parseAdminSsoTimeInputValue(endTimeInput);

			return {
				page: nextPage,
				pageSize: callbacks?.page_size ?? 20,
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
			callbacks?.page_size,
			clientIdInput,
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
				setCallbacks(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshCallbacks = useCallback(
		(nextPage = page) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminSsoCallbacks(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setCallbacks(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取SSO Callback队列失败'
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
	const refreshCallbacksRef = useRef(refreshCallbacks);
	refreshCallbacksRef.current = refreshCallbacks;

	const refreshCurrentCallbacks = useCallback(() => {
		refreshCallbacksRef.current(pageRef.current);
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
					refreshCallbacks(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshCallbacks]);

	useEffect(() => {
		pageRef.current = page;
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/sso/callbacks') {
			return;
		}

		const startTime = parseAdminSsoTimeInputValue(startTimeInput);
		const endTime = parseAdminSsoTimeInputValue(endTimeInput);
		const nextHref = createAdminSsoHref('/admin/sso/callbacks', {
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
			'Admin SSO Callback Button',
			'Refresh'
		);
		refreshCurrentCallbacks();
	}, [refreshCurrentCallbacks]);

	const mutateCallback = useCallback(
		(id: number, action: 'discard' | 'retry') => {
			if (mutatingId !== null || isDispatching) {
				return;
			}

			const csrfToken = admin?.csrf_token;
			if (csrfToken === undefined) {
				setMessage('admin-session-expired');
				return;
			}
			trackEvent(
				trackEvent.category.click,
				'Admin SSO Callback Button',
				action === 'retry' ? 'Retry Callback' : 'Discard Callback',
				id
			);

			setMutatingId(id);
			setConfirmAction(null);
			setMessage(null);
			const request =
				action === 'retry'
					? retryAdminSsoCallback(id, csrfToken)
					: discardAdminSsoCallback(id, csrfToken);
			void request
				.then((result) => {
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setMessage(
						action === 'retry'
							? 'SSO Callback已重置为待投递'
							: 'SSO Callback已丢弃'
					);
					refreshCurrentCallbacks();
				})
				.catch((error: unknown) => {
					setMessage(
						error instanceof Error
							? error.message
							: '更新SSO Callback失败'
					);
				})
				.finally(() => {
					setMutatingId(null);
				});
		},
		[
			admin?.csrf_token,
			handleErrorResult,
			isDispatching,
			mutatingId,
			refreshCurrentCallbacks,
		]
	);

	const handleRetry = useCallback(
		(id: number) => {
			mutateCallback(id, 'retry');
		},
		[mutateCallback]
	);

	const handleDiscard = useCallback(
		(id: number) => {
			mutateCallback(id, 'discard');
		},
		[mutateCallback]
	);

	const handleDispatch = useCallback(() => {
		if (mutatingId !== null || isDispatching) {
			return;
		}

		const csrfToken = admin?.csrf_token;
		if (csrfToken === undefined) {
			setMessage('admin-session-expired');
			return;
		}
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Callback Button',
			'Dispatch Callbacks'
		);

		setIsDispatching(true);
		setConfirmAction(null);
		setMessage(null);
		void dispatchAdminSsoCallbacks(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleErrorResult(result);
					return;
				}

				setMessage(
					`已投递${result.data.succeeded}条，失败${result.data.failed}条，最终失败${result.data.final_failed}条，清理过期Ticket${result.data.deleted_expired_tickets}条，清理最终失败Callback${result.data.deleted_final_failed_callbacks}条`
				);
				refreshCurrentCallbacks();
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error
						? error.message
						: '投递SSO Callback失败'
				);
			})
			.finally(() => {
				setIsDispatching(false);
			});
	}, [
		admin?.csrf_token,
		handleErrorResult,
		isDispatching,
		mutatingId,
		refreshCurrentCallbacks,
	]);

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
		setStatusFilter(String(key) as TCallbackQueueStatusFilter);
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
				Math.max(1, callbacks?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [callbacks?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(
				parseAdminSsoPageInput(pageInput, callbacks?.total_pages ?? 1)
			);
		},
		[callbacks?.total_pages, pageInput]
	);

	const rows = useMemo(
		() =>
			callbacks?.callbacks.map((callback) => (
				<AdminSsoCallbackRow
					key={callback.id}
					callback={callback}
					confirmAction={confirmAction}
					isMutating={isMutatingCallback}
					mutatingId={mutatingId}
					onDiscard={handleDiscard}
					onOpenChange={setConfirmAction}
					onRetry={handleRetry}
				/>
			)) ?? [],
		[
			callbacks?.callbacks,
			confirmAction,
			handleDiscard,
			handleRetry,
			isMutatingCallback,
			mutatingId,
		]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="SSO Callback"
			/>
		);
	}

	if (admin === null) {
		return (
			<AdminShell>
				<AdminHeader
					actions={
						<>
							<AdminHeaderActionLink href="/admin" icon={faUsers}>
								用户管理
							</AdminHeaderActionLink>
							<AdminHeaderActionLink
								href="/admin/announcements"
								icon={faBullhorn}
							>
								站点通知
							</AdminHeaderActionLink>
						</>
					}
					icon={faShieldHalved}
					subtitle={message ?? '请先返回管理员页登录'}
					title="SSO Callback"
				/>
			</AdminShell>
		);
	}

	const pendingCount =
		callbacks?.callbacks.filter((callback) => callback.status === 'pending')
			.length ?? 0;
	const hasCallbackRows =
		callbacks !== null && callbacks.callbacks.length > 0;
	const finalFailedCount =
		callbacks?.callbacks.filter(
			(callback) => callback.status === 'final_failed'
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
						<AdminHeaderActionLink href="/admin" icon={faUsers}>
							用户管理
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
						>
							站点通知
						</AdminHeaderActionLink>
					</>
				}
				icon={faRotate}
				title="SSO Callback"
			/>
			<AdminSsoOperationNav activeHref="/admin/sso/callbacks" />

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页队列"
					value={
						callbacks === null
							? '读取中'
							: callbacks.callbacks.length
					}
				/>
				<AdminMetric
					label="筛选总数"
					value={
						callbacks === null ? '读取中' : callbacks.total_count
					}
				/>
				<AdminMetric
					label="待投递"
					value={callbacks === null ? '读取中' : pendingCount}
				/>
				<AdminMetric
					label="最终失败"
					value={callbacks === null ? '读取中' : finalFailedCount}
				/>
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索Callback队列"
					icon={faMagnifyingGlass}
					placeholder="Callback ID、客户端ID、用户ID、错误"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<AdminAdvancedFilterPopover
					activeCount={advancedFilterCount}
					reference={
						<AdminFilterReferencePanel
							groups={callbackFilterReferenceGroups}
						/>
					}
				>
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
					ariaLabel="筛选Callback事件"
					options={eventOptions}
					value={eventFilter}
					onAction={handleEventAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选Callback状态"
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
						本操作会按系统Dispatch限制投递已到期的一批Callback
					</span>
					<AdminConfirmButton
						color="primary"
						confirmAction="dispatch"
						confirmColor="primary"
						confirmLabel="确认投递"
						icon={faRotate}
						isDisabled={isMutatingCallback || !hasCallbackRows}
						isLoading={isDispatching}
						openAction={confirmAction}
						onOpenChange={setConfirmAction}
						onConfirm={handleDispatch}
					>
						投递一批
					</AdminConfirmButton>
				</div>
			</AdminMetricPanel>

			{callbacks === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取Callback队列
				</AdminEmptyState>
			) : callbacks.callbacks.length === 0 ? (
				<AdminEmptyState icon={faRotate}>
					暂无Callback队列
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
							<AdminTableHeadCell>下次投递</AdminTableHeadCell>
							<AdminTableHeadCell>创建时间</AdminTableHeadCell>
							<AdminTableHeadCell>最后错误</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{rows}</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={callbacks?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={callbacks?.page_size}
				totalCount={callbacks?.total_count}
				totalLabel="条Callback"
				totalPages={Math.max(1, callbacks?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
