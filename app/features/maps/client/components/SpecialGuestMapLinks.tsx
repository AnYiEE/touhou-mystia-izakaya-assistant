'use client';

import { Fragment, memo } from 'react';

import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Link from '@/design/ui/components/link';

import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { DAY_MAP_CHARACTERS } from '@/domain/data/maps/dayMapCharacters';
import type { TDayMapLabel } from '@/domain/data/maps/types';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { getDayMapLabel } from '@/features/maps/client/model/dayMapLabels';
import { useDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';
import { getCharacterEntityId, getMapsPageHref } from '@/features/maps/links';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	className?: string;
	guest: TSpecialGuestId;
}

interface ISpecialGuestPlace {
	href: string;
	map: TDayMapLabel;
}

const SPECIAL_GUEST_PLACES = new Map<TSpecialGuestId, ISpecialGuestPlace[]>();
for (const { destinations, id, specialGuest } of DAY_MAP_CHARACTERS) {
	if (specialGuest === null) {
		continue;
	}
	const places = SPECIAL_GUEST_PLACES.get(specialGuest) ?? [];
	for (const { map } of destinations) {
		if (!places.some((place) => place.map === map)) {
			places.push({
				href: getMapsPageHref(map, getCharacterEntityId(id)),
				map,
			});
		}
	}
	SPECIAL_GUEST_PLACES.set(specialGuest, places);
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
	const { isMapVisible } = useDayMapVisibility();

	const places = (SPECIAL_GUEST_PLACES.get(guest) ?? []).filter(({ map }) =>
		isMapVisible(map)
	);
	if (places.length === 0) {
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
						color="foreground"
						href={href}
						onPress={() => {
							trackMapEvent(
								'Map Link Button',
								`Special Guest:${guest}/${map}`
							);
						}}
						className="underline-dotted-offset2 inline-flex items-center gap-0.5"
					>
						<FontAwesomeIcon icon={faMapLocationDot} size="xs" />
						{getDayMapLabel(map)}
					</Link>
				</Fragment>
			))}
		</p>
	);
});
