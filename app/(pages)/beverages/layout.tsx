import { type Metadata } from 'next';

import { Beverage } from '@/domain/catalog/food/Beverage';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const beverages = Beverage.getInstance().getNames(10);
const title = getPageTitle('/beverages');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${beverages.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...beverages),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
