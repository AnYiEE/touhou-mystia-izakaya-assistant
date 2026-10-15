'use client';

import { memo } from 'react';

import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Link from '@/design/ui/components/link';
import Tooltip from '@/design/ui/components/tooltip';

import { type TMerchantLabel } from '@/domain/data/places/merchantFacts';
import type {
	TCollectionPointReference,
	TMerchantReference,
} from '@/domain/data/places/types';

import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { useDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';
import {
	getCollectableEntityId,
	getMapsPageHref,
	getMerchantReference,
} from '@/features/maps/links';

import { useI18n } from '@/shared/i18n/useI18n';

/**
 * @description Merchants that move around and have no spot on the day maps.
 * Listed here so catalog pages need not load the character data to know it.
 */
const UNPLACED_MERCHANTS: ReadonlySet<TMerchantLabel> = new Set([
	'MengChengGuo',
	'ThreeFairies',
]);

function MapIconLink({ href, trackName }: { href: string; trackName: string }) {
	const { t } = useI18n(mapsMessages);

	const text = t('maps.link.viewOnMap');
	const handlePress = () => {
		trackMapEvent('Map Link Button', trackName);
	};

	return (
		<Tooltip showArrow content={text} offset={2} size="sm">
			<Link
				animationUnderline={false}
				aria-label={text}
				color="foreground"
				href={href}
				size="sm"
				onPress={handlePress}
				className="ml-1 align-baseline text-default-500"
			>
				<FontAwesomeIcon icon={faMapLocationDot} size="sm" />
			</Link>
		</Tooltip>
	);
}

/**
 * @description Opens the map with the collection point selected. References
 * to every map but a few name no single point and get no link.
 */
export const CollectionPointMapLink = memo<{
	reference: TCollectionPointReference;
}>(function CollectionPointMapLink({ reference }) {
	const { isMapVisible } = useDayMapVisibility();

	if ('excludedMaps' in reference || !isMapVisible(reference.map)) {
		return null;
	}

	// A group shares one name on the map; its first point stands for it.
	const [label] =
		'labels' in reference ? reference.labels : [reference.label];

	return (
		<MapIconLink
			href={getMapsPageHref(reference.map, getCollectableEntityId(label))}
			trackName={`Collectable:${reference.map}/${label}`}
		/>
	);
});

/** @description Opens the map with the merchant selected, for merchants with a fixed spot. */
export const MerchantMapLink = memo<{ reference: TMerchantReference }>(
	function MerchantMapLink({ reference }) {
		const { isMapVisible } = useDayMapVisibility();

		if (
			reference.label === undefined ||
			reference.map === undefined ||
			UNPLACED_MERCHANTS.has(reference.label) ||
			!isMapVisible(reference.map)
		) {
			return null;
		}

		return (
			<MapIconLink
				href={getMapsPageHref(
					reference.map,
					getMerchantReference(reference.label)
				)}
				trackName={`Merchant:${reference.map}/${reference.label}`}
			/>
		);
	}
);
