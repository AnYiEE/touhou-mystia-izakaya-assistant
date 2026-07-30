import { type Metadata } from 'next';

import { Ornament } from '@/domain/catalog/items/Ornament';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const ornaments = Ornament.getInstance().getNames(10);
const title = getPageTitle('/ornaments');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${ornaments.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), ornaments),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
