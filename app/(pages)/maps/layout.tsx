import { type Metadata } from 'next';

import {
	buildMapsPageMetadata,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();

	return buildMapsPageMetadata({ isPrefixed, locale });
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
