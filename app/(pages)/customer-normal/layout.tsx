import { type Metadata } from 'next';

import { siteConfig } from '@/configs';
import { getPageTitle, toArray } from '@/utilities';
import { CustomerNormal } from '@/utils';

const { description, keywords } = siteConfig;

const customers = CustomerNormal.getInstance().getNames(10);
const title = getPageTitle('/customer-normal');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐。${description}`,
	keywords: toArray(keywords.slice(0, 18), customers),
};

export { default } from '@/(pages)/customer-rare/layout';
