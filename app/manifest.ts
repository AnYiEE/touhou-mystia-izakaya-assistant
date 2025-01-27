/* eslint-disable sort-keys */
import {type MetadataRoute} from 'next';

import {COLOR_MAP} from '@/design/hooks';

import {siteConfig} from '@/configs';

const {cdnUrl, description, id, locale, name, shortName} = siteConfig;

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
	return {
		id,
		name,
		short_name: shortName,
		description,
		display: 'standalone',
		display_override: ['window-controls-overlay', 'standalone', 'browser'],
		start_url: '/',
		shortcuts: [
			{
				name: '为稀有顾客搭配料理套餐',
				short_name: '搭配稀客套餐',
				url: '/customer-rare',
				icons: [
					{
						src: `${cdnUrl}/icons/pwa-icon-192.png`,
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: `${cdnUrl}/icons/pwa-icon-512.png`,
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		],
		icons: [
			{
				src: `${cdnUrl}/icons/pwa-icon-192.png`,
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: `${cdnUrl}/icons/pwa-icon-512.png`,
				sizes: '512x512',
				type: 'image/png',
			},
		],
		dir: 'ltr',
		lang: locale,
		background_color: COLOR_MAP.LIGHT,
		theme_color: COLOR_MAP.LIGHT,
	};
}
