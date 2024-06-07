import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {siteConfig} from '@/configs';

export const metadata: Metadata = {
	title: siteConfig.navItems
		.map(({label, href}) => {
			if (href === '/beverages') {
				return label;
			}
			return '';
		})
		.join(''),
};

export default function BeveragesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
			{children}
		</div>
	);
}
