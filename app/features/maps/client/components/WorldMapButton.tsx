'use client';

import { faEarthAsia } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

import SideBookmarkButton from '@/design/ui/components/SideBookmarkButton';

import { usePathname } from '@/features/appShell/client/navigation/usePathname';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { prepareMapsNavigation } from '@/features/maps/client/model/mapsHistory';
import { MAPS_PAGE_PATH } from '@/features/maps/links';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

import { useMapLinksHidden } from './MapLinks';

export default function WorldMapButton() {
	const { t } = useI18n(mapsMessages);
	const { pathname } = usePathname();
	const router = useRouter();
	const vibrate = useVibrate();
	const isHidden = useMapLinksHidden();

	if (isHidden) {
		return null;
	}

	return (
		<SideBookmarkButton
			icon={faEarthAsia}
			label={t('maps.world.title')}
			aria-label={t('maps.world.title')}
			onPress={() => {
				vibrate();
				trackMapEvent('Map Link Button', `World:${pathname}`);
				prepareMapsNavigation(MAPS_PAGE_PATH);
				router.push(MAPS_PAGE_PATH);
			}}
		/>
	);
}
