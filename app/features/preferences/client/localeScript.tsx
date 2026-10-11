import {
	DEFAULT_LOCALE,
	LOCALE_PREFERENCE_STORAGE_KEY,
	SYSTEM_LOCALE_PREFERENCE,
	normalizeLocale,
} from '@/shared/i18n/locale';

const script = (
	storageKey: typeof LOCALE_PREFERENCE_STORAGE_KEY,
	defaultLocale: typeof DEFAULT_LOCALE,
	systemPreference: typeof SYSTEM_LOCALE_PREFERENCE,
	normalizeLocaleValue: typeof normalizeLocale
) => {
	try {
		let storedPreference: string | null = null;
		try {
			storedPreference = localStorage.getItem(storageKey);
		} catch {
			storedPreference = null;
		}

		const routeLocaleValue =
			document.documentElement.dataset['routeLocale'];
		const routeLocale =
			routeLocaleValue === undefined
				? null
				: normalizeLocaleValue(routeLocaleValue);

		let locale = defaultLocale;
		if (
			storedPreference !== null &&
			storedPreference !== systemPreference
		) {
			locale = normalizeLocaleValue(storedPreference) ?? defaultLocale;
		} else if (routeLocale === null) {
			const languages: ReadonlyArray<string> =
				Array.isArray(navigator.languages) &&
				navigator.languages.length > 0
					? navigator.languages
					: [navigator.language];
			for (const language of languages) {
				const normalized = normalizeLocaleValue(language);
				if (normalized !== null) {
					locale = normalized;
					break;
				}
			}
		} else {
			// A virtual locale prefix pins the rendered language for crawlers
			// and direct visits; the preference above still wins when set.
			locale = routeLocale;
		}

		document.documentElement.lang = locale;
		document.documentElement.dataset['locale'] = locale;
	} catch (error) {
		console.error('[features/preferences/client/localeScript]:', error);
	}
};

export default function LocaleScript() {
	const scriptArgs = JSON.stringify([
		LOCALE_PREFERENCE_STORAGE_KEY,
		DEFAULT_LOCALE,
		SYSTEM_LOCALE_PREFERENCE,
	]).slice(1, -1);

	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{
				__html: `(${script.toString()})(${scriptArgs}, ${normalizeLocale.toString()})`,
			}}
		/>
	);
}
