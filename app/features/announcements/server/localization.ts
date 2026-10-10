import {
	type IAnnouncementLocalizedContent,
	type TAnnouncementTranslations,
} from '@/features/announcements/contracts';
import {
	MAX_ANNOUNCEMENT_HTML_LENGTH,
	MAX_ANNOUNCEMENT_TITLE_LENGTH,
} from '@/features/announcements/limits';

import type { TAnnouncement } from '@/infrastructure/database/schema';

import {
	DEFAULT_LOCALE,
	SUPPORTED_LOCALES,
	type TLocale,
	isLocale,
} from '@/shared/i18n/locale';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

import { getAnnouncementVisibleText, sanitizeAnnouncementHtml } from './html';

type TAnnouncementLocalizationSource = Pick<
	TAnnouncement,
	'html' | 'locales_json' | 'title' | 'translations_json'
>;

function normalizeTranslationEntry(
	value: unknown
): IAnnouncementLocalizedContent | null {
	if (!checkIsRecord(value)) {
		return null;
	}

	const { html, title } = value;
	if (typeof title !== 'string' || typeof html !== 'string') {
		return null;
	}

	const normalizedTitle = title.trim();
	const normalizedHtml = html.trim();
	if (
		normalizedTitle.length === 0 ||
		normalizedTitle.length > MAX_ANNOUNCEMENT_TITLE_LENGTH ||
		normalizedHtml.length === 0 ||
		normalizedHtml.length > MAX_ANNOUNCEMENT_HTML_LENGTH ||
		getAnnouncementVisibleText(sanitizeAnnouncementHtml(normalizedHtml))
			.length === 0
	) {
		return null;
	}

	return { html: normalizedHtml, title: normalizedTitle };
}

/**
 * @description Validate an admin-supplied translation map. Simplified Chinese
 * is required to live in the legacy columns, so a `zh-CN` key is invalid; any
 * other supported locale is optional and must be a complete entry.
 */
export function normalizeAnnouncementTranslations(
	value: unknown
): TAnnouncementTranslations | null {
	if (!checkIsRecord(value)) {
		return null;
	}

	const translations: TAnnouncementTranslations = {};
	for (const [locale, entry] of Object.entries(value)) {
		if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
			return null;
		}

		const normalizedEntry = normalizeTranslationEntry(entry);
		if (normalizedEntry === null) {
			return null;
		}

		translations[locale] = normalizedEntry;
	}

	// Rebuild in a stable order so JSON comparisons stay deterministic.
	const ordered: TAnnouncementTranslations = {};
	for (const locale of SUPPORTED_LOCALES) {
		const entry = translations[locale];
		if (entry !== undefined) {
			ordered[locale] = entry;
		}
	}

	return ordered;
}

export function parseAnnouncementTranslations(
	value: string
): TAnnouncementTranslations | null {
	try {
		return normalizeAnnouncementTranslations(JSON.parse(value));
	} catch {
		return null;
	}
}

/**
 * @description Validate the target-language selection. An empty array means
 * "all languages"; supported locales are kept in canonical order.
 */
export function normalizeAnnouncementLocales(value: unknown): TLocale[] | null {
	if (!Array.isArray(value)) {
		return null;
	}

	const localeSet = new Set<TLocale>();
	for (const item of value) {
		if (typeof item !== 'string' || !isLocale(item)) {
			return null;
		}

		localeSet.add(item);
	}

	return SUPPORTED_LOCALES.filter((locale) => localeSet.has(locale));
}

export function parseAnnouncementLocales(value: string): TLocale[] | null {
	try {
		return normalizeAnnouncementLocales(JSON.parse(value));
	} catch {
		return null;
	}
}

/**
 * @description Localized content of one announcement, or `null` when the
 * requested language has no content and the announcement must not be shown.
 */
export function getAnnouncementLocalizedContent(
	announcement: Pick<TAnnouncement, 'html' | 'title' | 'translations_json'>,
	locale: TLocale
): IAnnouncementLocalizedContent | null {
	if (locale === DEFAULT_LOCALE) {
		return { html: announcement.html, title: announcement.title };
	}

	const translations = parseAnnouncementTranslations(
		announcement.translations_json
	);

	return translations?.[locale] ?? null;
}

/**
 * @description Localized content after applying the target-language filter:
 * an announcement whose language set excludes the locale, or that has no
 * translation for it, is not displayed at all.
 */
export function getVisibleAnnouncementLocalizedContent(
	announcement: TAnnouncementLocalizationSource,
	locale: TLocale
): IAnnouncementLocalizedContent | null {
	const locales = parseAnnouncementLocales(announcement.locales_json);
	if (locales === null) {
		return null;
	}
	if (locales.length > 0 && !locales.includes(locale)) {
		return null;
	}

	return getAnnouncementLocalizedContent(announcement, locale);
}
