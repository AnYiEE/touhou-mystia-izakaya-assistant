import { type Metadata } from 'next';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';

import {
	createOptionalRecordRouteStaticParams,
	shouldPrerenderRecordRoutes,
} from '@/features/appShell/navigation/recordRouteStaticParams';
import CatalogPageStructuredData from '@/features/appShell/seo/CatalogPageStructuredData';
import JsonLdScript from '@/features/appShell/seo/JsonLdScript';
import { buildGuestStructuredData } from '@/features/appShell/seo/jsonLd';
import {
	buildGuestPageMetadata,
	readGuestPageSeoData,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';
import SpecialGuestPageContent from '@/features/catalog/guests/special/client/components/content';

interface IProps {
	params: Promise<{ paths?: string[] }>;
}

function parseGuestId(value: string | undefined) {
	if (value === undefined || !/^(?:0|[1-9]\d*)$/u.test(value)) {
		return null;
	}

	const id = Number(value);
	return Number.isSafeInteger(id) ? id : null;
}

export function generateStaticParams() {
	const specialGuestCatalog = SpecialGuestCatalog.getInstance();

	return shouldPrerenderRecordRoutes()
		? createOptionalRecordRouteStaticParams(specialGuestCatalog.data)
		: [{ paths: [] }];
}

export async function generateMetadata({ params }: IProps): Promise<Metadata> {
	const { paths } = await params;
	const id = parseGuestId(paths?.[0]);
	if (id === null) {
		return {};
	}
	const { isPrefixed, locale } = await readMetadataLocaleContext();

	return buildGuestPageMetadata({
		href: '/special-guests',
		id,
		isPrefixed,
		locale,
	});
}

export default async function SpecialGuests({ params }: IProps) {
	const { paths } = await params;
	const id = parseGuestId(paths?.[0]);
	if (id === null) {
		return (
			<>
				<CatalogPageStructuredData href="/special-guests" />
				<SpecialGuestPageContent />
			</>
		);
	}
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const data = await readGuestPageSeoData({
		href: '/special-guests',
		id,
		isPrefixed,
		locale,
	});

	return (
		<>
			{data !== null && (
				<JsonLdScript
					data={buildGuestStructuredData({
						categoryName: data.categoryName,
						categoryUrl: data.categoryUrl,
						dateModified: data.dateModified,
						description: data.description,
						locale,
						name: data.name,
						url: data.url,
						websiteUrl: data.websiteUrl,
					})}
				/>
			)}
			<SpecialGuestPageContent />
		</>
	);
}
