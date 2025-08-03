import { type MetadataRoute } from 'next';

import { type TSitePath, siteConfig } from '@/configs';
import type { ILink } from '@/configs/site/types';

const { domain, navMenuItems } = siteConfig;

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
	return (navMenuItems as Array<ILink<TSitePath>>)
		.filter(({ href }) => href !== '/preferences')
		.map<
			MetadataRoute.Sitemap[number]
		>(({ href }) => ({ changeFrequency: 'monthly', lastModified: new Date(), priority: 1, url: `https://${domain}${href === '/' ? '' : href}` }));
}
