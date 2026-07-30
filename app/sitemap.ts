import { type MetadataRoute } from 'next';

import {
	NAV_MENU_ITEMS,
	type TSitePath,
} from './features/appShell/navigation/config';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import type { ILink } from './shared/site/contracts';

const { baseURL } = PUBLIC_RUNTIME_CONFIG;

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
	return (NAV_MENU_ITEMS as Array<ILink<TSitePath>>)
		.filter(
			({ href }) =>
				!['/admin', '/api', '/preferences', '/sso'].includes(href)
		)
		.map<
			MetadataRoute.Sitemap[number]
		>(({ href }) => ({ changeFrequency: 'monthly', lastModified: new Date(), priority: 1, url: `https://${baseURL}${href === '/' ? '' : href}` }));
}
