export interface ILegacyRecordRouteRedirect {
	destination: string;
	source: string;
}

/**
 * @description Redirect sources that still exist in shared links. The same
 * table feeds the `next.config.ts` redirects and the locale-prefixed redirects
 * handled by the middleware.
 */
export const LEGACY_RECORD_ROUTE_REDIRECTS = [
	{ destination: '/decorations/:path*', source: '/ornaments/:path*' },
	{ destination: '/foods/:path*', source: '/recipes/:path*' },
	{ destination: '/normal-guests', source: '/customer-normal' },
	{ destination: '/special-guests', source: '/customer-rare' },
] as const satisfies ReadonlyArray<ILegacyRecordRouteRedirect>;

const PATH_SUFFIX = '/:path*';

/**
 * @description Resolve an un-prefixed path to its redirect destination, or
 * `null` when no legacy source matches. Callers keep the URL prefix (if any)
 * when building the redirect target.
 */
export function resolveLegacyRecordRouteRedirectPath(
	path: string
): string | null {
	for (const { destination, source } of LEGACY_RECORD_ROUTE_REDIRECTS) {
		if (!source.endsWith(PATH_SUFFIX)) {
			if (path === source) {
				return destination;
			}
			continue;
		}

		const sourcePrefix = source.slice(0, -PATH_SUFFIX.length);
		if (path !== sourcePrefix && !path.startsWith(`${sourcePrefix}/`)) {
			continue;
		}

		const destinationPrefix = destination.slice(0, -PATH_SUFFIX.length);
		return `${destinationPrefix}${path.slice(sourcePrefix.length)}`;
	}

	return null;
}
