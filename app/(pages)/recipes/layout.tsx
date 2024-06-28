import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/recipes'),
};

export default function RecipesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
