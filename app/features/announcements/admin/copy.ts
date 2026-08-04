import {
	type TAnnouncementAudience,
	type TAnnouncementLevel,
} from '@/domain/announcements/contracts';

import { type TAnnouncementComputedStatus } from '@/features/announcements/contracts';

export const ADMIN_ANNOUNCEMENT_MESSAGE_MAP = {
	adminSessionExpired: '管理员登录已失效，请重新登录。',
	archived: '站点通知已归档',
	archiveFailed: '归档失败',
	cleanupFailed: '清理通知记录失败',
	conflictRefresh: '通知已被其他管理员更新，请刷新后再编辑。',
	created: '站点通知已创建',
	listReadFailed: '读取站点通知失败',
	listReading: '正在读取站点通知',
	previewFailed: '预览失败',
	restored: '站点通知已恢复',
	restoreFailed: '恢复失败',
	saved: '站点通知已保存',
	saveFailed: '保存失败',
	targetUserReadFailed: '读取指定用户失败',
	userSearchFailed: '搜索用户失败',
} as const;

export const ANNOUNCEMENT_AUDIENCE_LABEL_MAP = {
	all: '全部',
	anonymous: '未登录',
	authenticated: '已登录',
	targeted: '指定用户',
} as const satisfies Record<TAnnouncementAudience, string>;

export const ANNOUNCEMENT_LEVEL_LABEL_MAP = {
	critical: '重要',
	danger: '危险',
	info: '信息',
	success: '成功',
	warning: '警告',
} as const satisfies Record<TAnnouncementLevel, string>;

export const ANNOUNCEMENT_STATUS_LABEL_MAP = {
	active: '展示中',
	archived: '已归档',
	disabled: '已停用',
	ended: '已结束',
	scheduled: '待开始',
} as const satisfies Record<TAnnouncementComputedStatus, string>;

export const ANNOUNCEMENT_STATUS_FILTER_OPTIONS = [
	{ label: '全部状态', value: '' },
	{ label: ANNOUNCEMENT_STATUS_LABEL_MAP.active, value: 'active' },
	{ label: ANNOUNCEMENT_STATUS_LABEL_MAP.scheduled, value: 'scheduled' },
	{ label: ANNOUNCEMENT_STATUS_LABEL_MAP.ended, value: 'ended' },
	{ label: ANNOUNCEMENT_STATUS_LABEL_MAP.disabled, value: 'disabled' },
	{ label: ANNOUNCEMENT_STATUS_LABEL_MAP.archived, value: 'archived' },
] as const satisfies Array<{
	label: string;
	value: TAnnouncementComputedStatus | '';
}>;

export const ANNOUNCEMENT_LEVEL_FILTER_OPTIONS = [
	{ label: '全部等级', value: '' },
	{ label: ANNOUNCEMENT_LEVEL_LABEL_MAP.info, value: 'info' },
	{ label: ANNOUNCEMENT_LEVEL_LABEL_MAP.success, value: 'success' },
	{ label: ANNOUNCEMENT_LEVEL_LABEL_MAP.warning, value: 'warning' },
	{ label: ANNOUNCEMENT_LEVEL_LABEL_MAP.danger, value: 'danger' },
	{ label: ANNOUNCEMENT_LEVEL_LABEL_MAP.critical, value: 'critical' },
] as const satisfies Array<{ label: string; value: TAnnouncementLevel | '' }>;

export const ANNOUNCEMENT_AUDIENCE_FILTER_OPTIONS = [
	{ label: '全部受众', value: '' },
	{ label: '全部用户', value: 'all' },
	{ label: '未登录', value: 'anonymous' },
	{ label: '已登录', value: 'authenticated' },
	{ label: '指定用户', value: 'targeted' },
] as const satisfies Array<{
	label: string;
	value: TAnnouncementAudience | '';
}>;

export function createAnnouncementCleanupSuccessMessage({
	deletedDismissals,
	deletedVersions,
}: {
	deletedDismissals: number;
	deletedVersions: number;
}) {
	return `已清理${deletedDismissals}条关闭记录、${deletedVersions}条历史版本`;
}
