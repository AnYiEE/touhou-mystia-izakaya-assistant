import { type Metadata } from 'next';

import { Currency } from '@/domain/catalog/items/Currency';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const currencies = Currency.getInstance().getNames(10);
const title = getPageTitle('/currencies');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${currencies.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), currencies),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
