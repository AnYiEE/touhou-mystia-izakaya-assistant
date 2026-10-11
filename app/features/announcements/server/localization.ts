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
import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
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

function parseAnnouncementLocaleUpdatedAtJson(
	value: string
): Partial<Record<TLocale, number>> {
	if (value === '') {
		return {};
	}

	try {
		const parsed: unknown = JSON.parse(value);
		if (!checkIsRecord(parsed)) {
			return {};
		}

		const result: Partial<Record<TLocale, number>> = {};
		for (const [locale, entry] of Object.entries(parsed)) {
			if (isLocale(locale) && isNonNegativeSafeInteger(entry)) {
				result[locale] = entry;
			}
		}

		return result;
	} catch {
		return {};
	}
}

export function getAnnouncementLocaleUpdatedAt(
	announcement: Pick<TAnnouncement, 'locale_updated_at_json' | 'updated_at'>,
	locale: TLocale
): number {
	return (
		parseAnnouncementLocaleUpdatedAtJson(
			announcement.locale_updated_at_json
		)[locale] ?? announcement.updated_at
	);
}

export function createInitialAnnouncementLocaleUpdatedAtJson(now: number) {
	return JSON.stringify(
		Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, now]))
	);
}

function checkLocalizedContentEqual(
	left: IAnnouncementLocalizedContent | undefined,
	right: IAnnouncementLocalizedContent | undefined
) {
	return left?.html === right?.html && left?.title === right?.title;
}

export function createNextAnnouncementLocaleUpdatedAtJson(
	current: Pick<
		TAnnouncement,
		| 'html'
		| 'locale_updated_at_json'
		| 'title'
		| 'translations_json'
		| 'updated_at'
	>,
	next: {
		html: string;
		title: string;
		translations: TAnnouncementTranslations;
	},
	now: number
) {
	const currentTranslations =
		parseAnnouncementTranslations(current.translations_json) ?? {};
	const entries: Array<[TLocale, number]> = [];
	for (const locale of SUPPORTED_LOCALES) {
		const changed =
			locale === DEFAULT_LOCALE
				? current.html !== next.html || current.title !== next.title
				: !checkLocalizedContentEqual(
						currentTranslations[locale],
						next.translations[locale]
					);

		entries.push([
			locale,
			changed ? now : getAnnouncementLocaleUpdatedAt(current, locale),
		]);
	}

	return JSON.stringify(Object.fromEntries(entries));
}
