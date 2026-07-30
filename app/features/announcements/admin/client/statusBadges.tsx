'use client';

import { memo } from 'react';

import { type TAnnouncementLevel } from '@/domain/announcements/contracts';

import { AdminBadge } from '@/features/admin/client/components/statusBadges';
import { type TAnnouncementComputedStatus } from '@/features/announcements/contracts';

const ANNOUNCEMENT_STATUS_META_MAP = {
	active: { label: '展示中', tone: 'success' },
	archived: { label: '已归档', tone: 'default' },
	disabled: { label: '已停用', tone: 'warning' },
	ended: { label: '已结束', tone: 'default' },
	scheduled: { label: '待开始', tone: 'primary' },
} as const satisfies Record<
	TAnnouncementComputedStatus,
	{
		label: string;
		tone: 'danger' | 'default' | 'primary' | 'success' | 'warning';
	}
>;

const ANNOUNCEMENT_LEVEL_META_MAP = {
	critical: { label: '重要', tone: 'primary' },
	danger: { label: '危险', tone: 'danger' },
	info: { label: '信息', tone: 'default' },
	success: { label: '成功', tone: 'success' },
	warning: { label: '警告', tone: 'warning' },
} as const satisfies Record<
	TAnnouncementLevel,
	{
		label: string;
		tone: 'danger' | 'default' | 'primary' | 'success' | 'warning';
	}
>;

interface IAdminAnnouncementStatusBadgeProps {
	status: TAnnouncementComputedStatus;
}

export const AdminAnnouncementStatusBadge =
	memo<IAdminAnnouncementStatusBadgeProps>(
		function AdminAnnouncementStatusBadge({ status }) {
			const meta = ANNOUNCEMENT_STATUS_META_MAP[status];

			return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
		}
	);

interface IAdminAnnouncementLevelBadgeProps {
	level: TAnnouncementLevel;
}

export const AdminAnnouncementLevelBadge =
	memo<IAdminAnnouncementLevelBadgeProps>(
		function AdminAnnouncementLevelBadge({ level }) {
			const meta = ANNOUNCEMENT_LEVEL_META_MAP[level];

			return <AdminBadge tone={meta.tone}>{meta.label}</AdminBadge>;
		}
	);
