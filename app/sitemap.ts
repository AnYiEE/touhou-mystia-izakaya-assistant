import { type MetadataRoute } from 'next';

import {
	NAV_MENU_ITEMS,
	type TSitePath,
} from './features/appShell/navigation/config';
import {
	buildAbsoluteSiteUrl,
	buildLocaleAlternateLanguages,
} from './features/appShell/seo/pageMetadata';
import { DERIVATIVE_PROJECTS_PAGE_PATH } from './features/derivativeProjects/links';
import { META_MYSTIA_PAGE_PATH } from './features/metaMystia/links';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import { SUPPORTED_LOCALES } from './shared/i18n/locale';
import { buildLocalePath } from './shared/i18n/routeLocales';
import type { ILink } from './shared/site/contracts';

const { isExportMode } = PUBLIC_RUNTIME_CONFIG;

export const dynamic = 'force-static';

/** Public pages that are intentionally absent from the navigation menu. */
const EXTRA_SITEMAP_PATHS = [
	DERIVATIVE_PROJECTS_PAGE_PATH,
	META_MYSTIA_PAGE_PATH,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	const paths: ReadonlyArray<string> = [
		...(NAV_MENU_ITEMS as Array<ILink<TSitePath>>)
			.filter(
				({ href }) =>
					!['/admin', '/api', '/preferences', '/sso'].includes(href)
			)
			.map(({ href }) => href),
		...EXTRA_SITEMAP_PATHS,
	];

	if (isExportMode) {
		// The static export has no middleware and no prefix routes.
		return paths.map<MetadataRoute.Sitemap[number]>((href) => ({
			changeFrequency: 'monthly',
			lastModified,
			priority: 1,
			url: buildAbsoluteSiteUrl(href),
		}));
	}

	return paths.flatMap<MetadataRoute.Sitemap[number]>((href) => {
		const languages = buildLocaleAlternateLanguages(href);

		return SUPPORTED_LOCALES.map((locale) => ({
			alternates: { languages },
			changeFrequency: 'monthly',
			lastModified,
			priority: 1,
			url: buildAbsoluteSiteUrl(buildLocalePath(locale, href)),
		}));
	});
}
