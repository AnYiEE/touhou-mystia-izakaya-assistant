import {
	SUPPORTED_LOCALES,
	SYSTEM_LOCALE_PREFERENCE,
	type TLocale,
	type TLocalePreference,
} from '@/shared/i18n/locale';

export interface ILocaleMenuItem {
	key: string;
	label: string;
	preference: TLocalePreference;
}

const LOCALE_LABEL_MAP = {
	en: 'English',
	ja: '日本語',
	ko: '한국어',
	'zh-CN': '简体中文',
	'zh-TW': '繁體中文',
} as const satisfies Record<TLocale, string>;

export const LOCALE_MENU_ITEMS: ReadonlyArray<ILocaleMenuItem> = [
	{
		key: `locale:${SYSTEM_LOCALE_PREFERENCE}`,
		label: '系统语言（跟随浏览器）',
		preference: SYSTEM_LOCALE_PREFERENCE,
	},
	...SUPPORTED_LOCALES.map((locale) => ({
		key: `locale:${locale}`,
		label: LOCALE_LABEL_MAP[locale],
		preference: locale,
	})),
];

const localeMenuItemByKey: ReadonlyMap<string, ILocaleMenuItem> = new Map(
	LOCALE_MENU_ITEMS.map((item) => [item.key, item])
);

export function toLocaleMenuKey(preference: TLocalePreference): string {
	return `locale:${preference}`;
}

export function resolveLocaleMenuPreference(
	key: unknown
): TLocalePreference | null {
	return typeof key === 'string'
		? (localeMenuItemByKey.get(key)?.preference ?? null)
		: null;
}
