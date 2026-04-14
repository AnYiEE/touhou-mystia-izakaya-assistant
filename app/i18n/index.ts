import type { TLocale, TLocaleConfig, TUITranslationTable } from './types';

export type { TLocale } from './types';

/**
 * Locale metadata: BCP 47 tag and native display name.
 */
export const LOCALE_CONFIGS = {
	'zh-hans': { bcp47: 'zh-Hans', label: '简体中文' },
	'zh-hant': { bcp47: 'zh-Hant', label: '繁體中文' },
	en: { bcp47: 'en', label: 'English' },
	ja: { bcp47: 'ja', label: '日本語' },
	ko: { bcp47: 'ko', label: '한국어' },
} as const satisfies Record<TLocale, TLocaleConfig>;

export const LOCALE_LIST = Object.keys(LOCALE_CONFIGS) as TLocale[];

export const DEFAULT_LOCALE: TLocale = 'zh-hans';

// ---- UI translation tables (lazy-loaded per locale) ----

const uiTranslationTables: Partial<Record<TLocale, TUITranslationTable>> = {};

/**
 * Register a UI translation table for a locale.
 * Called by each locale file (e.g. `locales/zh-hant.ts`).
 */
export function registerUITranslations(locale: TLocale, table: TUITranslationTable) {
	uiTranslationTables[locale] = table;
}

// ---- Data translation tables (lazy-loaded per locale) ----

const dataTranslationTables: Partial<Record<TLocale, Record<string, string>>> = {};

/**
 * Register a data translation table for a locale.
 * Called by each data locale file (e.g. `data/i18n/zh-hant/index.ts`).
 */
export function registerDataTranslations(locale: TLocale, table: Record<string, string>) {
	dataTranslationTables[locale] = table;
}

// ---- Locale state access ----

let _getLocale: () => TLocale = () => DEFAULT_LOCALE;

/**
 * Inject the locale getter. Called once during app init from the store setup.
 * This avoids a circular dependency between i18n and the store.
 */
export function setLocaleGetter(getter: () => TLocale) {
	_getLocale = getter;
}

/**
 * Get the current locale value (non-reactive, for use outside React).
 */
export function getLocale(): TLocale {
	return _getLocale();
}

// ---- Translation functions ----

/**
 * Translate a game-data string (entity name, tag, description, etc.).
 * Key is always the zh-hans original. Returns translated string or the key itself as fallback.
 */
export function t(key: string): string {
	const locale = _getLocale();
	if (locale === DEFAULT_LOCALE) {
		return key;
	}
	return dataTranslationTables[locale]?.[key] || key;
}

/**
 * Translate a UI-fixed string (button labels, tooltips, section titles, etc.).
 * Key is always the zh-hans original. Returns translated string or the key itself as fallback.
 */
export function tUI(key: string): string {
	const locale = _getLocale();
	if (locale === DEFAULT_LOCALE) {
		return key;
	}
	return uiTranslationTables[locale]?.[key] || key;
}

/**
 * Translate a UI string with interpolation.
 * Placeholders use `{name}` syntax.
 *
 * @example
 * tUIf('点击：在新窗口中查看{type}【{name}】的详情', { type: '料理', name: '海鲜味噌汤' })
 */
export function tUIf(key: string, params: Record<string, string>): string {
	let result = tUI(key);
	for (const [name, value] of Object.entries(params)) {
		result = result.replaceAll(`{${name}}`, value);
	}
	return result;
}
