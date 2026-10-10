import { type NextRequest, NextResponse } from 'next/server';

import {
	applyServiceCorsHeaders,
	createServiceCorsPreflightResponse,
} from '@/infrastructure/http/server/cors';
import {
	LOCALE_REQUEST_HEADER,
	resolveLocalePrefixSegment,
} from '@/shared/i18n/routeLocales';
import { resolveLegacyRecordRouteRedirectPath } from '@/shared/site/legacyRecordRouteRedirects';

/** Internal areas that intentionally have no locale-prefixed entry. */
const PREFIX_BLOCKED_SEGMENTS: ReadonlySet<string> = new Set([
	'_next',
	'admin',
	'api',
	'preferences',
	'sso',
]);

/**
 * @description Non-existent internal path used to render the localized
 * not-found page for blocked prefixes such as `/en/admin`.
 */
const BLOCKED_PREFIX_NOT_FOUND_PATH = '/_locale-prefix-not-found';

function handleServiceApiRequest(request: NextRequest) {
	if (request.method === 'OPTIONS') {
		return createServiceCorsPreflightResponse(request);
	}

	const response = NextResponse.next();
	applyServiceCorsHeaders(response.headers, request);

	return response;
}

function handlePageRequest(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	const headers = new Headers(request.headers);
	headers.delete(LOCALE_REQUEST_HEADER);

	const [prefixSegment = '', ...restSegments] = pathname.slice(1).split('/');
	const locale = resolveLocalePrefixSegment(prefixSegment);
	if (locale === null) {
		return NextResponse.next({ request: { headers } });
	}

	headers.set(LOCALE_REQUEST_HEADER, locale);

	const restSegmentsPath = `/${restSegments.join('/')}`;
	const firstRestSegment = restSegments[0] ?? '';
	if (
		firstRestSegment.startsWith('_') ||
		PREFIX_BLOCKED_SEGMENTS.has(firstRestSegment)
	) {
		const target = request.nextUrl.clone();
		target.pathname = BLOCKED_PREFIX_NOT_FOUND_PATH;
		target.search = '';

		return NextResponse.rewrite(target, { request: { headers } });
	}

	const redirectPath = resolveLegacyRecordRouteRedirectPath(restSegmentsPath);
	if (redirectPath !== null) {
		const redirectUrl = new URL(
			`/${prefixSegment}${redirectPath}`,
			request.url
		);
		redirectUrl.search = search;

		return NextResponse.redirect(redirectUrl, 308);
	}

	const target = request.nextUrl.clone();
	target.pathname = restSegmentsPath;
	target.search = search;

	return NextResponse.rewrite(target, { request: { headers } });
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname === '/api/v1' || pathname.startsWith('/api/v1/')) {
		return handleServiceApiRequest(request);
	}

	return handlePageRequest(request);
}

export const config = { matcher: ['/api/v1/:path*', '/((?!_next/|api/).*)'] };
