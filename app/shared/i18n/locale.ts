export const SUPPORTED_LOCALES = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'] as const;

export type TLocale = (typeof SUPPORTED_LOCALES)[number];

export type TLocalePreference = TLocale | 'system';

export const DEFAULT_LOCALE: TLocale = 'zh-CN';

export const SYSTEM_LOCALE_PREFERENCE = 'system';

export const LOCALE_PREFERENCE_STORAGE_KEY = 'site-locale';

export const LOCALE_PREFERENCE_COOKIE_NAME = 'site-locale';

const supportedLocaleSet: ReadonlySet<string> = new Set(SUPPORTED_LOCALES);

/**
 * @description Normalize an external locale tag into a supported locale.
 *
 * This function must stay self-contained (no module references) because the
 * pre-hydration locale script serializes it with `Function.prototype.toString`.
 */
export function normalizeLocale(value: unknown): TLocale | null {
	if (typeof value !== 'string') {
		return null;
	}

	const segments = value.trim().toLowerCase().split(/[-_]/u);
	const [language] = segments;
	if (language === 'zh') {
		const traditionalSegments = ['hant', 'tw', 'hk', 'mo'];
		const hasTraditionalSegment = segments.some((segment) =>
			traditionalSegments.includes(segment)
		);
		return hasTraditionalSegment ? 'zh-TW' : 'zh-CN';
	}
	if (language === 'en') {
		return 'en';
	}
	if (language === 'ja') {
		return 'ja';
	}
	if (language === 'ko') {
		return 'ko';
	}

	return null;
}

export function isLocale(value: unknown): value is TLocale {
	return typeof value === 'string' && supportedLocaleSet.has(value);
}

export function parseLocalePreference(
	value: unknown
): TLocalePreference | null {
	if (value === SYSTEM_LOCALE_PREFERENCE) {
		return SYSTEM_LOCALE_PREFERENCE;
	}

	return normalizeLocale(value);
}

export function isLocalePreference(value: unknown): value is TLocalePreference {
	return value === SYSTEM_LOCALE_PREFERENCE || isLocale(value);
}

export function parseAcceptLanguage(value: unknown): TLocale {
	if (typeof value !== 'string') {
		return DEFAULT_LOCALE;
	}

	let bestLocale: TLocale | null = null;
	let bestQuality = 0;

	for (const entry of value.split(',')) {
		const [rawTag, ...parameters] = entry.trim().split(';');
		const tag = rawTag?.trim() ?? '';
		if (tag.length === 0) {
			continue;
		}

		let quality = 1;
		for (const parameter of parameters) {
			const [name, parameterValue] = parameter.trim().split('=');
			if (name?.trim().toLowerCase() !== 'q') {
				continue;
			}
			const parsed = Number.parseFloat(parameterValue ?? '');
			quality = Number.isFinite(parsed) ? parsed : 0;
		}
		if (quality <= 0) {
			continue;
		}

		const locale = normalizeLocale(tag);
		if (locale !== null && quality > bestQuality) {
			bestLocale = locale;
			bestQuality = quality;
		}
	}

	return bestLocale ?? DEFAULT_LOCALE;
}

export function resolveLocaleFromLanguages(
	languages: ReadonlyArray<unknown>
): TLocale {
	for (const language of languages) {
		const locale = normalizeLocale(language);
		if (locale !== null) {
			return locale;
		}
	}

	return DEFAULT_LOCALE;
}
