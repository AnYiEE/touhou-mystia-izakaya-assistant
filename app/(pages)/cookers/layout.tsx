import { type Metadata } from 'next';

import { Cooker } from '@/domain/catalog/items/Cooker';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const cookers = Cooker.getInstance().getNames(10);
const title = getPageTitle('/cookers');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${cookers.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...cookers),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
