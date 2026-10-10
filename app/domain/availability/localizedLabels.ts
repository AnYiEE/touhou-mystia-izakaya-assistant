import type { TDlc } from '@/domain/data/shared/types';

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';
import { type TLocalizedMessageTable, translate } from '@/shared/i18n/messages';

import { DLC_LABEL_MAP } from './messages';

const DLC_LABEL_MESSAGES_ZH_CN = {
	'dlc.baseGame': '游戏本体',
	'dlc.metaMystia': 'MetaMystia模组',
} as const;

type TDlcLabelMessageKey = keyof typeof DLC_LABEL_MESSAGES_ZH_CN;

const DLC_LABEL_MESSAGES = {
	en: { 'dlc.baseGame': 'Base Game', 'dlc.metaMystia': 'MetaMystia Mod' },
	ja: { 'dlc.baseGame': 'ゲーム本編', 'dlc.metaMystia': 'MetaMystia Mod' },
	ko: { 'dlc.baseGame': '본편', 'dlc.metaMystia': 'MetaMystia 모드' },
	'zh-CN': DLC_LABEL_MESSAGES_ZH_CN,
	'zh-TW': { 'dlc.baseGame': '遊戲本體', 'dlc.metaMystia': 'MetaMystia模組' },
} as const satisfies TLocalizedMessageTable<TDlcLabelMessageKey>;

const DLC_LABEL_MESSAGE_KEYS: Readonly<
	Partial<Record<TDlc, TDlcLabelMessageKey>>
> = { 0: 'dlc.baseGame', 9: 'dlc.metaMystia' };

let activeLocale: TLocale = DEFAULT_LOCALE;

/**
 * @description DLC labels are a display projection: the DLC number stays the
 * canonical identity for filters, sync payloads and ordering; only rendered
 * text switches language. Activation runs inside the catalog localization
 * pipeline so the shared revision bump re-renders consumers.
 */
export function deactivateDlcLabels() {
	activeLocale = DEFAULT_LOCALE;
}

export function activateDlcLabels(locale: TLocale) {
	activeLocale = locale;
}

export function getDlcLabel(dlc: TDlc): string {
	const key = DLC_LABEL_MESSAGE_KEYS[dlc];
	return key === undefined
		? DLC_LABEL_MAP[dlc].label
		: translate(DLC_LABEL_MESSAGES, activeLocale, key);
}
