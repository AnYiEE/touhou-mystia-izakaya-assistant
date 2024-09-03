import {type MetadataRoute} from 'next';

import {siteConfig} from '@/configs';

const {domain, navMenuItems} = siteConfig;

export default function sitemap(): MetadataRoute.Sitemap {
	return navMenuItems
		.filter(({href}) => href !== '/preferences')
		.map<MetadataRoute.Sitemap[number]>(({href}) => ({
			changeFrequency: 'monthly',
			lastModified: new Date(),
			priority: 1,
			url: `https://${domain}${href === '/' ? '' : href}`,
		}));
}
