import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/ingredients'),
};

export default function IngredientsLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
