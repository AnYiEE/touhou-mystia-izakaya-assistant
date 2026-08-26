import { type Metadata } from 'next';

import { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const fishingCollectibles =
	FishingCollectibleCatalog.getInstance().getNames(10);
const title = getPageTitle('/fishing-collectibles');

export const metadata: Metadata = {
	title,

	description: `本页面可以查询${fishingCollectibles.join('、')}等${title}的详情。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...fishingCollectibles),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
