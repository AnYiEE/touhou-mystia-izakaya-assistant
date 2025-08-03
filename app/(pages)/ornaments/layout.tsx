import { type Metadata } from 'next';

import { siteConfig } from '@/configs';
import { getPageTitle, toArray } from '@/utilities';
import { Ornament } from '@/utils';

const { description, keywords } = siteConfig;

const ornaments = Ornament.getInstance().getNames(10);
const title = getPageTitle('/ornaments');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${ornaments.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), ornaments),
};

export { WithPreference as default } from '@/(pages)/layouts';
