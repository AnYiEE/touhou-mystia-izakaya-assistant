import { DEFAULT_LOCALE, type TLocale } from '@/shared/i18n/locale';

import { type TSearchMatcher, matchPinyinName } from './matchPinyinName';

const HANGUL_SYLLABLE_BASE = 0xac00;
const HANGUL_SYLLABLE_COUNT = 11172;
const HANGUL_INITIAL_COUNT = 19;
const HANGUL_INITIALS = [
	'ㄱ',
	'ㄲ',
	'ㄴ',
	'ㄷ',
	'ㄸ',
	'ㄹ',
	'ㅁ',
	'ㅂ',
	'ㅃ',
	'ㅅ',
	'ㅆ',
	'ㅇ',
	'ㅈ',
	'ㅉ',
	'ㅊ',
	'ㅋ',
	'ㅌ',
	'ㅍ',
	'ㅎ',
] as const;
const CHOSEONG_QUERY_PATTERN = /^[\u3131-\u314E]+$/u;
const DIACRITIC_MARKS_PATTERN = /[\u0300-\u036F]/gu;
const KATAKANA_PATTERN = /[\u30A1-\u30F6]/gu;
const WHITESPACE_PATTERN = /\s+/gu;

export function foldSearchText(value: string, locale: TLocale): string {
	if (locale.startsWith('zh')) {
		return value.toLowerCase();
	}

	let text = value.normalize('NFKC').toLowerCase();
	if (locale === 'en') {
		text = text.normalize('NFKD').replaceAll(DIACRITIC_MARKS_PATTERN, '');
	}
	if (locale === 'ja') {
		text = text.replaceAll(KATAKANA_PATTERN, (character) => {
			const code = character.codePointAt(0);
			return code === undefined
				? character
				: String.fromCodePoint(code - 0x60);
		});
	}

	return text;
}

export function normalizeMatchText(value: string, locale: TLocale): string {
	return foldSearchText(value, locale).replaceAll(WHITESPACE_PATTERN, '');
}

export function getHangulInitials(value: string): string {
	let initials = '';
	for (const character of value.normalize('NFKC')) {
		const code = character.codePointAt(0) ?? 0;
		if (
			code >= HANGUL_SYLLABLE_BASE &&
			code < HANGUL_SYLLABLE_BASE + HANGUL_SYLLABLE_COUNT
		) {
			const initialIndex = Math.floor(
				(code - HANGUL_SYLLABLE_BASE) /
					(HANGUL_SYLLABLE_COUNT / HANGUL_INITIAL_COUNT)
			);
			initials += HANGUL_INITIALS[initialIndex] ?? '';
		}
	}

	return initials;
}

export function matchLocalizedName(
	searchValue: string,
	name: string,
	locale: TLocale
): boolean {
	const normalizedSearch = normalizeMatchText(searchValue, locale);
	if (normalizedSearch.length === 0) {
		return false;
	}
	if (normalizeMatchText(name, locale).includes(normalizedSearch)) {
		return true;
	}
	if (locale === 'ko') {
		const trimmedSearch = searchValue.trim();
		if (
			CHOSEONG_QUERY_PATTERN.test(trimmedSearch) &&
			getHangulInitials(name).includes(trimmedSearch)
		) {
			return true;
		}
	}

	return false;
}

export function matchNameByLocale(
	searchValue: string,
	item: { name: string; pinyin: string[] },
	locale: TLocale
): boolean {
	return locale.startsWith('zh')
		? matchPinyinName(searchValue, item)
		: matchLocalizedName(searchValue, item.name, locale);
}

export function createCatalogNameMatcher(catalog: {
	activeLocalizedLocale: TLocale | null;
}): TSearchMatcher {
	return (searchValue, item) =>
		matchNameByLocale(
			searchValue,
			item,
			catalog.activeLocalizedLocale ?? DEFAULT_LOCALE
		);
}

const collatorCache = new Map<TLocale, Intl.Collator>();

export function compareLocalizedName(
	left: string,
	right: string,
	locale: TLocale
): number {
	let collator = collatorCache.get(locale);
	if (collator === undefined) {
		collator = new Intl.Collator(locale);
		collatorCache.set(locale, collator);
	}

	return collator.compare(left, right);
}
