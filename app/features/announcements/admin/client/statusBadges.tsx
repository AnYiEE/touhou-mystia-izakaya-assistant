'use client';

import { memo } from 'react';

import { type TAnnouncementLevel } from '@/domain/announcements/contracts';

import { AdminBadge } from '@/features/admin/client/components/statusBadges';
import {
	ANNOUNCEMENT_LEVEL_LABEL_MAP,
	ANNOUNCEMENT_STATUS_LABEL_MAP,
} from '@/features/announcements/admin/copy';
import { type TAnnouncementComputedStatus } from '@/features/announcements/contracts';

const ANNOUNCEMENT_STATUS_META_MAP = {
	active: { label: ANNOUNCEMENT_STATUS_LABEL_MAP.active, tone: 'success' },
	archived: {
		label: ANNOUNCEMENT_STATUS_LABEL_MAP.archived,
		tone: 'default',
	},
	disabled: {
		label: ANNOUNCEMENT_STATUS_LABEL_MAP.disabled,
		tone: 'warning',
	},
	ended: { label: ANNOUNCEMENT_STATUS_LABEL_MAP.ended, tone: 'default' },
	scheduled: {
		label: ANNOUNCEMENT_STATUS_LABEL_MAP.scheduled,
		tone: 'primary',
	},
} as const satisfies Record<
	TAnnouncementComputedStatus,
	{
		label: string;
		tone: 'danger' | 'default' | 'primary' | 'success' | 'warning';
	}
>;

const ANNOUNCEMENT_LEVEL_META_MAP = {
	critical: { label: ANNOUNCEMENT_LEVEL_LABEL_MAP.critical, tone: 'primary' },
	danger: { label: ANNOUNCEMENT_LEVEL_LABEL_MAP.danger, tone: 'danger' },
	info: { label: ANNOUNCEMENT_LEVEL_LABEL_MAP.info, tone: 'default' },
	success: { label: ANNOUNCEMENT_LEVEL_LABEL_MAP.success, tone: 'success' },
	warning: { label: ANNOUNCEMENT_LEVEL_LABEL_MAP.warning, tone: 'warning' },
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
