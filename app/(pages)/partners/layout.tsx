import { type Metadata } from 'next';

import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const partners = PartnerCatalog.getInstance().getNames(10);
const title = getPageTitle('/partners');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${partners.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...partners),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
