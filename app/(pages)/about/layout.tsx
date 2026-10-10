import { type Metadata } from 'next';

import {
	buildPageAlternates,
	getLocalizedPageTitle,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const alternates = buildPageAlternates('/about', locale, isPrefixed);

	return {
		title: getLocalizedPageTitle(locale, '/about'),

		...(alternates === undefined ? {} : { alternates }),
	};
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
