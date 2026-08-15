import { type Metadata } from 'next';

import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const decorations = DecorationCatalog.getInstance().getNames(10);
const title = getPageTitle('/decorations');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${decorations.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...decorations),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
