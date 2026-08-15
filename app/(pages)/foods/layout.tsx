import { type Metadata } from 'next';

import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const foods = FoodCatalog.getInstance().getNames(10);
const title = getPageTitle('/foods');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${foods.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...foods),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
