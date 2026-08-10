import { type Metadata } from 'next';

import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const customers = CustomerRare.getInstance().getNames(10);
const title = getPageTitle('/customer-rare');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐或查询羁绊奖励和符卡效果。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...customers),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
