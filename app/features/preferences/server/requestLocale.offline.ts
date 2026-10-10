/* eslint-disable @typescript-eslint/require-await */

import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

export interface IRequestLocaleContext {
	/** @description True when the request used a virtual locale prefix. */
	isPrefixed: boolean;
	locale: TLocale;
}

export async function readRequestLocaleContext(): Promise<IRequestLocaleContext> {
	return { isPrefixed: false, locale: DEFAULT_LOCALE };
}

export async function readRequestLocale(): Promise<TLocale> {
	return DEFAULT_LOCALE;
}

/**
 * @description Compatibility stub: the static export has no request-local
 * content language, so every helper falls back to the default locale.
 */
export function resolveContentLocale(): TLocale {
	return DEFAULT_LOCALE;
}

export function readContentLocale(): TLocale {
	return DEFAULT_LOCALE;
}
