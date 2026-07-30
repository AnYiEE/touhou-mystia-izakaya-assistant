/* eslint-disable sort-keys */
import { type MetadataRoute } from 'next';

import { COLOR_MAP } from './design/theme/runtime/constants';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import { SITE_METADATA } from './shared/site/metadata';

type TManifest = MetadataRoute.Manifest & {
	edge_side_panel: Partial<{ preferred_width: number }>;
};

const { cdnUrl, isOffline } = PUBLIC_RUNTIME_CONFIG;
const { description, id, locale, name, shortName } = SITE_METADATA;

export const dynamic = 'force-static';

export default function manifest(): TManifest {
	return {
		id: isOffline ? `${id}-offline` : id,
		name: isOffline ? `${name}（离线版）` : name,
		short_name: isOffline ? `${shortName}（离线版）` : shortName,
		categories: ['games'],
		description,

		display: 'standalone',
		display_override: ['window-controls-overlay', 'standalone', 'browser'],
		edge_side_panel: { preferred_width: 780 },
		launch_handler: { client_mode: ['navigate-existing', 'auto'] },
		orientation: 'any',

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
		shortcuts: [
			{
				name: '为稀有顾客搭配料理套餐',
				short_name: '搭配稀客套餐',
				description:
					'搭配稀客的料理套餐或查看顾客图鉴（包括羁绊奖励和符卡效果查询）',
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

		dir: 'ltr',
		lang: locale,

		background_color: COLOR_MAP.LIGHT,
		theme_color: COLOR_MAP.LIGHT_THEME,

		scope: '/',
		start_url: '/',
	};
}
