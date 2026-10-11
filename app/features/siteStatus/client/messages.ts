import type {
	TLocalizedMessageTable,
	TMessageParams,
} from '@/shared/i18n/messages';

const SITE_STATUS_MESSAGES_ZH_CN = {
	'siteStatus.failed': '获取在线人数失败',
	'siteStatus.loading': '正在获取在线人数',
	'siteStatus.visitors': '实时{count}人在线',
} as const;

export type TSiteStatusMessageKey = keyof typeof SITE_STATUS_MESSAGES_ZH_CN;

export type TSiteTranslate = (
	key: TSiteStatusMessageKey,
	params?: TMessageParams
) => string;

export const siteStatusMessages = {
	en: {
		'siteStatus.failed': 'Failed to get the online visitor count',
		'siteStatus.loading': 'Getting the online visitor count',
		'siteStatus.visitors': '{count} online now',
	},
	ja: {
		'siteStatus.failed': 'オンライン人数の取得に失敗しました',
		'siteStatus.loading': 'オンライン人数を取得中',
		'siteStatus.visitors': '現在{count}人がオンライン',
	},
	ko: {
		'siteStatus.failed': '접속자 수를 가져오지 못했습니다',
		'siteStatus.loading': '접속자 수를 가져오는 중',
		'siteStatus.visitors': '현재 {count}명 접속 중',
	},
	'zh-CN': SITE_STATUS_MESSAGES_ZH_CN,
	'zh-TW': {
		'siteStatus.failed': '取得線上人數失敗',
		'siteStatus.loading': '正在取得線上人數',
		'siteStatus.visitors': '即時{count}人在線',
	},
} as const satisfies TLocalizedMessageTable<TSiteStatusMessageKey>;
