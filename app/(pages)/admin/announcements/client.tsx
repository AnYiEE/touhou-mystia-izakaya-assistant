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

import { Button, Input, Link, Switch, cn } from '@/design/ui/components';

import {
	AdminEmptyState,
	AdminHeader,
	AdminInputIcon,
	AdminMessage,
	AdminMetric,
	AdminPanel,
	AdminPanelTitle,
	AdminShell,
	AdminTable,
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
import { globalStore } from '@/stores';
import type {
	IAdminAnnouncementListData,
	IAdminAnnouncementProfile,
	TAnnouncementAudience,
	TAnnouncementComputedStatus,
	TAnnouncementLevel,
} from '@/lib/announcements/shared/types';

const tableHeadCellClassName = 'px-4 py-3 font-medium';
const tableCellClassName = 'px-4 py-3 align-middle';
const tableNowrapCellClassName = `${tableCellClassName} whitespace-nowrap`;
const pageInputRegexp = /^\d*$/u;

const STATUS_META_MAP = {
	active: {
		className:
			'border-success/30 bg-success/15 text-success-700 dark:text-success',
		label: '展示中',
	},
	archived: {
		className: 'border-default-300 bg-default/30 text-foreground-500',
		label: '已归档',
	},
	disabled: {
		className:
			'border-warning/30 bg-warning/20 text-warning-700 dark:text-warning-600',
		label: '已停用',
	},
	ended: {
		className: 'border-default-300 bg-default/30 text-foreground-500',
		label: '已结束',
	},
	scheduled: {
		className:
			'border-primary/30 bg-primary/15 text-primary-700 dark:text-primary',
		label: '待开始',
	},
} as const satisfies Record<
	TAnnouncementComputedStatus,
	{ className: string; label: string }
>;

const LEVEL_LABEL_MAP = {
	critical: '重要',
	danger: '危险',
	info: '信息',
	success: '成功',
	warning: '警告',
} as const satisfies Record<TAnnouncementLevel, string>;

const LEVEL_META_MAP = {
	critical: {
		className:
			'border-primary/30 bg-primary/15 text-primary-700 dark:text-primary',
	},
	danger: {
		className:
			'border-danger/30 bg-danger/15 text-danger-700 dark:text-danger',
	},
	info: { className: 'border-default-300 bg-default/30 text-foreground-600' },
	success: {
		className:
			'border-success/30 bg-success/15 text-success-700 dark:text-success',
	},
	warning: {
		className:
			'border-warning/30 bg-warning/20 text-warning-700 dark:text-warning-600',
	},
} as const satisfies Record<TAnnouncementLevel, { className: string }>;

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

function getStatusBadge(status: TAnnouncementComputedStatus) {
	const meta = STATUS_META_MAP[status];

	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
				meta.className
			)}
		>
			{meta.label}
		</span>
	);
}

function getLevelBadge(level: TAnnouncementLevel) {
	const meta = LEVEL_META_MAP[level];

	return (
		<span
			className={cn(
				'inline-flex h-7 items-center rounded-small border px-2 text-tiny font-medium',
				meta.className
			)}
		>
			{LEVEL_LABEL_MAP[level]}
		</span>
	);
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
				<td className={cn(tableCellClassName, 'w-96 max-w-96')}>
					<div className="min-w-0 max-w-96">
						<p className="truncate text-small font-medium leading-5 text-foreground-800">
							{announcement.title}
						</p>
						<p className="truncate font-mono text-[0.7rem] leading-4 text-foreground-400">
							{announcement.id}
						</p>
					</div>
				</td>
				<td className={tableNowrapCellClassName}>
					{getStatusBadge(announcement.computed_status)}
				</td>
				<td className={tableNowrapCellClassName}>
					{getLevelBadge(announcement.level)}
				</td>
				<td className={tableNowrapCellClassName}>
					{AUDIENCE_LABEL_MAP[announcement.audience]}
					{announcement.audience === 'targeted' && (
						<span className="ml-1 text-foreground-400">
							({announcement.target_user_ids.length})
						</span>
					)}
				</td>
				<td className={tableNowrapCellClassName}>
					{announcement.priority}
				</td>
				<td className={tableNowrapCellClassName}>
					{announcement.dismissible ? '可关闭' : '不可关闭'}
				</td>
				<td className={tableNowrapCellClassName}>
					{createDateTimeLabel(announcement.starts_at)}
					<span className="mx-1 text-foreground-400">/</span>
					{createDateTimeLabel(announcement.ends_at)}
				</td>
				<td className={tableNowrapCellClassName}>
					<TimeAgo
						initialNowTimestamp={initialNowTimestamp}
						timestamp={announcement.updated_at}
					/>
				</td>
				<td className={cn(tableNowrapCellClassName, 'text-right')}>
					<Link
						animationUnderline={false}
						className="rounded-small px-2 py-1 text-small text-primary-600 transition-background hover:bg-primary/15 motion-reduce:transition-none dark:text-primary"
						href={`/admin/announcements/${encodeURIComponent(
							announcement.id
						)}`}
					>
						编辑
					</Link>
				</td>
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
	const isHighAppearance = globalStore.persistence.highAppearance.use();
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

						setMessage(result.message);
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

	const handleQueryInputChange = useCallback((value: string) => {
		setQueryInput(value);
	}, []);

	const handleRefreshPress = useCallback(() => {
		const nextQuery = queryInput;
		const shouldRefreshImmediately = page === 1 && query === nextQuery;

		setPage(1);
		setQuery(nextQuery);

		if (shouldRefreshImmediately) {
			refreshAnnouncements(1, nextQuery);
		}
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
		if (admin !== null) {
			if (isServerInitialAnnouncementsRef.current) {
				isServerInitialAnnouncementsRef.current = false;
				return;
			}

			refreshAnnouncements();
		}
	}, [admin, includeArchived, page, query, refreshAnnouncements]);

	useEffect(() => {
		if (!isQueryInputInitializedRef.current) {
			isQueryInputInitializedRef.current = true;
			return;
		}

		const timeoutId = globalThis.setTimeout(() => {
			setPage(1);
			setQuery(queryInput);
		}, 300);

		return () => {
			globalThis.clearTimeout(timeoutId);
		};
	}, [queryInput]);

	useEffect(() => {
		setPageInput(String(page));
	}, [page]);

	if (isAuthLoading) {
		return (
			<AdminShell>
				<AdminHeader
					icon={faShieldHalved}
					subtitle="正在校验管理员会话"
					title="站点通知"
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
							onPress={handleLeaveAnnouncementList}
						>
							用户管理
						</Button>
						<Button
							as={Link}
							animationUnderline={false}
							href="/admin/sso"
							startContent={
								<FontAwesomeIcon
									icon={faServer}
									className="w-3.5"
								/>
							}
							variant="flat"
							onPress={handleOpenSsoClientList}
						>
							SSO客户端
						</Button>
						<Button
							as={Link}
							animationUnderline={false}
							color="primary"
							href="/admin/announcements/new"
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
				icon={faBullhorn}
				title="站点通知"
			/>

			<AdminPanel className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
			</AdminPanel>

			<AdminPanel>
				<AdminPanelTitle icon={faSearch}>筛选</AdminPanelTitle>
				<div className="grid w-full items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_6.5rem]">
					<Input
						aria-label="搜索通知标题或ID"
						classNames={{ inputWrapper: 'h-12 min-h-12' }}
						placeholder="搜索通知标题或ID"
						startContent={<AdminInputIcon icon={faSearch} />}
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
						className="h-12 min-h-12 w-full"
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
				</div>
			</AdminPanel>

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
							<th className={tableHeadCellClassName}>通知</th>
							<th className={tableHeadCellClassName}>状态</th>
							<th className={tableHeadCellClassName}>等级</th>
							<th className={tableHeadCellClassName}>受众</th>
							<th className={tableHeadCellClassName}>优先级</th>
							<th className={tableHeadCellClassName}>关闭</th>
							<th className={tableHeadCellClassName}>时间</th>
							<th className={tableHeadCellClassName}>更新</th>
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

			<div
				className={cn(
					'flex flex-wrap items-center justify-between gap-3 rounded-small border border-default-200/80 px-3 py-2 text-small text-foreground-500',
					isHighAppearance
						? 'bg-content1/40 backdrop-blur'
						: 'bg-default-50/50 dark:bg-default-100/10'
				)}
			>
				<span>
					第{currentPage} / {totalPages}页
					{announcements !== null &&
						filteredCount !== null &&
						` · 每页${announcements.page_size} · 当前筛选共${filteredCount}条`}
					{totalCount !== null && ` · 总计${totalCount}条`}
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						isDisabled={page <= 1 || isLoading}
						size="sm"
						variant="flat"
						onPress={handlePreviousPage}
					>
						上一页
					</Button>
					<Button
						isDisabled={isLoading || currentPage >= totalPages}
						size="sm"
						variant="flat"
						onPress={handleNextPage}
					>
						下一页
					</Button>
					<form
						className="flex items-center gap-2"
						onSubmit={handlePageJumpSubmit}
					>
						<Input
							aria-label="跳转页码"
							className="w-20"
							classNames={{
								input: 'text-center',
								inputWrapper: 'h-8 min-h-8',
							}}
							inputMode="numeric"
							placeholder="页码"
							size="sm"
							value={pageInput}
							onValueChange={handlePageInputChange}
						/>
						<Button
							isDisabled={isLoading || pageInput.length === 0}
							size="sm"
							type="submit"
							variant="light"
						>
							跳转
						</Button>
					</form>
				</div>
			</div>
		</AdminShell>
	);
}
