import { cookies, headers } from 'next/headers';
import { type NextRequest } from 'next/server';

import {
	LOCALE_PREFERENCE_COOKIE_NAME,
	SYSTEM_LOCALE_PREFERENCE,
	type TLocale,
	type TLocalePreference,
	isLocale,
	parseAcceptLanguage,
	parseLocalePreference,
} from '@/shared/i18n/locale';
import { LOCALE_REQUEST_HEADER } from '@/shared/i18n/routeLocales';

const ACCEPT_LANGUAGE_HEADER = 'accept-language';

function parseLocalePreferenceCookieValue(
	rawValue: string | undefined
): TLocalePreference | null {
	if (rawValue === undefined) {
		return null;
	}

	try {
		return parseLocalePreference(decodeURIComponent(rawValue));
	} catch {
		return null;
	}
}

/**
 * @description Effective locale of server-delivered display content. A
 * concrete preference (mirror cookie) wins; `system` or no preference follows
 * the visitor's `Accept-Language`; the default locale is the final fallback.
 */
export function resolveContentLocale({
	acceptLanguage,
	preference,
}: {
	acceptLanguage: string | null;
	preference: TLocalePreference | null;
}): TLocale {
	if (preference !== null && preference !== SYSTEM_LOCALE_PREFERENCE) {
		return preference;
	}

	return parseAcceptLanguage(acceptLanguage);
}

export function readContentLocale(request: NextRequest): TLocale {
	return resolveContentLocale({
		acceptLanguage: request.headers.get(ACCEPT_LANGUAGE_HEADER),
		preference: parseLocalePreferenceCookieValue(
			request.cookies.get(LOCALE_PREFERENCE_COOKIE_NAME)?.value
		),
	});
}

export interface IRequestLocaleContext {
	/** @description True when the request used a virtual locale prefix. */
	isPrefixed: boolean;
	locale: TLocale;
}

/**
 * @description Effective locale of the request plus whether it came from a
 * virtual locale prefix. The middleware sets or removes the route-locale
 * header on every page request, so its presence means the prefix won.
 */
export async function readRequestLocaleContext(): Promise<IRequestLocaleContext> {
	const headerStore = await headers();
	const prefixedLocale = headerStore.get(LOCALE_REQUEST_HEADER);
	if (prefixedLocale !== null && isLocale(prefixedLocale)) {
		return { isPrefixed: true, locale: prefixedLocale };
	}

	const cookieStore = await cookies();
	const preference = parseLocalePreferenceCookieValue(
		cookieStore.get(LOCALE_PREFERENCE_COOKIE_NAME)?.value
	);

	if (preference !== null && preference !== SYSTEM_LOCALE_PREFERENCE) {
		return { isPrefixed: false, locale: preference };
	}

	return {
		isPrefixed: false,
		locale: resolveContentLocale({
			acceptLanguage: headerStore.get(ACCEPT_LANGUAGE_HEADER),
			preference,
		}),
	};
}

export async function readRequestLocale(): Promise<TLocale> {
	const { locale } = await readRequestLocaleContext();
	return locale;
}
