import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

import type { TRecommendationSortProfile } from './sortProfiles';

const RECOMMENDATION_SORT_PROFILE_MESSAGES_ZH_CN = {
	'availability-first': '容易获取',
	'high-price': '高价优先',
	'low-price': '低价优先',
	'material-cost-first': '少料易做',
} as const;

type TRecommendationSortProfileMessageKey =
	keyof typeof RECOMMENDATION_SORT_PROFILE_MESSAGES_ZH_CN;

const RECOMMENDATION_SORT_PROFILE_MESSAGES = {
	en: {
		'availability-first': 'Easy to Obtain',
		'high-price': 'High Price First',
		'low-price': 'Low Price First',
		'material-cost-first': 'Few Ingredients',
	},
	ja: {
		'availability-first': '入手しやすい',
		'high-price': '高価格優先',
		'low-price': '低価格優先',
		'material-cost-first': '材料少なめ',
	},
	ko: {
		'availability-first': '구하기 쉬움',
		'high-price': '고가 우선',
		'low-price': '저가 우선',
		'material-cost-first': '재료 적음',
	},
	'zh-CN': RECOMMENDATION_SORT_PROFILE_MESSAGES_ZH_CN,
	'zh-TW': {
		'availability-first': '容易取得',
		'high-price': '高價優先',
		'low-price': '低價優先',
		'material-cost-first': '少料易做',
	},
} as const satisfies TLocalizedMessageTable<TRecommendationSortProfileMessageKey>;

let activeLocale: TLocale = DEFAULT_LOCALE;

export function deactivateRecommendationSortProfileLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateRecommendationSortProfileLabels(locale: TLocale) {
	activeLocale = locale;
}

export function getRecommendationSortProfileLabel(
	profile: TRecommendationSortProfile
) {
	return translate(
		RECOMMENDATION_SORT_PROFILE_MESSAGES,
		activeLocale,
		profile
	);
}
