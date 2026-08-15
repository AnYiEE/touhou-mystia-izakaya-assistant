import { type Metadata } from 'next';

import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const beverages = BeverageCatalog.getInstance().getNames(10);
const title = getPageTitle('/beverages');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${beverages.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...beverages),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
