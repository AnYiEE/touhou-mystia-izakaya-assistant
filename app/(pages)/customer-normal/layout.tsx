import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/customer-normal'),
};

export default function CustomerNormalLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
