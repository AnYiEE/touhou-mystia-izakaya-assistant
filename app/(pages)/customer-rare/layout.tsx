import { type Metadata } from 'next';

import { siteConfig } from '@/configs';
import { getPageTitle, toArray } from '@/utilities';
import { CustomerRare } from '@/utils';

const { description, keywords } = siteConfig;

const customers = CustomerRare.getInstance().getNames(10);
const title = getPageTitle('/customer-rare');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐或查询羁绊奖励和符卡效果。${description}`,
	keywords: toArray(keywords.slice(0, 18), customers),
};

export { WithPreference as default } from '@/(pages)/layouts';
