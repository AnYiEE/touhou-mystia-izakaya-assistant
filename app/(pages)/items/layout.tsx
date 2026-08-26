import { type Metadata } from 'next';

import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const items = GeneralItemCatalog.getInstance().getNames(10);
const title = getPageTitle('/items');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${items.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...items),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
