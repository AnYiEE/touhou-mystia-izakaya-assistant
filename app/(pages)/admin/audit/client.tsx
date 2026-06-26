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
	faClipboardList,
	faClock,
	faMagnifyingGlass,
	faPlug,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Input } from '@/design/ui/components';

import {
	ADMIN_SSO_LIST_DEBOUNCE_MS,
	AdminSsoMetadata,
	createAdminSsoDateTimeText,
	createAdminSsoPageInputValue,
	createAdminSsoTimeInputValue,
	parseAdminSsoPageInput,
	parseAdminSsoTimeInputValue,
} from '../sso/components';
import {
	AdminAdvancedFilterPopover,
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
} from '../components';
import { trackEvent } from '@/components/analytics';

import { createAdminSsoHref } from '../sso/locationState';
import { type TAdminApiResult, fetchAdminMe, listAdminAuditLogs } from '../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type {
	IAdminAuditLogListData,
	IAdminMeData,
} from '@/lib/account/shared/types';

type TActorTypeFilter =
	| ''
	| IAdminAuditLogListData['logs'][number]['actor_type'];
type TScopeFilter = '' | 'account' | 'sso';

const pageInputRegexp = /^\d*$/u;
const ADMIN_AUDIT_MIN_QUERY_LENGTH = 2;

const actorTypeOptions = [
	{ label: '全部操作者', value: '' },
	{ label: '管理员', value: 'admin' },
	{ label: '客户端', value: 'client' },
	{ label: '系统', value: 'system' },
	{ label: '用户', value: 'user' },
] as const;

const scopeOptions = [
	{ label: '全部范围', value: '' },
	{ label: '账号', value: 'account' },
	{ label: 'SSO', value: 'sso' },
] as const;

const auditScopeLabelMap = { account: '账号', sso: 'SSO' } as const;

const auditActorTypeLabelMap = {
	admin: '管理员',
	client: '客户端',
	system: '系统',
	user: '用户',
} as const;

const auditTargetTypeLabelMap: Record<string, string> = {
	announcement_records: '通知维护记录',
	sso_callback_queue: 'SSO Callback 队列',
	sso_client: 'SSO 客户端',
	sso_client_secret: 'SSO 客户端密钥',
	sso_grant: 'SSO 授权关系',
	sso_ticket: 'SSO Ticket',
	user: '用户',
};

const auditActionLabelMap: Record<string, string> = {
	'admin-cleanup-announcement-records': '管理员清理通知历史',
	'admin-cleanup-expired-sso-tickets': '管理员清理过期SSO Ticket',
	'admin-cleanup-sso-callback-deliveries': '管理员清理SSO Callback历史',
	'admin-clear-user-data': '管理员清空用户云端数据',
	'admin-create-sso-client': '管理员创建SSO客户端',
	'admin-create-sso-client-secret': '管理员生成SSO客户端密钥',
	'admin-delete-sso-client': '管理员删除SSO客户端',
	'admin-delete-user-sessions': '管理员踢出用户登录设备',
	'admin-disable-user': '管理员禁用用户',
	'admin-discard-sso-callback': '管理员丢弃SSO Callback队列项',
	'admin-dispatch-sso-callbacks': '管理员立即投递SSO Callback',
	'admin-enable-user': '管理员启用用户',
	'admin-reset-user-password': '管理员重置用户密码',
	'admin-restore-user': '管理员恢复用户',
	'admin-retry-sso-callback': '管理员重试SSO Callback队列项',
	'admin-revoke-sso-client-grants': '管理员撤销客户端全部授权',
	'admin-revoke-sso-client-secret': '管理员撤销SSO客户端密钥',
	'admin-revoke-sso-client-tickets': '管理员撤销客户端SSO Ticket',
	'admin-revoke-sso-grant': '管理员撤销单个SSO授权',
	'admin-revoke-user-sso-grants': '管理员撤销用户全部SSO授权',
	'admin-revoke-user-sso-tickets': '管理员撤销用户SSO Ticket',
	'admin-update-sso-client': '管理员更新SSO客户端',
	'admin-update-sso-client-secret': '管理员更新SSO客户端密钥',
	'user-authorize-sso-client': '用户授权SSO客户端',
	'user-change-nickname': '用户修改昵称',
	'user-change-password': '用户修改密码',
	'user-change-username': '用户修改用户名',
	'user-clear-account-data': '用户清空云端数据',
	'user-delete-account': '用户删除账号',
	'user-delete-passkey': '用户删除通行密钥',
	'user-export-account-data': '用户导出账号数据',
	'user-login-failed': '用户登录失败',
	'user-login-succeeded': '用户登录成功',
	'user-logout-all-sessions': '用户退出全部设备',
	'user-logout-session': '用户退出登录',
	'user-register-account': '用户注册账号',
	'user-register-passkey': '用户添加通行密钥',
	'user-revoke-session': '用户撤销登录设备',
	'user-revoke-sso-grant': '用户撤销SSO授权',
};

const auditFilterReferenceGroups = [
	{
		label: '范围',
		values: scopeOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '动作',
		values: Object.entries(auditActionLabelMap).map(([value, label]) => ({
			label,
			value,
		})),
	},
	{
		label: '操作者类型',
		values: actorTypeOptions
			.filter((option) => option.value !== '')
			.map((option) => ({ label: option.label, value: option.value })),
	},
	{
		label: '目标类型',
		values: Object.entries(auditTargetTypeLabelMap).map(
			([value, label]) => ({ label, value })
		),
	},
] as const;

function getScopeLabel(scope: TScopeFilter) {
	return (
		scopeOptions.find((option) => option.value === scope)?.label ?? scope
	);
}

function getAuditScopeLabel(scope: string) {
	return auditScopeLabelMap[scope as keyof typeof auditScopeLabelMap];
}

function getAuditActorTypeLabel(actorType: string) {
	return auditActorTypeLabelMap[
		actorType as keyof typeof auditActorTypeLabelMap
	];
}

function getAuditTargetTypeLabel(targetType: string) {
	return auditTargetTypeLabelMap[targetType] ?? targetType;
}

function getAuditActionLabel(action: string) {
	return auditActionLabelMap[action] ?? action;
}

function createAdminAuditUserHref(userId: string) {
	return `/admin/users/${encodeURIComponent(userId)}`;
}

interface IAdminAuditIdCellProps {
	id: string | null;
	isUserId: boolean;
	trackingAction: string;
}

const AdminAuditIdCell = memo<IAdminAuditIdCellProps>(
	function AdminAuditIdCell({ id, isUserId, trackingAction }) {
		if (id === null) {
			return (
				<span className="break-all font-mono text-tiny text-foreground-500">
					无
				</span>
			);
		}

		if (!isUserId) {
			return (
				<span className="break-all font-mono text-tiny text-foreground-500">
					{id}
				</span>
			);
		}

		return (
			<AdminTableActionLink
				href={createAdminAuditUserHref(id)}
				onPress={() => {
					trackEvent(
						trackEvent.category.click,
						'Admin Audit Button',
						trackingAction,
						id
					);
				}}
			>
				{id}
			</AdminTableActionLink>
		);
	}
);

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

export interface IAdminAuditInitialData {
	action: string;
	actorId: string;
	actorType: TActorTypeFilter;
	admin: IAdminMeData | null;
	endTime?: number;
	isAuthLoading: boolean;
	logs: IAdminAuditLogListData | null;
	message: string | null;
	query: string;
	renderedAt: number;
	scope: TScopeFilter;
	startTime?: number;
	targetId: string;
	targetType: string;
}

interface IAdminAuditClientProps {
	initialData: IAdminAuditInitialData;
}

const AdminAuditRow = memo<{ log: IAdminAuditLogListData['logs'][number] }>(
	function AdminAuditRow({ log }) {
		return (
			<AdminTableRow>
				<AdminTableCell isNowrap>#{log.id}</AdminTableCell>
				<AdminTableCell isNowrap>
					{getAuditScopeLabel(log.scope)}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{getAuditActionLabel(log.action)}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{getAuditActorTypeLabel(log.actor_type)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminAuditIdCell
						id={log.actor_id}
						isUserId={log.actor_type === 'user'}
						trackingAction="Open Actor User"
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{getAuditTargetTypeLabel(log.target_type)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminAuditIdCell
						id={log.target_id}
						isUserId={log.target_type === 'user'}
						trackingAction="Open Target User"
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{createAdminSsoDateTimeText(log.created_at)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminSsoMetadata metadata={log.metadata} />
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

export default function AdminAuditClient({
	initialData,
}: IAdminAuditClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const requestIdRef = useRef(0);
	const isServerInitialRef = useRef(initialData.logs !== null);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [logs, setLogs] = useState<IAdminAuditLogListData | null>(
		initialData.logs
	);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(initialData.logs?.page ?? 1);
	const [pageInput, setPageInput] = useState(
		createAdminSsoPageInputValue(initialData.logs?.page ?? 1)
	);
	const [queryInput, setQueryInput] = useState(initialData.query);
	const [scope, setScope] = useState<TScopeFilter>(initialData.scope);
	const [actionInput, setActionInput] = useState(initialData.action);
	const [actorIdInput, setActorIdInput] = useState(initialData.actorId);
	const [actorType, setActorType] = useState<TActorTypeFilter>(
		initialData.actorType
	);
	const [targetIdInput, setTargetIdInput] = useState(initialData.targetId);
	const [targetTypeInput, setTargetTypeInput] = useState(
		initialData.targetType
	);
	const [startTimeInput, setStartTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.startTime)
	);
	const [endTimeInput, setEndTimeInput] = useState(
		createAdminSsoTimeInputValue(initialData.endTime)
	);

	const createListOptions = useCallback(
		(nextPage = page) => {
			const startTime = parseAdminSsoTimeInputValue(startTimeInput);
			const endTime = parseAdminSsoTimeInputValue(endTimeInput);
			const query = queryInput.trim();

			return {
				page: nextPage,
				pageSize: logs?.page_size ?? 20,
				...(scope === '' ? {} : { scope }),
				...(actionInput.trim() === ''
					? {}
					: { action: actionInput.trim() }),
				...(actorIdInput.trim() === ''
					? {}
					: { actorId: actorIdInput.trim() }),
				...(actorType === '' ? {} : { actorType }),
				...(endTime === undefined ? {} : { endTime }),
				...(query.length < ADMIN_AUDIT_MIN_QUERY_LENGTH
					? {}
					: { query }),
				...(startTime === undefined ? {} : { startTime }),
				...(targetIdInput.trim() === ''
					? {}
					: { targetId: targetIdInput.trim() }),
				...(targetTypeInput.trim() === ''
					? {}
					: { targetType: targetTypeInput.trim() }),
			};
		},
		[
			actionInput,
			actorIdInput,
			actorType,
			endTimeInput,
			logs?.page_size,
			page,
			queryInput,
			scope,
			startTimeInput,
			targetIdInput,
			targetTypeInput,
		]
	);

	const handleErrorResult = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				setLogs(null);
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const refreshLogs = useCallback(
		(nextPage = page) => {
			const query = queryInput.trim();
			if (query !== '' && query.length < ADMIN_AUDIT_MIN_QUERY_LENGTH) {
				setMessage('搜索关键字至少需要 2 个字符');
				return;
			}

			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminAuditLogs(createListOptions(nextPage))
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						handleErrorResult(result);
						return;
					}

					setLogs(result.data);
					setPage(result.data.page);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取审计日志失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[createListOptions, handleErrorResult, page, queryInput]
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
					refreshLogs(page);
				}, ADMIN_SSO_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [admin, page, refreshLogs]);

	useEffect(() => {
		setPageInput(createAdminSsoPageInputValue(page));
	}, [page]);

	useEffect(() => {
		if (pathname !== '/admin/audit') {
			return;
		}

		const startTime = parseAdminSsoTimeInputValue(startTimeInput);
		const endTime = parseAdminSsoTimeInputValue(endTimeInput);
		const nextHref = createAdminSsoHref('/admin/audit', {
			action: actionInput,
			actorId: actorIdInput,
			actorType,
			page,
			query: queryInput,
			scope,
			targetId: targetIdInput,
			targetType: targetTypeInput,
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
		actionInput,
		actorIdInput,
		actorType,
		endTimeInput,
		page,
		pathname,
		queryInput,
		router,
		scope,
		startTimeInput,
		targetIdInput,
		targetTypeInput,
	]);

	const handleRefresh = useCallback(() => {
		trackEvent(trackEvent.category.click, 'Admin Audit Button', 'Refresh');
		refreshLogs(page);
	}, [page, refreshLogs]);

	const handleTextFilterChange = useCallback(
		(setter: (value: string) => void) => (value: string) => {
			setPage(1);
			setter(value);
		},
		[]
	);

	const handleScopeAction = useCallback((key: Key) => {
		setPage(1);
		setScope(String(key) as TScopeFilter);
	}, []);

	const handleActorTypeAction = useCallback((key: Key) => {
		setPage(1);
		setActorType(String(key) as TActorTypeFilter);
	}, []);

	const handlePreviousPage = useCallback(() => {
		setPage((currentPage) => Math.max(1, currentPage - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((currentPage) =>
			Math.min(
				Math.max(1, logs?.total_pages ?? currentPage + 1),
				currentPage + 1
			)
		);
	}, [logs?.total_pages]);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();
			setPage(parseAdminSsoPageInput(pageInput, logs?.total_pages ?? 1));
		},
		[logs?.total_pages, pageInput]
	);

	const rows = useMemo(
		() =>
			logs?.logs.map((log) => <AdminAuditRow key={log.id} log={log} />) ??
			[],
		[logs?.logs]
	);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="审计日志"
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
					title="审计日志"
				/>
			</AdminShell>
		);
	}

	const advancedFilterCount = [
		actionInput,
		actorIdInput,
		targetIdInput,
		targetTypeInput,
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
						<AdminHeaderActionLink href="/admin/sso" icon={faPlug}>
							SSO客户端
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/announcements"
							icon={faBullhorn}
						>
							站点通知
						</AdminHeaderActionLink>
					</>
				}
				icon={faClipboardList}
				title="审计日志"
			/>

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页日志"
					value={logs === null ? '读取中' : logs.logs.length}
				/>
				<AdminMetric
					label="筛选总数"
					value={logs === null ? '读取中' : logs.total_count}
				/>
				<AdminMetric label="范围" value={getScopeLabel(scope)} />
				<AdminMetric
					label="页码"
					value={logs === null ? '读取中' : logs.page}
				/>
			</AdminMetricPanel>

			<AdminFilterPanel icon={faMagnifyingGlass}>
				<AdminSearchInput
					ariaLabel="搜索审计日志"
					icon={faMagnifyingGlass}
					placeholder="范围、动作、操作者、目标"
					value={queryInput}
					onValueChange={handleTextFilterChange(setQueryInput)}
				/>
				<AdminAdvancedFilterPopover
					activeCount={advancedFilterCount}
					reference={
						<AdminFilterReferencePanel
							groups={auditFilterReferenceGroups}
						/>
					}
				>
					<Input
						aria-label="按动作过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="动作"
						value={actionInput}
						onValueChange={handleTextFilterChange(setActionInput)}
					/>
					<Input
						aria-label="按操作者ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="操作者ID"
						value={actorIdInput}
						onValueChange={handleTextFilterChange(setActorIdInput)}
					/>
					<Input
						aria-label="按目标类型过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="目标类型"
						value={targetTypeInput}
						onValueChange={handleTextFilterChange(
							setTargetTypeInput
						)}
					/>
					<Input
						aria-label="按目标ID过滤"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="目标ID"
						value={targetIdInput}
						onValueChange={handleTextFilterChange(setTargetIdInput)}
					/>
					<Input
						aria-label="开始时间"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="开始时间"
						type="datetime-local"
						value={startTimeInput}
						onValueChange={handleTextFilterChange(
							setStartTimeInput
						)}
					/>
					<Input
						aria-label="结束时间"
						className="w-full"
						classNames={adminAdvancedFilterInputClassNames}
						placeholder="结束时间"
						type="datetime-local"
						value={endTimeInput}
						onValueChange={handleTextFilterChange(setEndTimeInput)}
					/>
				</AdminAdvancedFilterPopover>
				<AdminDropdownFilter
					ariaLabel="筛选审计范围"
					options={scopeOptions}
					value={scope}
					onAction={handleScopeAction}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选操作者类型"
					options={actorTypeOptions}
					value={actorType}
					onAction={handleActorTypeAction}
				/>
				<AdminFilterActionButton
					isLoading={isLoading}
					onPress={handleRefresh}
				>
					刷新
				</AdminFilterActionButton>
			</AdminFilterPanel>

			{message !== null && <AdminMessage message={message} />}

			{logs === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取审计日志
				</AdminEmptyState>
			) : logs.logs.length === 0 ? (
				<AdminEmptyState icon={faClipboardList}>
					暂无审计日志
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>ID</AdminTableHeadCell>
							<AdminTableHeadCell>范围</AdminTableHeadCell>
							<AdminTableHeadCell>动作</AdminTableHeadCell>
							<AdminTableHeadCell>操作者类型</AdminTableHeadCell>
							<AdminTableHeadCell>操作者ID</AdminTableHeadCell>
							<AdminTableHeadCell>目标类型</AdminTableHeadCell>
							<AdminTableHeadCell>目标ID</AdminTableHeadCell>
							<AdminTableHeadCell>时间</AdminTableHeadCell>
							<AdminTableHeadCell>元数据</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>{rows}</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={logs?.page ?? page}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={logs?.page_size}
				totalCount={logs?.total_count}
				totalLabel="条审计日志"
				totalPages={Math.max(1, logs?.total_pages ?? page)}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
