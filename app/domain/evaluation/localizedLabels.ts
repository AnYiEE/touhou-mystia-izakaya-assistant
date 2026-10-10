import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

import { GUEST_EVALUATION_KEY_MAP, GUEST_EVALUATION_MAP } from './labels';
import type { TEvaluation, TEvaluationKey } from './types';

const EVALUATION_LABEL_MESSAGES_ZH_CN = {
	bad: '不满',
	exbad: '极度不满',
	exgood: '完美',
	good: '满意',
	lackmoneyangry: '大额超支',
	lackmoneynormal: '小额超支',
	norm: '普通',
	repell: '被驱赶',
	seenRepell: '评价驱赶行为',
} as const;

type TEvaluationLabelMessageKey = keyof typeof EVALUATION_LABEL_MESSAGES_ZH_CN;

const EVALUATION_LABEL_MESSAGES = {
	en: {
		bad: 'Unhappy',
		exbad: 'Very Unhappy',
		exgood: 'Perfect',
		good: 'Happy',
		lackmoneyangry: 'Heavy Overspend',
		lackmoneynormal: 'Slight Overspend',
		norm: 'Neutral',
		repell: 'Driven Away',
		seenRepell: 'Witnessed Rejection',
	},
	ja: {
		bad: '不満',
		exbad: '大不満',
		exgood: '完璧',
		good: '満足',
		lackmoneyangry: '大額超過',
		lackmoneynormal: '小額超過',
		norm: '普通',
		repell: '追い出し',
		seenRepell: '追い出しを目撃',
	},
	ko: {
		bad: '불만',
		exbad: '매우 불만',
		exgood: '완벽',
		good: '만족',
		lackmoneyangry: '과다 지출',
		lackmoneynormal: '소액 초과 지출',
		norm: '보통',
		repell: '쫓겨남',
		seenRepell: '쫓겨남 목격',
	},
	'zh-CN': EVALUATION_LABEL_MESSAGES_ZH_CN,
	'zh-TW': {
		bad: '不滿',
		exbad: '極度不滿',
		exgood: '完美',
		good: '滿意',
		lackmoneyangry: '大額超支',
		lackmoneynormal: '小額超支',
		norm: '普通',
		repell: '被驅趕',
		seenRepell: '評價驅趕行為',
	},
} as const satisfies TLocalizedMessageTable<TEvaluationLabelMessageKey>;

let activeLocale: TLocale = DEFAULT_LOCALE;

/**
 * @description Evaluation labels are a display projection: the canonical
 * Simplified-Chinese label stays the persisted/compared identity (guest meal
 * ratings, legacy data), only rendered text switches language. Activation
 * runs inside the catalog localization pipeline.
 */
export function deactivateEvaluationLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateEvaluationLabels(locale: TLocale) {
	activeLocale = locale;
}

export function getEvaluationLabel(evaluation: TEvaluation): string {
	const key = GUEST_EVALUATION_KEY_MAP[evaluation];
	return translate(EVALUATION_LABEL_MESSAGES, activeLocale, key);
}

export function getEvaluationLabelByKey(key: TEvaluationKey): string {
	return translate(EVALUATION_LABEL_MESSAGES, activeLocale, key);
}

/**
 * @description Resolves a canonical Simplified-Chinese evaluation label (for
 * example a persisted value) to its localized display text. Unknown values
 * are returned unchanged.
 */
export function getEvaluationLabelByText(displayLabel: string): string {
	const evaluation = GUEST_EVALUATION_MAP[displayLabel as TEvaluationKey] as
		TEvaluation | undefined;
	return evaluation === undefined
		? displayLabel
		: getEvaluationLabel(evaluation);
}
