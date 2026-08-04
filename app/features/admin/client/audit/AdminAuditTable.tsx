'use client';

import { faClipboardList, faClock } from '@fortawesome/free-solid-svg-icons';
import { memo, useMemo } from 'react';

import type { IAdminAuditLogListData } from '@/features/account/contracts';
import { AdminEmptyState } from '@/features/admin/client/components/feedback';
import { AdminMetadata } from '@/features/admin/client/components/metadata';
import {
	AdminTable,
	AdminTableActionLink,
	AdminTableCell,
	AdminTableHeadCell,
	AdminTableHeader,
	AdminTableRow,
} from '@/features/admin/client/components/table';
import { createAdminDateTimeText } from '@/features/admin/client/inputValues';
import { ADMIN_MESSAGE_MAP } from '@/features/admin/copy';
import { trackEvent } from '@/features/analytics/client/trackEvent';

import {
	createAdminAuditUserHref,
	getAuditActionLabel,
	getAuditActorTypeLabel,
	getAuditScopeLabel,
	getAuditTargetTypeLabel,
} from './presentation';

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
					{createAdminDateTimeText(log.created_at)}
				</AdminTableCell>
				<AdminTableCell>
					<AdminMetadata metadata={log.metadata} />
				</AdminTableCell>
			</AdminTableRow>
		);
	}
);

interface IAdminAuditTableProps {
	logs: IAdminAuditLogListData | null;
}

export function AdminAuditTable({ logs }: IAdminAuditTableProps) {
	const rows = useMemo(
		() =>
			logs?.logs.map((log) => <AdminAuditRow key={log.id} log={log} />) ??
			[],
		[logs?.logs]
	);

	return logs === null ? (
		<AdminEmptyState icon={faClock}>
			{ADMIN_MESSAGE_MAP.auditLogReading}
		</AdminEmptyState>
	) : logs.logs.length === 0 ? (
		<AdminEmptyState icon={faClipboardList}>暂无审计日志</AdminEmptyState>
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
	);
}
