import { type Metadata } from 'next';

import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const customers = CustomerNormal.getInstance().getNames(10);
const title = getPageTitle('/customer-normal');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${customers.join('、')}等${title}搭配料理套餐。${description}`,
	keywords: toArray(keywords.slice(0, 18), customers),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
