'use client';

import TimeAgo from '@/design/ui/components/timeAgo';

import type { IAdminUserDetailData } from '@/features/account/contracts';
import {
	AdminMetric,
	AdminMetricPanel,
	AdminMutedText,
} from '@/features/admin/client/components/panels';
import { AdminStatusBadge } from '@/features/admin/client/components/statusBadges';

interface IUserOverviewMetricsProps {
	hasPassword: boolean;
	initialNowTimestamp: number;
	namespaces: IAdminUserDetailData['namespaces'];
	passkeys: IAdminUserDetailData['passkeys'];
	sessionCount: number;
	stateEpoch: number;
	userStatus: IAdminUserDetailData['user']['status'];
}

export function UserOverviewMetrics({
	hasPassword,
	initialNowTimestamp,
	namespaces,
	passkeys,
	sessionCount,
	stateEpoch,
	userStatus,
}: IUserOverviewMetricsProps) {
	const latestNamespaceUpdatedAt = namespaces.reduce<number | null>(
		(latest, namespace) =>
			latest === null
				? namespace.updated_at
				: Math.max(latest, namespace.updated_at),
		null
	);

	return (
		<AdminMetricPanel className="sm:grid-cols-2 xl:grid-cols-7">
			<AdminMetric
				label="状态"
				value={<AdminStatusBadge status={userStatus} />}
			/>
			<AdminMetric
				label="登录密码"
				value={hasPassword ? '已设置' : '未设置'}
			/>
			<AdminMetric label="活跃Session" value={sessionCount} />
			<AdminMetric
				className="sm:border-l-0 sm:pl-0 xl:border-l xl:border-default-200/80 xl:pl-3"
				label="State Epoch"
				value={stateEpoch}
			/>
			<AdminMetric label="同步命名空间" value={namespaces.length} />
			<AdminMetric label="通行密钥" value={passkeys.length} />
			<AdminMetric
				label="最近同步更新"
				value={
					latestNamespaceUpdatedAt === null ? (
						<AdminMutedText>无</AdminMutedText>
					) : (
						<TimeAgo
							initialNowTimestamp={initialNowTimestamp}
							timestamp={latestNamespaceUpdatedAt}
						/>
					)
				}
			/>
		</AdminMetricPanel>
	);
}

interface IUserIdentityMetricsProps {
	createdAt: number;
	initialNowTimestamp: number;
	lastLoginAt: number | null;
	userId: string;
}

export function UserIdentityMetrics({
	createdAt,
	initialNowTimestamp,
	lastLoginAt,
	userId,
}: IUserIdentityMetricsProps) {
	return (
		<AdminMetricPanel className="sm:grid-cols-3">
			<AdminMetric
				label="创建时间"
				value={
					<TimeAgo
						initialNowTimestamp={initialNowTimestamp}
						timestamp={createdAt}
					/>
				}
			/>
			<AdminMetric
				label="最近登录"
				value={
					lastLoginAt === null ? (
						<AdminMutedText>无</AdminMutedText>
					) : (
						<TimeAgo
							initialNowTimestamp={initialNowTimestamp}
							timestamp={lastLoginAt}
						/>
					)
				}
			/>
			<AdminMetric
				label="用户ID"
				value={
					<span className="break-all font-mono text-small">
						{userId}
					</span>
				}
			/>
		</AdminMetricPanel>
	);
}
