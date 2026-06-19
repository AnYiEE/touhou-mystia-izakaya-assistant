'use client';

import {
	type Key,
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import {
	faBullhorn,
	faClock,
	faPlus,
	faSearch,
	faServer,
	faShieldHalved,
	faTrash,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Switch, cn } from '@/design/ui/components';

import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminAnnouncementLevelBadge,
	AdminAnnouncementStatusBadge,
	AdminConfirmButton,
	AdminDropdownFilter,
	AdminEmptyState,
	AdminEntityCell,
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
} from '../components';
import { trackEvent } from '@/components/analytics';
import TimeAgo from '@/components/timeAgo';

import {
	type TAdminApiResult,
	cleanupAdminAnnouncementRecords,
	fetchAdminMe,
	listAdminAnnouncements,
} from '../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type { IAdminMeData } from '@/lib/account/shared/types';
import type {
	IAdminAnnouncementListData,
	IAdminAnnouncementProfile,
	TAnnouncementAudience,
	TAnnouncementComputedStatus,
	TAnnouncementLevel,
} from '@/lib/announcements/shared/types';

const pageInputRegexp = /^\d*$/u;

const AUDIENCE_LABEL_MAP = {
	all: '全部',
	anonymous: '未登录',
	authenticated: '已登录',
	targeted: '指定用户',
} as const satisfies Record<TAnnouncementAudience, string>;

const STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{ label: '展示中', value: 'active' },
	{ label: '待开始', value: 'scheduled' },
	{ label: '已结束', value: 'ended' },
	{ label: '已停用', value: 'disabled' },
	{ label: '已归档', value: 'archived' },
] as const satisfies Array<{
	label: string;
	value: TAnnouncementComputedStatus | '';
}>;

const LEVEL_FILTER_OPTIONS = [
	{ label: '全部等级', value: '' },
	{ label: '信息', value: 'info' },
	{ label: '成功', value: 'success' },
	{ label: '警告', value: 'warning' },
	{ label: '危险', value: 'danger' },
	{ label: '重要', value: 'critical' },
] as const satisfies Array<{ label: string; value: TAnnouncementLevel | '' }>;

const AUDIENCE_FILTER_OPTIONS = [
	{ label: '全部受众', value: '' },
	{ label: '全部用户', value: 'all' },
	{ label: '未登录', value: 'anonymous' },
	{ label: '已登录', value: 'authenticated' },
	{ label: '指定用户', value: 'targeted' },
] as const satisfies Array<{
	label: string;
	value: TAnnouncementAudience | '';
}>;

type TConfirmAction = 'cleanup' | null;

function checkAdminUnauthorizedActionResult(
	result: Extract<TAdminApiResult, { status: 'error' }>
) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}

function createDateTimeLabel(timestamp: number | null) {
	return timestamp === null
		? '不限'
		: new Date(timestamp).toLocaleString('zh-CN');
}

interface IAdminAnnouncementRowProps {
	announcement: IAdminAnnouncementProfile;
	initialNowTimestamp: number;
}

const AdminAnnouncementRow = memo<IAdminAnnouncementRowProps>(
	function AdminAnnouncementRow({ announcement, initialNowTimestamp }) {
		return (
			<AdminTableRow
				className={cn(
					announcement.computed_status === 'archived' && 'opacity-70'
				)}
			>
				<AdminTableCell className="w-96 max-w-96">
					<AdminEntityCell
						className="max-w-96"
						id={announcement.id}
						title={announcement.title}
					/>
				</AdminTableCell>
				<AdminTableCell>
					<AdminAnnouncementStatusBadge
						status={announcement.computed_status}
					/>
				</AdminTableCell>
				<AdminTableCell>
					<AdminAnnouncementLevelBadge level={announcement.level} />
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{AUDIENCE_LABEL_MAP[announcement.audience]}
					{announcement.audience === 'targeted' && (
						<span className="ml-1 text-foreground-400">
							({announcement.target_user_ids.length})
						</span>
					)}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{announcement.priority}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{announcement.dismissible ? '可关闭' : '不可关闭'}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					{createDateTimeLabel(announcement.starts_at)}
					<span className="mx-1 text-foreground-400">/</span>
					{createDateTimeLabel(announcement.ends_at)}
				</AdminTableCell>
				<AdminTableCell isNowrap>
					<TimeAgo
						initialNowTimestamp={initialNowTimestamp}
						timestamp={announcement.updated_at}
					/>
				</AdminTableCell>
				<AdminTableCell isNowrap className="text-right">
					<AdminTableActionLink
						href={`/admin/announcements/${encodeURIComponent(
							announcement.id
						)}`}
					>
						编辑
					</AdminTableActionLink>
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

export interface IAdminAnnouncementsInitialData {
	admin: IAdminMeData | null;
	announcements: IAdminAnnouncementListData | null;
	isAuthLoading: boolean;
	message: string | null;
	renderedAt: number;
}

interface IAdminAnnouncementsClientProps {
	initialData: IAdminAnnouncementsInitialData;
}

export default function AdminAnnouncementsClient({
	initialData,
}: IAdminAnnouncementsClientProps) {
	const requestIdRef = useRef(0);
	const isQueryInputInitializedRef = useRef(false);
	const isServerInitialAnnouncementsRef = useRef(
		initialData.announcements !== null
	);
	const skipNextAutoRefreshRef = useRef(false);
	const [admin, setAdmin] = useState<IAdminMeData | null>(initialData.admin);
	const [announcements, setAnnouncements] =
		useState<IAdminAnnouncementListData | null>(initialData.announcements);
	const [includeArchived, setIncludeArchived] = useState(false);
	const [isAuthLoading, setIsAuthLoading] = useState(
		initialData.isAuthLoading
	);
	const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);
	const [isCleaning, setIsCleaning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(1);
	const [pageInput, setPageInput] = useState('1');
	const [query, setQuery] = useState('');
	const [queryInput, setQueryInput] = useState('');
	const [statusFilter, setStatusFilter] = useState<
		TAnnouncementComputedStatus | ''
	>('');
	const [levelFilter, setLevelFilter] = useState<TAnnouncementLevel | ''>('');
	const [audienceFilter, setAudienceFilter] = useState<
		TAnnouncementAudience | ''
	>('');

	const refreshAnnouncements = useCallback(
		(overridePage?: number, overrideQuery?: string) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminAnnouncements({
				audience: audienceFilter,
				computedStatus: statusFilter,
				includeArchived,
				level: levelFilter,
				page: overridePage ?? page,
				query: overrideQuery ?? query,
			})
				.then((result) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					if (result.status === 'error') {
						if (checkAdminUnauthorizedActionResult(result)) {
							clearAdminSession();
							setAdmin(null);
							setAnnouncements(null);
							return;
						}

						setMessage(result.displayMessage);
						return;
					}

					setAnnouncements(result.data);
				})
				.catch((error: unknown) => {
					if (requestIdRef.current !== requestId) {
						return;
					}
					setMessage(
						error instanceof Error
							? error.message
							: '读取站点通知失败'
					);
				})
				.finally(() => {
					if (requestIdRef.current === requestId) {
						setIsLoading(false);
					}
				});
		},
		[
			audienceFilter,
			includeArchived,
			levelFilter,
			page,
			query,
			statusFilter,
		]
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

	const handleActionError = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (checkAdminUnauthorizedActionResult(result)) {
				clearAdminSession();
				setAdmin(null);
				return;
			}

			setMessage(result.displayMessage);
		},
		[]
	);

	const handleQueryInputChange = useCallback((value: string) => {
		setQueryInput(value);
	}, []);

	const handleStatusFilterAction = useCallback((key: Key) => {
		setPage(1);
		setStatusFilter(String(key) as TAnnouncementComputedStatus | '');
	}, []);

	const handleLevelFilterAction = useCallback((key: Key) => {
		setPage(1);
		setLevelFilter(String(key) as TAnnouncementLevel | '');
	}, []);

	const handleAudienceFilterAction = useCallback((key: Key) => {
		setPage(1);
		setAudienceFilter(String(key) as TAnnouncementAudience | '');
	}, []);

	const handleRefreshPress = useCallback(() => {
		const nextQuery = queryInput;

		skipNextAutoRefreshRef.current = nextQuery !== query || page !== 1;
		setPage(1);
		setQuery(nextQuery);
		refreshAnnouncements(1, nextQuery);
	}, [page, query, queryInput, refreshAnnouncements]);

	const handleCleanup = useCallback(() => {
		if (isCleaning) {
			return;
		}

		const csrfToken = admin?.csrf_token;
		if (csrfToken === undefined) {
			setMessage('管理员登录已失效，请重新登录。');
			return;
		}
		trackEvent(
			trackEvent.category.click,
			'Remove Button',
			'Cleanup Records'
		);

		setIsCleaning(true);
		setConfirmAction(null);
		setMessage(null);
		void cleanupAdminAnnouncementRecords(csrfToken)
			.then((result) => {
				if (result.status === 'error') {
					handleActionError(result);
					return;
				}

				setMessage(
					`已清理${result.data.deleted_dismissals}条关闭记录、${result.data.deleted_versions}条历史版本`
				);
				refreshAnnouncements();
			})
			.catch((error: unknown) => {
				setMessage(
					error instanceof Error ? error.message : '清理通知记录失败'
				);
			})
			.finally(() => {
				setIsCleaning(false);
			});
	}, [
		admin?.csrf_token,
		handleActionError,
		isCleaning,
		refreshAnnouncements,
	]);

	const handleLeaveAnnouncementList = useCallback(() => {
		requestIdRef.current += 1;
		setIsLoading(false);
	}, []);

	const handleOpenSsoClientList = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Link',
			'Open List From Announcements'
		);
		handleLeaveAnnouncementList();
	}, [handleLeaveAnnouncementList]);

	const handlePreviousPage = useCallback(() => {
		setPage((current) => Math.max(1, current - 1));
	}, []);

	const handleNextPage = useCallback(() => {
		setPage((current) => current + 1);
	}, []);

	const handlePageInputChange = useCallback((value: string) => {
		if (pageInputRegexp.test(value)) {
			setPageInput(value);
		}
	}, []);

	const handlePageJumpSubmit = useCallback(
		(event: SyntheticEvent<HTMLFormElement>) => {
			event.preventDefault();

			const targetPage = Number.parseInt(pageInput, 10);
			if (!Number.isSafeInteger(targetPage) || targetPage < 1) {
				setPageInput(String(page));
				return;
			}

			const maxPage = Math.max(
				1,
				announcements?.total_pages ?? targetPage
			);
			setPage(Math.min(targetPage, maxPage));
		},
		[announcements?.total_pages, page, pageInput]
	);

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
			if (isServerInitialAnnouncementsRef.current) {
				isServerInitialAnnouncementsRef.current = false;
			} else if (skipNextAutoRefreshRef.current) {
				skipNextAutoRefreshRef.current = false;
			} else {
				timeoutId = globalThis.setTimeout(() => {
					refreshAnnouncements();
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				globalThis.clearTimeout(timeoutId);
			}
		};
	}, [
		admin,
		audienceFilter,
		includeArchived,
		levelFilter,
		page,
		query,
		refreshAnnouncements,
		statusFilter,
	]);

	useEffect(() => {
		if (!isQueryInputInitializedRef.current) {
			isQueryInputInitializedRef.current = true;
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			setPage(1);
			setQuery(queryInput);
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [queryInput]);

	useEffect(() => {
		setPageInput(String(page));
	}, [page]);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label="读取会话状态"
				subtitle="正在校验管理员会话"
				title="站点通知"
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
					title="站点通知"
				/>
			</AdminShell>
		);
	}

	const archivedCount = announcements?.archived_count ?? 0;
	const activeCount = announcements?.active_count ?? null;
	const currentPage = announcements?.page ?? page;
	const filteredCount = announcements?.filtered_count ?? null;
	const totalCount = announcements?.total_count ?? null;
	const totalPages = Math.max(1, announcements?.total_pages ?? 1);

	return (
		<AdminShell>
			<AdminHeader
				actions={
					<>
						<AdminConfirmButton
							color="danger"
							confirmAction="cleanup"
							confirmLabel="确认清理"
							icon={faTrash}
							isLoading={isCleaning}
							onConfirm={handleCleanup}
							onOpenChange={setConfirmAction}
							openAction={confirmAction}
						>
							清理历史
						</AdminConfirmButton>
						<AdminHeaderActionLink
							href="/admin"
							icon={faUsers}
							onPress={handleLeaveAnnouncementList}
						>
							用户管理
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							href="/admin/sso"
							icon={faServer}
							onPress={handleOpenSsoClientList}
						>
							SSO客户端
						</AdminHeaderActionLink>
						<AdminHeaderActionLink
							color="primary"
							href="/admin/announcements/new"
							icon={faPlus}
						>
							新建
						</AdminHeaderActionLink>
					</>
				}
				icon={faBullhorn}
				title="站点通知"
			/>

			<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-4">
				<AdminMetric
					label="当前页通知"
					value={
						announcements === null
							? '读取中'
							: announcements.announcements.length
					}
				/>
				<AdminMetric
					label="全局展示中"
					value={activeCount ?? '读取中'}
				/>
				<AdminMetric
					label="全局已归档"
					value={announcements === null ? '读取中' : archivedCount}
				/>
				<AdminMetric label="全局总数" value={totalCount ?? '读取中'} />
			</AdminMetricPanel>

			<AdminFilterPanel icon={faSearch}>
				<AdminSearchInput
					ariaLabel="搜索通知标题或ID"
					icon={faSearch}
					placeholder="搜索通知标题或ID"
					value={queryInput}
					onValueChange={handleQueryInputChange}
				/>
				<Switch
					isSelected={includeArchived}
					onValueChange={(value) => {
						setPage(1);
						setIncludeArchived(value);
					}}
				>
					包含归档
				</Switch>
				<AdminDropdownFilter
					ariaLabel="筛选通知状态"
					onAction={handleStatusFilterAction}
					options={STATUS_FILTER_OPTIONS}
					value={statusFilter}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选通知等级"
					onAction={handleLevelFilterAction}
					options={LEVEL_FILTER_OPTIONS}
					value={levelFilter}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选通知受众"
					onAction={handleAudienceFilterAction}
					options={AUDIENCE_FILTER_OPTIONS}
					value={audienceFilter}
				/>
				<AdminFilterActionButton
					isLoading={isLoading}
					onPress={handleRefreshPress}
				>
					刷新
				</AdminFilterActionButton>
			</AdminFilterPanel>

			{message !== null && <AdminMessage message={message} />}

			{announcements === null ? (
				<AdminEmptyState icon={faClock}>
					正在读取站点通知
				</AdminEmptyState>
			) : announcements.announcements.length === 0 ? (
				<AdminEmptyState icon={faBullhorn}>
					暂无站点通知
				</AdminEmptyState>
			) : (
				<AdminTable>
					<AdminTableHeader>
						<tr>
							<AdminTableHeadCell>通知</AdminTableHeadCell>
							<AdminTableHeadCell>状态</AdminTableHeadCell>
							<AdminTableHeadCell>等级</AdminTableHeadCell>
							<AdminTableHeadCell>受众</AdminTableHeadCell>
							<AdminTableHeadCell>优先级</AdminTableHeadCell>
							<AdminTableHeadCell>关闭</AdminTableHeadCell>
							<AdminTableHeadCell>时间</AdminTableHeadCell>
							<AdminTableHeadCell>更新</AdminTableHeadCell>
							<AdminTableHeadCell className="text-right">
								操作
							</AdminTableHeadCell>
						</tr>
					</AdminTableHeader>
					<tbody>
						{announcements.announcements.map((announcement) => (
							<AdminAnnouncementRow
								key={announcement.id}
								announcement={announcement}
								initialNowTimestamp={initialData.renderedAt}
							/>
						))}
					</tbody>
				</AdminTable>
			)}

			<AdminPagination
				currentPage={currentPage}
				isLoading={isLoading}
				pageInput={pageInput}
				pageSize={announcements?.page_size}
				totalCount={filteredCount ?? totalCount ?? undefined}
				totalLabel="条通知"
				totalPages={totalPages}
				onNextPage={handleNextPage}
				onPageInputChange={handlePageInputChange}
				onPageJumpSubmit={handlePageJumpSubmit}
				onPreviousPage={handlePreviousPage}
			/>
		</AdminShell>
	);
}
