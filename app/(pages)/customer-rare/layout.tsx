import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {getPageTitle} from '@/utils';

export const metadata: Metadata = {
	title: getPageTitle('/customer-rare'),
};

export default function CustomerLayout({
	children,
	preferences,
}: Readonly<{
	children: ReactNode;
	preferences: ReactNode;
}>) {
	return (
		<>
			{children}
			{preferences}
		</>
	);
}
