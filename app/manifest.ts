import { type MetadataRoute } from 'next';

import { COLOR_MAP } from './design/theme/runtime/constants';
import { PUBLIC_RUNTIME_CONFIG } from './infrastructure/environment/publicRuntimeConfig';
import { DEFAULT_LOCALE } from './shared/i18n/locale';
import { translate } from './shared/i18n/messages';
import { siteMessages } from './shared/site/messages';
import { SITE_METADATA } from './shared/site/metadata';

type TManifest = MetadataRoute.Manifest & {
	edge_side_panel: Partial<{ preferred_width: number }>;
};

const { cdnUrl, isExportMode, isOffline } = PUBLIC_RUNTIME_CONFIG;
const { id } = SITE_METADATA;

async function readManifestLocale() {
	if (isExportMode) {
		return DEFAULT_LOCALE;
	}

	const requestLocaleModule =
		await import('./features/preferences/server/requestLocale');
	return requestLocaleModule.readRequestLocale();
}

export default async function manifest(): Promise<TManifest> {
	const locale = await readManifestLocale();
	const siteName = translate(siteMessages, locale, 'site.name');
	const siteShortName = translate(siteMessages, locale, 'site.shortName');
	const offlineSuffix = translate(
		siteMessages,
		locale,
		'site.manifest.offlineSuffix'
	);

	return {
		id: isOffline ? `${id}-offline` : id,
		name: isOffline ? `${siteName}${offlineSuffix}` : siteName,
		short_name: isOffline
			? `${siteShortName}${offlineSuffix}`
			: siteShortName,

		categories: ['games'],
		description: translate(
			siteMessages,
			locale,
			'site.manifest.description'
		),

		display: 'standalone',
		display_override: ['window-controls-overlay', 'standalone', 'browser'],
		edge_side_panel: { preferred_width: 780 },
		launch_handler: { client_mode: ['navigate-existing', 'auto'] },
		orientation: 'any',

		icons: [
			{
				sizes: '192x192',
				src: `${cdnUrl}/icons/pwa-icon-192.png`,
				type: 'image/png',
			},
			{
				sizes: '512x512',
				src: `${cdnUrl}/icons/pwa-icon-512.png`,
				type: 'image/png',
			},
		],
		shortcuts: [
			{
				description: translate(
					siteMessages,
					locale,
					'site.manifest.shortcut.description'
				),
				icons: [
					{
						sizes: '192x192',
						src: `${cdnUrl}/icons/pwa-icon-192.png`,
						type: 'image/png',
					},
					{
						sizes: '512x512',
						src: `${cdnUrl}/icons/pwa-icon-512.png`,
						type: 'image/png',
					},
				],
				name: translate(
					siteMessages,
					locale,
					'site.manifest.shortcut.name'
				),
				short_name: translate(
					siteMessages,
					locale,
					'site.manifest.shortcut.shortName'
				),
				url: '/special-guests',
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
