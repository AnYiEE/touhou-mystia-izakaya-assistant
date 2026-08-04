'use client';

import {
	faBullhorn,
	faClipboardList,
	faPlug,
	faShieldHalved,
	faUsers,
} from '@fortawesome/free-solid-svg-icons';

import {
	AdminLoadingState,
	AdminMessage,
} from '@/features/admin/client/components/feedback';
import { AdminPagination } from '@/features/admin/client/components/pagination';
import {
	AdminMetric,
	AdminMetricPanel,
} from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';
import type { IAdminAuditInitialData } from '@/features/admin/contracts';
import {
	ADMIN_MESSAGE_MAP,
	ADMIN_STATUS_LABEL_MAP,
} from '@/features/admin/copy';

import { AdminAuditFilters } from './AdminAuditFilters';
import { AdminAuditTable } from './AdminAuditTable';
import { getScopeLabel } from './presentation';
import { useAdminAuditController } from './useAdminAuditController';

interface IAdminAuditClientProps {
	initialData: IAdminAuditInitialData;
}

export default function AdminAuditClient({
	initialData,
}: IAdminAuditClientProps) {
	const {
		actionInput,
		actorIdInput,
		actorType,
		admin,
		endTimeInput,
		handleActorTypeAction,
		handleNextPage,
		handlePageInputChange,
		handlePageJumpSubmit,
		handlePreviousPage,
		handleRefresh,
		handleScopeAction,
		handleTextFilterChange,
		isAuthLoading,
		isLoading,
		logs,
		message,
		page,
		pageInput,
		queryInput,
		scope,
		setActionInput,
		setActorIdInput,
		setEndTimeInput,
		setQueryInput,
		setStartTimeInput,
		setTargetIdInput,
		setTargetTypeInput,
		startTimeInput,
		targetIdInput,
		targetTypeInput,
	} = useAdminAuditController(initialData);

	if (isAuthLoading) {
		return (
			<AdminLoadingState
				icon={faShieldHalved}
				label={ADMIN_STATUS_LABEL_MAP.sessionReading}
				subtitle={ADMIN_MESSAGE_MAP.adminSessionChecking}
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
					subtitle={message ?? ADMIN_MESSAGE_MAP.adminSignInRequired}
					title="审计日志"
				/>
			</AdminShell>
		);
	}

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
					value={
						logs === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: logs.logs.length
					}
				/>
				<AdminMetric
					label="筛选总数"
					value={
						logs === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: logs.total_count
					}
				/>
				<AdminMetric label="范围" value={getScopeLabel(scope)} />
				<AdminMetric
					label="页码"
					value={
						logs === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: logs.page
					}
				/>
			</AdminMetricPanel>

			<AdminAuditFilters
				actionInput={actionInput}
				actorIdInput={actorIdInput}
				actorType={actorType}
				endTimeInput={endTimeInput}
				isLoading={isLoading}
				onActionInputChange={setActionInput}
				onActorIdInputChange={setActorIdInput}
				onActorTypeAction={handleActorTypeAction}
				onEndTimeInputChange={setEndTimeInput}
				onQueryInputChange={setQueryInput}
				onRefresh={handleRefresh}
				onScopeAction={handleScopeAction}
				onStartTimeInputChange={setStartTimeInput}
				onTargetIdInputChange={setTargetIdInput}
				onTargetTypeInputChange={setTargetTypeInput}
				onTextFilterChange={handleTextFilterChange}
				queryInput={queryInput}
				scope={scope}
				startTimeInput={startTimeInput}
				targetIdInput={targetIdInput}
				targetTypeInput={targetTypeInput}
			/>

			{message !== null && <AdminMessage message={message} />}

			<AdminAuditTable logs={logs} />

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
