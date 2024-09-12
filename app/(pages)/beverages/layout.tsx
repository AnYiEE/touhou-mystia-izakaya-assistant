import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {Beverage, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const beverages = Beverage.getInstance().getNames(10);
const title = getPageTitle('/beverages');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${beverages.join('、')}等${title}的详情。${description}`,
	keywords: [...keywords.slice(0, 18), ...beverages],
};

export default function BeveragesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
