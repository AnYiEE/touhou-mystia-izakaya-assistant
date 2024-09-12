import {type ReactNode} from 'react';
import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {Recipe, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const recipes = Recipe.getInstance().getNames(10);
const title = getPageTitle('/recipes');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${recipes.join('、')}等${title}的详情。${description}`,
	keywords: [...keywords.slice(0, 18), ...recipes],
};

export default function RecipesLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return children;
}
