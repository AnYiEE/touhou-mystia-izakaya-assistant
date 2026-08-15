'use client';

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
import { cn } from '@heroui/theme';
import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import Switch from '@/design/ui/components/switch';
import TimeAgo from '@/design/ui/components/timeAgo';

import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
} from '@/domain/announcements/contracts';

import type { IAdminMeData } from '@/features/account/contracts';
import { fetchAdminMe } from '@/features/admin/client/api';
import { AdminConfirmButton } from '@/features/admin/client/components/confirmation';
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
	clearAdminSession,
	isAdminSessionInvalidResult,
} from '@/features/admin/client/session';
import type { TAdminApiResult } from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';
import type { IAdminAnnouncementsInitialData } from '@/features/announcements/admin/contracts';
import {
	ADMIN_ANNOUNCEMENT_MESSAGE_MAP,
	ANNOUNCEMENT_AUDIENCE_FILTER_OPTIONS,
	ANNOUNCEMENT_AUDIENCE_LABEL_MAP,
	ANNOUNCEMENT_LEVEL_FILTER_OPTIONS,
	ANNOUNCEMENT_STATUS_FILTER_OPTIONS,
	createAnnouncementCleanupSuccessMessage,
} from '@/features/announcements/admin/copy';
import {
	type IAdminAnnouncementListData,
	type IAdminAnnouncementProfile,
	type TAnnouncementComputedStatus,
} from '@/features/announcements/contracts';

import { cleanupAdminAnnouncementRecords, listAdminAnnouncements } from './api';
import {
	AdminAnnouncementLevelBadge,
	AdminAnnouncementStatusBadge,
} from './statusBadges';

const pageInputRegexp = /^\d*$/u;

type TConfirmAction = 'cleanup' | null;

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
					{ANNOUNCEMENT_AUDIENCE_LABEL_MAP[announcement.audience]}
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
						if (isAdminSessionInvalidResult(result)) {
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
						Error.isError(error)
							? error.message
							: ADMIN_ANNOUNCEMENT_MESSAGE_MAP.listReadFailed
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

	const handleActionError = useCallback(
		(result: Extract<TAdminApiResult, { status: 'error' }>) => {
			if (isAdminSessionInvalidResult(result)) {
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

	const handleStatusFilterAction = useCallback(
		(value: TAnnouncementComputedStatus | '') => {
			setPage(1);
			setStatusFilter(value);
		},
		[]
	);

	const handleLevelFilterAction = useCallback(
		(value: TAnnouncementLevel | '') => {
			setPage(1);
			setLevelFilter(value);
		},
		[]
	);

	const handleAudienceFilterAction = useCallback(
		(value: TAnnouncementAudience | '') => {
			setPage(1);
			setAudienceFilter(value);
		},
		[]
	);

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
			setMessage(ADMIN_ANNOUNCEMENT_MESSAGE_MAP.adminSessionExpired);
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
					createAnnouncementCleanupSuccessMessage({
						deletedDismissals: result.data.deleted_dismissals,
						deletedVersions: result.data.deleted_versions,
					})
				);
				refreshAnnouncements();
			})
			.catch((error: unknown) => {
				setMessage(
					Error.isError(error)
						? error.message
						: ADMIN_ANNOUNCEMENT_MESSAGE_MAP.cleanupFailed
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
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		if (admin !== null) {
			if (isServerInitialAnnouncementsRef.current) {
				isServerInitialAnnouncementsRef.current = false;
			} else if (skipNextAutoRefreshRef.current) {
				skipNextAutoRefreshRef.current = false;
			} else {
				timeoutId = setTimeout(() => {
					refreshAnnouncements();
				}, ADMIN_LIST_DEBOUNCE_MS);
			}
		}

		return () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
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

		const timeoutId = setTimeout(() => {
			setPage(1);
			setQuery(queryInput);
		}, ADMIN_LIST_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [queryInput]);

	useEffect(() => {
		setPageInput(String(page));
	}, [page]);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label={ADMIN_STATUS_LABEL_MAP.sessionReading}
				subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
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
					subtitle={message ?? ADMIN_MESSAGE_MAP.adminSignInRequired}
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
							? ADMIN_STATUS_LABEL_MAP.reading
							: announcements.announcements.length
					}
				/>
				<AdminMetric
					label="全局展示中"
					value={activeCount ?? ADMIN_STATUS_LABEL_MAP.reading}
				/>
				<AdminMetric
					label="全局已归档"
					value={
						announcements === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: archivedCount
					}
				/>
				<AdminMetric
					label="全局总数"
					value={totalCount ?? ADMIN_STATUS_LABEL_MAP.reading}
				/>
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
					options={ANNOUNCEMENT_STATUS_FILTER_OPTIONS}
					value={statusFilter}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选通知等级"
					onAction={handleLevelFilterAction}
					options={ANNOUNCEMENT_LEVEL_FILTER_OPTIONS}
					value={levelFilter}
				/>
				<AdminDropdownFilter
					ariaLabel="筛选通知受众"
					onAction={handleAudienceFilterAction}
					options={ANNOUNCEMENT_AUDIENCE_FILTER_OPTIONS}
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
					{ADMIN_ANNOUNCEMENT_MESSAGE_MAP.listReading}
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
