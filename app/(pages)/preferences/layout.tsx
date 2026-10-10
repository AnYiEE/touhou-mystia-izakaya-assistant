import { type Metadata } from 'next';
import { type PropsWithChildren } from 'react';

import {
	getLocalizedPageTitle,
	readMetadataLocaleContext,
} from '@/features/appShell/seo/pageMetadata';

export async function generateMetadata(): Promise<Metadata> {
	const { locale } = await readMetadataLocaleContext();

	return {
		title: getLocalizedPageTitle(locale, '/preferences'),

		robots: { index: false },
	};
}

export default function PreferencesLayout({
	children,
}: Readonly<PropsWithChildren>) {
	return children;
}
