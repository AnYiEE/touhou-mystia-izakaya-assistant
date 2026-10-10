import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const ANNOUNCEMENT_CLIENT_MESSAGES_ZH_CN = {
	'announcements.bar.ariaLabel': '站点通知',
	'announcements.bar.close': '关闭站点通知',
	'announcements.bar.next': '下一条站点通知',
	'announcements.bar.previous': '上一条站点通知',
	'announcements.maintenance.title': '系统维护',
} as const;

export type TAnnouncementClientMessageKey =
	keyof typeof ANNOUNCEMENT_CLIENT_MESSAGES_ZH_CN;

export const announcementClientMessages = {
	en: {
		'announcements.bar.ariaLabel': 'Site announcement',
		'announcements.bar.close': 'Close announcement',
		'announcements.bar.next': 'Next announcement',
		'announcements.bar.previous': 'Previous announcement',
		'announcements.maintenance.title': 'Scheduled maintenance',
	},
	ja: {
		'announcements.bar.ariaLabel': 'サイトのお知らせ',
		'announcements.bar.close': 'お知らせを閉じる',
		'announcements.bar.next': '次のお知らせ',
		'announcements.bar.previous': '前のお知らせ',
		'announcements.maintenance.title': 'メンテナンス',
	},
	ko: {
		'announcements.bar.ariaLabel': '사이트 공지',
		'announcements.bar.close': '공지 닫기',
		'announcements.bar.next': '다음 공지',
		'announcements.bar.previous': '이전 공지',
		'announcements.maintenance.title': '정기 점검',
	},
	'zh-CN': ANNOUNCEMENT_CLIENT_MESSAGES_ZH_CN,
	'zh-TW': {
		'announcements.bar.ariaLabel': '站點通知',
		'announcements.bar.close': '關閉站點通知',
		'announcements.bar.next': '下一條站點通知',
		'announcements.bar.previous': '上一條站點通知',
		'announcements.maintenance.title': '系統維護',
	},
} as const satisfies TLocalizedMessageTable<TAnnouncementClientMessageKey>;
