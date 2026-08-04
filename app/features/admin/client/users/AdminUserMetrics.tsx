'use client';

import { memo } from 'react';

import type { IAdminUserListData } from '@/features/account/contracts';
import {
	AdminMetric,
	AdminMetricPanel,
} from '@/features/admin/client/components/panels';
import { ADMIN_STATUS_LABEL_MAP } from '@/features/admin/copy';

interface IAdminUserMetricsProps {
	page: number;
	pageSize: number;
	statusFilterLabel: string;
	totalCount: number | null;
	totalPages: number | null;
	userCount: number;
	users: IAdminUserListData | null;
}

export const AdminUserMetrics = memo<IAdminUserMetricsProps>(
	function AdminUserMetrics({
		page,
		pageSize,
		statusFilterLabel,
		totalCount,
		totalPages,
		userCount,
		users,
	}) {
		return (
			<AdminMetricPanel className="sm:grid-cols-2 lg:grid-cols-4">
				<AdminMetric
					label="用户总数"
					value={
						users === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: `${totalCount ?? userCount}`
					}
				/>
				<AdminMetric
					label="页码"
					value={
						users === null
							? `第${page}页`
							: `第${users.page} / ${Math.max(1, totalPages ?? 0)}页`
					}
				/>
				<AdminMetric
					label="本页用户"
					value={
						users === null
							? ADMIN_STATUS_LABEL_MAP.reading
							: `${userCount} / ${pageSize}`
					}
				/>
				<AdminMetric label="筛选状态" value={statusFilterLabel} />
			</AdminMetricPanel>
		);
	}
);
