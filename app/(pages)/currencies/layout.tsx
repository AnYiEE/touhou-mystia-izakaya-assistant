import { type Metadata } from 'next';

import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const currencyItems = CurrencyItemCatalog.getInstance().getNames(10);
const title = getPageTitle('/currencies');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${currencyItems.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...currencyItems),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
