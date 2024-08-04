import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/preferences'),
};

export default function PreferencesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
