import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {CustomerNormal, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const customers = Array.from({length: 10}, (_, index) => CustomerNormal.getInstance().getPropsByIndex(index).name);
const title = getPageTitle('/customer-normal');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐。${description}`,
	keywords: [...keywords.slice(0, 18), ...customers],
};

export {default} from '@/(pages)/customer-rare/layout';
