import { type Metadata } from 'next';
import { type PropsWithChildren } from 'react';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

export const metadata: Metadata = {
	title: getPageTitle('/preferences'),

	robots: { index: false },
};

export default function PreferencesLayout({
	children,
}: Readonly<PropsWithChildren>) {
	return children;
}
