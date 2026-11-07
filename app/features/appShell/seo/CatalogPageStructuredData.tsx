import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';

import { type TSitePath } from '@/features/appShell/navigation/config';
import JsonLdScript from '@/features/appShell/seo/JsonLdScript';
import { getSeoContentDate } from '@/features/appShell/seo/contentDates';
import { buildCollectionPageStructuredData } from '@/features/appShell/seo/jsonLd';
import {
	buildCanonicalPageUrl,
	buildCatalogPageMetadata,
	getLocalizedPageTitle,
	readLocalizedCatalogNames,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

interface IProps {
	href: TSitePath;
}

export default async function CatalogPageStructuredData({ href }: IProps) {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const names = await readLocalizedCatalogNames(href, locale, 10);
	const metadata = buildCatalogPageMetadata({
		descriptionKey:
			href === '/special-guests'
				? 'site.seo.description.specialGuests'
				: href === '/normal-guests'
					? 'site.seo.description.guestMeals'
					: 'site.seo.description.details',
		href,
		isPrefixed,
		locale,
		names,
	});
	const catalog =
		href === '/special-guests'
			? SpecialGuestCatalog.getInstance()
			: href === '/normal-guests'
				? NormalGuestCatalog.getInstance()
				: null;
	const catalogNames =
		catalog === null
			? []
			: await readLocalizedCatalogNames(
					href,
					locale,
					catalog.canonicalData.length
				);
	const items =
		catalog === null
			? []
			: catalog.canonicalData.map(({ id }, index) => ({
					name: catalogNames[index] ?? String(id),
					url: buildCanonicalPageUrl(
						`${href}/${id}`,
						locale,
						isPrefixed
					),
				}));

	return (
		<JsonLdScript
			data={buildCollectionPageStructuredData({
				dateModified: getSeoContentDate(href),
				description:
					typeof metadata.description === 'string'
						? metadata.description
						: '',
				items,
				locale,
				name: getLocalizedPageTitle(locale, href),
				url: buildCanonicalPageUrl(href, locale, isPrefixed),
				websiteUrl: buildCanonicalPageUrl('/', locale, isPrefixed),
			})}
		/>
	);
}
