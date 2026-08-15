import { type Metadata } from 'next';

import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';

import { getPageTitle } from '@/features/appShell/navigation/getPageTitle';

import { SITE_METADATA } from '@/shared/site/metadata';

const { description, keywords } = SITE_METADATA;

const normalGuests = NormalGuestCatalog.getInstance().getNames(10);
const title = getPageTitle('/normal-guests');

export const metadata: Metadata = {
	title,

	description: `本页面可以为${normalGuests.join('、')}等${title}搭配料理套餐。${description}`,
	keywords: keywords.toSpliced(18, Infinity, ...normalGuests),
};

export { default } from '@/features/preferences/client/components/PreferencesModalLayout';
