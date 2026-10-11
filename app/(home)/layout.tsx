import { type Metadata } from 'next';

import {
	buildPageAlternates,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();
	const alternates = buildPageAlternates('/', locale, isPrefixed);

	return alternates === undefined ? {} : { alternates };
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
