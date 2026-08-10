import { type Metadata } from 'next';

import { Ornament } from '@/domain/catalog/items/Ornament';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const ornaments = Ornament.getInstance().getNames(10);
const title = getPageTitle('/ornaments');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${ornaments.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...ornaments),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
