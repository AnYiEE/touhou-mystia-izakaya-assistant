import { type TAccountSyncConflictResolutionReadiness } from '@/features/account/client/state/accountStore';

import { type TAccountSyncConflictResolutionResultStatus } from './conflict';

export const ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP = {
	busy: '另一个标签页正在处理该冲突',
	recovering: '正在恢复同步状态，请稍候',
	stale: '冲突内容已更新，请重新确认',
	storageUnavailable: '浏览器暂时无法保存同步状态，现有数据未被修改',
	unexpected: '冲突保存失败，请稍后重试',
	unsupported: '当前页面版本无法处理这份同步状态，请更新后重试',
} as const;

export const ACCOUNT_SYNC_CONFLICT_READINESS_MESSAGE_MAP = {
	busy: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.busy,
	ready: null,
	recovering: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.recovering,
	stale: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.stale,
	'storage-unavailable': ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.storageUnavailable,
	unsupported: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.unsupported,
} as const satisfies Record<
	TAccountSyncConflictResolutionReadiness,
	null | string
>;

export const ACCOUNT_SYNC_CONFLICT_READINESS_LABEL_MAP = {
	busy: '其他页面处理中',
	ready: '冲突待处理',
	recovering: '正在恢复',
	stale: '内容已更新',
	'storage-unavailable': '存储不可用',
	unsupported: '需要更新',
} as const satisfies Record<TAccountSyncConflictResolutionReadiness, string>;

export const ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP = {
	automaticResolution: '正在协调',
	automaticResolutionPaused: '自动协调中',
	conflict: '冲突待处理',
	dirty: '待上传',
	synced: '已同步',
} as const;

export const ACCOUNT_SYNC_STATUS_FALLBACK_MESSAGE_MAP = {
	rebuildFailed: '恢复云同步失败，请稍后重试',
	syncFailed: '同步异常，请稍后重试',
} as const;

export const ACCOUNT_SYNC_CONTROL_LABEL_MAP = {
	broadcastAvailable: '可用',
	broadcastUnavailable: '不可用',
	collapseDetails: '收起同步详情',
	compatibleLock: '浏览器兼容锁',
	expandDetails: '展开同步详情',
	mergedUnavailable: '无法自动合并',
	nativeLock: '浏览器原生',
	restore: '用本设备数据恢复云同步',
	restoring: '正在恢复云同步',
	sync: '立即同步',
	syncing: '正在同步',
} as const;

export const ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_MAP = {
	'sync-account-capacity-exceeded': '容量超限',
	'sync-request-too-large': '请求过大',
} as const;

export const ACCOUNT_SYNC_CONFLICT_RESULT_MESSAGE_MAP = {
	busy: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.busy,
	resolved: null,
	'resolved-elsewhere': null,
	stale: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.stale,
	'storage-unavailable': ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.storageUnavailable,
	unsupported: ACCOUNT_SYNC_CONFLICT_MESSAGE_MAP.unsupported,
} as const satisfies Record<
	TAccountSyncConflictResolutionResultStatus,
	null | string
>;

export const ACCOUNT_SYNC_CONFLICT_ISOLATED_STATE_COPY_MAP = {
	'conflict-storage-unavailable': {
		detail: '现有数据未被修改。请确认浏览器允许本页面保存数据后刷新重试。',
		title: '浏览器存储暂不可用',
	},
	default: {
		detail: '请刷新页面确认已加载最新版本；若仍然出现此提示，请更新应用后重试。',
		title: '需要更新同步客户端',
	},
	'quarantine-storage-failed': {
		detail: '原始数据仍保留在当前浏览器中。请释放本地存储空间后刷新页面重试。',
		title: '本地同步数据无法安全隔离',
	},
	'sync-reset-marker-invalid': {
		detail: '原始数据仍保留在当前浏览器中。请先导出需要保留的数据，再通过明确的数据清理操作重置此状态。',
		title: '本地同步状态需要处理',
	},
} as const;

interface IAccountSyncNamespaceStatusLabelOptions {
	hasConflict: boolean;
	isAutomaticResolution: boolean;
	isDirty: boolean;
	resolutionReadiness: TAccountSyncConflictResolutionReadiness | undefined;
	terminalError: keyof typeof ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_MAP | null;
}

export function getAccountSyncNamespaceStatusLabel({
	hasConflict,
	isAutomaticResolution,
	isDirty,
	resolutionReadiness,
	terminalError,
}: IAccountSyncNamespaceStatusLabelOptions) {
	if (resolutionReadiness !== undefined) {
		return ACCOUNT_SYNC_CONFLICT_READINESS_LABEL_MAP[resolutionReadiness];
	}
	if (isAutomaticResolution) {
		return ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP.automaticResolution;
	}
	if (hasConflict) {
		return ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP.conflict;
	}
	if (terminalError !== null) {
		return ACCOUNT_SYNC_TERMINAL_ERROR_LABEL_MAP[terminalError];
	}
	return isDirty
		? ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP.dirty
		: ACCOUNT_SYNC_NAMESPACE_STATUS_LABEL_MAP.synced;
}
