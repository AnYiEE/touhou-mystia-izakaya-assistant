import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/beverages'),
};

export default function BeveragesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
