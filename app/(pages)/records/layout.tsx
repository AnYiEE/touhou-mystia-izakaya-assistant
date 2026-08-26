import { type Metadata } from 'next';

import { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const records = RecordItemCatalog.getInstance().getNames(10);
const title = getPageTitle('/records');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${records.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...records),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
