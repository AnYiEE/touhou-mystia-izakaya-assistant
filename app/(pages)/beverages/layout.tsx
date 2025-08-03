import { type Metadata } from 'next';

import { siteConfig } from '@/configs';
import { getPageTitle, toArray } from '@/utilities';
import { Beverage } from '@/utils';

const { description, keywords } = siteConfig;

const beverages = Beverage.getInstance().getNames(10);
const title = getPageTitle('/beverages');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${beverages.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), beverages),
};

export { WithPreference as default } from '@/(pages)/layouts';
