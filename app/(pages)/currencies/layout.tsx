import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {getPageTitle, toArray} from '@/utilities';
import {Currency} from '@/utils';

const {description, keywords} = siteConfig;

const currencies = Currency.getInstance().getNames(10);
const title = getPageTitle('/currencies');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${currencies.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), currencies),
};

export {WithPreference as default} from '@/(pages)/layouts';
