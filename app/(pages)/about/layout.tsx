import { type Metadata } from 'next';

import {
	buildAboutPageMetadata,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();

	return buildAboutPageMetadata({ isPrefixed, locale });
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
