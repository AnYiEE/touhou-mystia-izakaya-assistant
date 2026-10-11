import { type Metadata } from 'next';

import {
	buildCatalogPageMetadata,
	readLocalizedCatalogNames,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const names = await readLocalizedCatalogNames('/currencies', locale, 10);

	return buildCatalogPageMetadata({
		descriptionKey: 'site.seo.description.details',
		href: '/currencies',
		isPrefixed,
		locale,
		names,
	});
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
