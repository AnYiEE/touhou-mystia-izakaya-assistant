import { type Metadata } from 'next';

import { Partner } from '@/domain/catalog/items/Partner';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';
import { toArray } from '@/shared/utilities/collections/convert';

const { description, keywords } = SITE_METADATA;

const partners = Partner.getInstance().getNames(10);
const title = getPageTitle('/partners');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${partners.join('、')}等${title}的详情。${description}`,
	keywords: toArray(keywords.slice(0, 18), partners),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
