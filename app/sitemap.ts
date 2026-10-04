import { type MetadataRoute } from 'next';

import {
	NAV_MENU_ITEMS,
	type TSitePath,
} from './features/appShell/navigation/config';
import { META_MYSTIA_PAGE_PATH } from './features/metaMystia/links';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import type { ILink } from './shared/site/contracts';

const { baseURL } = PUBLIC_RUNTIME_CONFIG;

export const dynamic = 'force-static';

/** Public pages that are intentionally absent from the navigation menu. */
const EXTRA_SITEMAP_PATHS = [META_MYSTIA_PAGE_PATH] as const;

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		...(NAV_MENU_ITEMS as Array<ILink<TSitePath>>)
			.filter(
				({ href }) =>
					!['/admin', '/api', '/preferences', '/sso'].includes(href)
			)
			.map(({ href }) => href),
		...EXTRA_SITEMAP_PATHS,
	].map<MetadataRoute.Sitemap[number]>((href) => ({
		changeFrequency: 'monthly',
		lastModified: new Date(),
		priority: 1,
		url: `https://${baseURL}${href === '/' ? '' : href}`,
	}));
}
