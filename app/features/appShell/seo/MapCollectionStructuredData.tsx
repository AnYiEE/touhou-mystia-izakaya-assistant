import JsonLdScript from '@/features/appShell/seo/JsonLdScript';
import { getSeoContentDate } from '@/features/appShell/seo/contentDates';
import { buildCollectionPageStructuredData } from '@/features/appShell/seo/jsonLd';
import {
	buildCanonicalPageUrl,
	readDayMapPageSeoData,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';
import { mapsMessages } from '@/features/maps/client/messages';
import { ALL_DAY_MAP_LABELS } from '@/features/maps/client/model/dayMapLabels';
import { MAPS_PAGE_PATH } from '@/features/maps/links';

import { translate } from '@/shared/i18n/messages';

export default async function MapCollectionStructuredData() {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const maps = await Promise.all(
		ALL_DAY_MAP_LABELS.map((map) =>
			readDayMapPageSeoData({ isPrefixed, locale, map })
		)
	);

	return (
		<JsonLdScript
			data={buildCollectionPageStructuredData({
				dateModified: getSeoContentDate(MAPS_PAGE_PATH),
				description: translate(
					mapsMessages,
					locale,
					'maps.meta.description'
				),
				items: maps.map(({ name, url }) => ({ name, url })),
				locale,
				name: translate(mapsMessages, locale, 'maps.world.title'),
				url: buildCanonicalPageUrl(MAPS_PAGE_PATH, locale, isPrefixed),
				websiteUrl: buildCanonicalPageUrl('/', locale, isPrefixed),
			})}
		/>
	);
}
