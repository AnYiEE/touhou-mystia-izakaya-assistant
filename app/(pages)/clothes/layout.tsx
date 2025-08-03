import { type Metadata } from 'next';

import { siteConfig } from '@/configs';
import { getPageTitle, toArray } from '@/utilities';
import { Clothes } from '@/utils';

const { description, keywords } = siteConfig;

const clothes = Clothes.getInstance().getNames(10);
const title = getPageTitle('/clothes');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${clothes.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), clothes),
};

export { WithPreference as default } from '@/(pages)/layouts';
