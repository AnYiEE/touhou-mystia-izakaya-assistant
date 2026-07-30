import { type Metadata } from 'next';

import { Clothes } from '@/domain/catalog/items/Clothes';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const clothes = Clothes.getInstance().getNames(10);
const title = getPageTitle('/clothes');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${clothes.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), clothes),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
