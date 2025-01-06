import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {getPageTitle} from '@/utilities';
import {Cooker} from '@/utils';

const {description, keywords} = siteConfig;

const cookers = Cooker.getInstance().getNames(10);
const title = getPageTitle('/cookers');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${cookers.join('、')}等${title}的详情。${description}`,
	keywords: [...keywords.slice(0, 18), ...cookers],
};

export {WithPreference as default} from '@/(pages)/layouts';
