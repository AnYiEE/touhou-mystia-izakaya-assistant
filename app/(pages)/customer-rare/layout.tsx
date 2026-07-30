import { type Metadata } from 'next';

import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const customers = CustomerRare.getInstance().getNames(10);
const title = getPageTitle('/customer-rare');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐或查询羁绊奖励和符卡效果。${description}`,
	keywords: toArray(keywords.slice(0, 18), customers),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
