import { type Metadata } from 'next';

import {
	buildDerivativeProjectsPageMetadata,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { isPrefixed, locale } = await readMetadataLocaleContext();

	return buildDerivativeProjectsPageMetadata({ isPrefixed, locale });
}

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
