import type { TLocalizedMessageTable } from '@/shared/i18n/messages';

const UI_MESSAGES_ZH_CN = {
	'ui.loading': '少女料理中',
	'ui.timeAgo.days': '{days}天前',
	'ui.timeAgo.hours': '{hours}小时前',
	'ui.timeAgo.justNow': '刚刚',
	'ui.timeAgo.minutes': '{minutes}分钟前',
} as const;

export type TUiMessageKey = keyof typeof UI_MESSAGES_ZH_CN;

export const uiMessages = {
	en: {
		'ui.loading': 'Cooking up something good',
		'ui.timeAgo.days': '{days} days ago',
		'ui.timeAgo.hours': '{hours} hours ago',
		'ui.timeAgo.justNow': 'Just now',
		'ui.timeAgo.minutes': '{minutes} minutes ago',
	},
	ja: {
		'ui.loading': '少女料理中',
		'ui.timeAgo.days': '{days}日前',
		'ui.timeAgo.hours': '{hours}時間前',
		'ui.timeAgo.justNow': 'たった今',
		'ui.timeAgo.minutes': '{minutes}分前',
	},
	ko: {
		'ui.loading': '소녀 요리 중',
		'ui.timeAgo.days': '{days}일 전',
		'ui.timeAgo.hours': '{hours}시간 전',
		'ui.timeAgo.justNow': '방금 전',
		'ui.timeAgo.minutes': '{minutes}분 전',
	},
	'zh-CN': UI_MESSAGES_ZH_CN,
	'zh-TW': {
		'ui.loading': '少女料理中',
		'ui.timeAgo.days': '{days}天前',
		'ui.timeAgo.hours': '{hours}小時前',
		'ui.timeAgo.justNow': '剛剛',
		'ui.timeAgo.minutes': '{minutes}分鐘前',
	},
} as const satisfies TLocalizedMessageTable<TUiMessageKey>;
