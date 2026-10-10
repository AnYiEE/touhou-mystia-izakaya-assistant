import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

let activeLocale: TLocale = DEFAULT_LOCALE;

/**
 * @description Locale the catalogue localization pipeline has fully applied.
 * Display projections that are not exposed through a dedicated label getter
 * (for example Spotlight index text) read this value so they stay canonical
 * until activation completes and then switch together with one revision bump.
 */
export function getActiveLocalizationLocale(): TLocale {
	return activeLocale;
}

export function setActiveLocalizationLocale(locale: TLocale) {
	activeLocale = locale;
}
