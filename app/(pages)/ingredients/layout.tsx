import {type Metadata} from 'next';

import {siteConfig} from '@/configs';
import {Ingredient, getPageTitle} from '@/utils';

const {description, keywords} = siteConfig;

const ingredients = Ingredient.getInstance().getNames(10);
const title = getPageTitle('/ingredients');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${ingredients.join('、')}等${title}的详情。${description}`,
	keywords: [...keywords.slice(0, 18), ...ingredients],
};

export {WithPreference as default} from '@/(pages)/layouts';
