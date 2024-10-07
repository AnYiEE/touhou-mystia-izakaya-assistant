import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {Partner, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const partners = Partner.getInstance().getNames(10);
const title = getPageTitle('/partners');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${partners.join('、')}等${title}的详情。${description}`,
	keywords: [...keywords.slice(0, 18), ...partners],
};

export {WithPreference as default} from '@/(pages)/layouts';
