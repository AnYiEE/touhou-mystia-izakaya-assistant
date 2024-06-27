import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/about'),
};

export default function AboutLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
