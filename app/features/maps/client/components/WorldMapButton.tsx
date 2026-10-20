'use client';

import { memo, useCallback } from 'react';
import { faEarthAsia } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

import SideBookmarkButton, {
	type TSideBookmarkExpandWidth,
} from '@/design/ui/components/SideBookmarkButton';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { prepareMapsNavigation } from '@/features/maps/client/model/mapsHistory';
import { MAPS_PAGE_PATH } from '@/features/maps/links';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

import { useMapLinksHidden } from './MapLinks';

export default memo(function WorldMapButton({
	expandAtWidth = 1280,
	isCatalogEntry = false,
}: {
	expandAtWidth?: TSideBookmarkExpandWidth;
	isCatalogEntry?: boolean;
}) {
	const { t } = useI18n(mapsMessages);
	const { pathname } = usePathname();
	const router = useRouter();
	const vibrate = useVibrate();
	const isHidden = useMapLinksHidden();

	const handlePress = useCallback(() => {
		vibrate();
		trackMapEvent('Map Link Button', `World:${pathname}`);
		prepareMapsNavigation(MAPS_PAGE_PATH);
		router.push(MAPS_PAGE_PATH);
	}, [pathname, router, vibrate]);

	if (isHidden) {
		return null;
	}

	return (
		<SideBookmarkButton
			data-world-map-entry
			{...(isCatalogEntry ? { 'data-catalog-world-map-entry': '' } : {})}
			expandAtWidth={expandAtWidth}
			icon={faEarthAsia}
			label={t('maps.world.title')}
			aria-label={t('maps.world.title')}
			onPress={handlePress}
		/>
	);
});
