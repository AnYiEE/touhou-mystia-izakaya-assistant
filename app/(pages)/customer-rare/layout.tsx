import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {CustomerRare, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const customers = CustomerRare.getInstance().getNames(10);
const title = getPageTitle('/customer-rare');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐或查询羁绊奖励和符卡效果。${description}`,
	keywords: [...keywords.slice(0, 18), ...customers],
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
