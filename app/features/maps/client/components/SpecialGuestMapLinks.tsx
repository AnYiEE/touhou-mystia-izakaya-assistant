'use client';

import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment, memo, useMemo } from 'react';

import Link from '@/design/ui/components/link';

import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { DAY_MAP_SPECIAL_GUEST_MAPS } from '@/domain/data/maps/dayMapSpecialGuestMaps';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { trackSupportMapDetail } from '@/features/donations/client/state/supportNudgeStore';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { getDayMapLabel } from '@/features/maps/client/model/dayMapLabels';
import { prepareMapsNavigation } from '@/features/maps/client/model/mapsHistory';
import { useDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';
import { getCharacterEntityId, getMapsPageHref } from '@/features/maps/links';

import { useI18n } from '@/shared/i18n/useI18n';

import { useMapLinksHidden } from './MapLinks';

interface IProps {
	className?: string;
	guest: TSpecialGuestId;
}

/**
 * @description `On the map: A, B`, each opening that map with the guest
 * selected. Kept apart from the other map links, which do not need the
 * character data.
 */
export default memo<IProps>(function SpecialGuestMapLinks({
	className,
	guest,
}) {
	const { t } = useI18n(mapsMessages);
	const { t: tItems } = useI18n(catalogItemsMessages);
	useCatalogLocalizationRevision();
	const { isMapVisible } = useDayMapVisibility();
	const isHidden = useMapLinksHidden();

	const places = useMemo(
		() =>
			(DAY_MAP_SPECIAL_GUEST_MAPS[guest] ?? [])
				.filter(isMapVisible)
				.map((map) => ({
					href: getMapsPageHref(
						map,
						getCharacterEntityId(`special-${guest}`)
					),
					map,
				})),
		[guest, isMapVisible]
	);
	if (isHidden || places.length === 0) {
		return null;
	}

	return (
		<p className={className}>
			<span className="font-semibold">{t('maps.link.guestPlaces')}</span>
			{places.map(({ href, map }, index) => (
				<Fragment key={map}>
					{index > 0 && tItems('items.source.listSeparator')}
					<Link
						animationUnderline={false}
						href={href}
						onPress={() => {
							trackSupportMapDetail(
								map,
								getCharacterEntityId(`special-${guest}`)
							);
							prepareMapsNavigation(href);
							trackMapEvent(
								'Map Link Button',
								`Special Guest:${guest}/${map}`
							);
						}}
						// Same color as the text around it, like the portrait link beside it.
						className="underline-dotted-offset2 inline-flex items-center gap-0.5 text-inherit"
					>
						<FontAwesomeIcon icon={faMapLocationDot} size="xs" />
						{getDayMapLabel(map)}
					</Link>
				</Fragment>
			))}
		</p>
	);
});
