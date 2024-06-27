import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/customer-rare'),
};

export default function CustomerRareLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return <div className="grid grid-cols-1 justify-items-center gap-4 xl:grid-cols-2">{children}</div>;
}
