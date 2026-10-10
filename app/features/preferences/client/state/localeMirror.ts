import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';

import {
	DEFAULT_LOCALE,
	LOCALE_PREFERENCE_COOKIE_NAME,
	LOCALE_PREFERENCE_STORAGE_KEY,
	SYSTEM_LOCALE_PREFERENCE,
	type TLocale,
	type TLocalePreference,
	parseLocalePreference,
	resolveLocaleFromLanguages,
} from '@/shared/i18n/locale';

// eslint-disable-next-line unicorn/prefer-global-this
const isServer = typeof window === 'undefined';

export function readLocaleMirrorPreference(): TLocalePreference | null {
	if (isServer) {
		return null;
	}

	const stored = safeStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY);
	return stored === null ? null : parseLocalePreference(stored);
}

export function writeLocaleMirrorPreference(preference: TLocalePreference) {
	if (isServer) {
		return;
	}

	safeStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, preference);
}

export function writeLocalePreferenceCookie(preference: TLocalePreference) {
	if (isServer) {
		return;
	}

	try {
		const secure =
			globalThis.location.protocol === 'https:' ? '; secure' : '';
		document.cookie = `${LOCALE_PREFERENCE_COOKIE_NAME}=${encodeURIComponent(
			preference
		)}; path=/; max-age=31536000; samesite=lax${secure}`;
	} catch {
		/* Best-effort first-paint hint; failures must not break the runtime. */
	}
}

export function resolveBrowserLocale(): TLocale {
	if (isServer) {
		return DEFAULT_LOCALE;
	}

	const { language, languages } = navigator;
	return resolveLocaleFromLanguages(
		languages.length > 0 ? languages : [language]
	);
}

/**
 * @description Effective display locale. An explicitly saved preference
 * always wins; `system` follows the virtual route locale when the request has
 * one, and the browser languages otherwise.
 */
export function resolveEffectiveLocale(
	preference: TLocalePreference,
	routeLocale: TLocale | null = null
): TLocale {
	if (preference !== SYSTEM_LOCALE_PREFERENCE) {
		return preference;
	}

	return routeLocale ?? resolveBrowserLocale();
}

export function applyLocalePreferenceToDocument(
	preference: TLocalePreference,
	routeLocale: TLocale | null = null
) {
	if (isServer) {
		return;
	}

	const locale = resolveEffectiveLocale(preference, routeLocale);
	document.documentElement.lang = locale;
	document.documentElement.dataset['locale'] = locale;
}
