import { type Metadata } from 'next';

import { Recipe } from '@/domain/catalog/food/Recipe';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const recipes = Recipe.getInstance().getNames(10);
const title = getPageTitle('/recipes');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${recipes.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), recipes),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
