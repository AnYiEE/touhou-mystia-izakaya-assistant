'use client';

import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBullhorn,
	faClock,
	faPlus,
	faRotate,
	faSearch,
	faServer,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import { Button, Switch, cn } from '@/design/ui/components';

import {
	ADMIN_LIST_DEBOUNCE_MS,
	AdminAnnouncementLevelBadge,
	AdminAnnouncementStatusBadge,
	AdminEmptyState,
	AdminEntityCell,
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
	fetchAdminMe,
	listAdminAnnouncements,
} from '../api';
import { clearAdminSession } from '@/lib/account/client/adminSession';
import type { IAdminMeData } from '@/lib/account/shared/types';
import type {
	IAdminAnnouncementListData,
	IAdminAnnouncementProfile,
	TAnnouncementAudience,
} from '@/lib/announcements/shared/types';

const pageInputRegexp = /^\d*$/u;

const AUDIENCE_LABEL_MAP = {
	all: '全部',
	anonymous: '未登录',
	authenticated: '已登录',
	targeted: '指定用户',
} as const satisfies Record<TAnnouncementAudience, string>;

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
					<div className="flex flex-wrap gap-2">
						<AdminAnnouncementStatusBadge
							status={announcement.computed_status}
						/>
						<AdminAnnouncementLevelBadge
							level={announcement.level}
						/>
					</div>
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
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(initialData.message);
	const [page, setPage] = useState(1);
	const [pageInput, setPageInput] = useState('1');
	const [query, setQuery] = useState('');
	const [queryInput, setQueryInput] = useState('');

	const refreshAnnouncements = useCallback(
		(overridePage?: number, overrideQuery?: string) => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setIsLoading(true);
			setMessage(null);

			void listAdminAnnouncements({
				includeArchived,
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
		[includeArchived, page, query]
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

	const handleQueryInputChange = useCallback((value: string) => {
		setQueryInput(value);
	}, []);

	const handleRefreshPress = useCallback(() => {
		const nextQuery = queryInput;

		skipNextAutoRefreshRef.current = nextQuery !== query || page !== 1;
		setPage(1);
		setQuery(nextQuery);
		refreshAnnouncements(1, nextQuery);
	}, [page, query, queryInput, refreshAnnouncements]);

	const handleLeaveAnnouncementList = useCallback(() => {
		requestIdRef.current += 1;
		setIsLoading(false);
	}, []);

	const handleOpenSsoClientList = useCallback(() => {
		trackEvent(
			trackEvent.category.click,
			'Admin SSO Client Button',
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
	}, [admin, includeArchived, page, query, refreshAnnouncements]);

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

	const visibleCount =
		announcements?.announcements.filter(
			(announcement) => announcement.computed_status === 'active'
		).length ?? 0;
	const archivedCount = announcements?.archived_count ?? 0;
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
					label="展示中"
					value={announcements === null ? '读取中' : visibleCount}
				/>
				<AdminMetric
					label="已归档"
					value={announcements === null ? '读取中' : archivedCount}
				/>
				<AdminMetric label="总数" value={totalCount ?? '读取中'} />
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
				<Button
					className="h-12 min-h-12 w-full md:w-auto md:flex-none"
					color="primary"
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
					onPress={handleRefreshPress}
				>
					刷新
				</Button>
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
