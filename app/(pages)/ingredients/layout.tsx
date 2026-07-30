import { type Metadata } from 'next';

import { Ingredient } from '@/domain/catalog/food/Ingredient';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const ingredients = Ingredient.getInstance().getNames(10);
const title = getPageTitle('/ingredients');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${ingredients.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), ingredients),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
