import { type TLocale, normalizeLocale } from './locale';

/**
 * @description Internal request header used by the middleware to pass the
 * virtual route locale to server rendering. The middleware always sets or
 * removes this header before the request reaches application code.
 */
export const LOCALE_REQUEST_HEADER = 'x-site-locale';

export const LOCALE_PREFIX_SEGMENT_MAP = {
	en: 'en',
	ja: 'ja',
	ko: 'ko',
	zh: 'zh-CN',
	'zh-hans': 'zh-CN',
	'zh-hant': 'zh-TW',
} as const satisfies Readonly<Record<string, TLocale>>;

export type TLocalePrefixSegment = keyof typeof LOCALE_PREFIX_SEGMENT_MAP;

const localePrefixSegmentSet: ReadonlySet<string> = new Set(
	Object.keys(LOCALE_PREFIX_SEGMENT_MAP)
);

export function isLocalePrefixSegment(
	value: string
): value is TLocalePrefixSegment {
	return localePrefixSegmentSet.has(value);
}

export function resolveLocalePrefixSegment(segment: string): TLocale | null {
	return isLocalePrefixSegment(segment)
		? LOCALE_PREFIX_SEGMENT_MAP[segment]
		: null;
}

/**
 * @description Canonical URL prefix of a locale. Simplified Chinese keeps the
 * un-prefixed URL; `zh` and `zh-hans` stay equivalent entries and are never
 * referenced as canonical.
 */
export const CANONICAL_LOCALE_PREFIX_MAP = {
	en: '/en',
	ja: '/ja',
	ko: '/ko',
	'zh-CN': '',
	'zh-TW': '/zh-hant',
} as const satisfies Readonly<Record<TLocale, string>>;

/**
 * @description hreflang value of each locale for `alternates.languages` and
 * the sitemap. `x-default` is not part of this map and points at the
 * un-prefixed URL wherever a full alternate set is emitted.
 */
export const HREFLANG_LOCALE_MAP = {
	en: 'en',
	ja: 'ja',
	ko: 'ko',
	'zh-Hans': 'zh-CN',
	'zh-Hant': 'zh-TW',
} as const satisfies Readonly<Record<string, TLocale>>;

export function buildLocalePath(locale: TLocale, path: string) {
	const prefix = CANONICAL_LOCALE_PREFIX_MAP[locale];
	if (path === '/') {
		return prefix === '' ? '/' : prefix;
	}

	return `${prefix}${path}`;
}

/**
 * @description Canonical path for a locale tag that reaches us as a URL prefix
 * in a variant form: region/script tags such as `zh-HK`, `zh-SG` or `en-US`,
 * and case variants of the accepted segments. Returns `null` for canonical
 * segments (the rewrite path handles them) and for non-locale segments.
 */
export function resolveLocalePrefixRedirectPath(
	segment: string,
	restPath: string
) {
	if (isLocalePrefixSegment(segment)) {
		return null;
	}

	const locale = normalizeLocale(segment);
	return locale === null ? null : buildLocalePath(locale, restPath);
}
