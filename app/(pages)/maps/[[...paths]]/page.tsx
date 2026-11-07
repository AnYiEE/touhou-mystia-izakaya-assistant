import { type Metadata } from 'next';

import { shouldPrerenderRecordRoutes } from '@/features/appShell/navigation/recordRouteStaticParams';
import JsonLdScript from '@/features/appShell/seo/JsonLdScript';
import MapCollectionStructuredData from '@/features/appShell/seo/MapCollectionStructuredData';
import { buildMapStructuredData } from '@/features/appShell/seo/jsonLd';
import {
	buildDayMapPageMetadata,
	readDayMapPageSeoData,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';
import MapsPageEntry from '@/features/maps/client/components/MapsPageEntry';
import {
	ALL_DAY_MAP_LABELS,
	checkDayMapLabel,
} from '@/features/maps/client/model/dayMapLabels';

interface IProps {
	params: Promise<{ paths?: string[] }>;
}

export function generateStaticParams() {
	return shouldPrerenderRecordRoutes()
		? [
				{ paths: [] },
				...ALL_DAY_MAP_LABELS.map((map) => ({ paths: [map] })),
			]
		: [{ paths: [] }];
}

export async function generateMetadata({ params }: IProps): Promise<Metadata> {
	const { paths } = await params;
	const value = paths?.[0];
	if (value === undefined || !checkDayMapLabel(value)) {
		return {};
	}
	const { isPrefixed, locale } = await readMetadataLocaleContext();

	return buildDayMapPageMetadata({ isPrefixed, locale, map: value });
}

export default async function Maps({ params }: IProps) {
	const { paths } = await params;
	const value = paths?.[0];
	if (value === undefined || !checkDayMapLabel(value)) {
		return (
			<>
				<MapCollectionStructuredData />
				<MapsPageEntry />
			</>
		);
	}
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const data = await readDayMapPageSeoData({
		isPrefixed,
		locale,
		map: value,
	});

	return (
		<>
			<JsonLdScript
				data={buildMapStructuredData({
					dateModified: data.dateModified,
					description: data.description,
					locale,
					name: data.name,
					url: data.url,
					websiteUrl: data.websiteUrl,
					worldMapName: data.worldMapName,
					worldMapUrl: data.worldMapUrl,
				})}
			/>
			<MapsPageEntry />
		</>
	);
}
