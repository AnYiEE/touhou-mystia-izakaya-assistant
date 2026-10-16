'use client';

import { createContext, memo, useContext } from 'react';

import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Link from '@/design/ui/components/link';
import Tooltip from '@/design/ui/components/tooltip';

import { type TMerchantLabel } from '@/domain/data/places/merchantFacts';
import type {
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { rememberOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import { ITEM_PREVIEW_PARAM_NAME } from '@/features/itemSharing/contracts';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { useDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';
import {
	getCollectableEntityId,
	getFishingEntityId,
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

/**
 * @description Runs before a map link leaves the page, with the item whose
 * popover holds the link, so going back can open that popover again. Catalog
 * pages remember the item on the history entry; the map page provides its own.
 */
export const MapLinkLeaveContext = createContext<(itemId: number) => void>(
	rememberOpenedItemPopover
);

/** @description The small catalog preview window stays on its item. */
export function useMapLinksHidden() {
	const { params } = useParams();

	return params.has(ITEM_PREVIEW_PARAM_NAME);
}

interface IMapIconLinkProps {
	href: string;
	itemId: number;
	trackName: string;
}

function MapIconLink({ href, itemId, trackName }: IMapIconLinkProps) {
	const { t } = useI18n(mapsMessages);
	const onLeave = useContext(MapLinkLeaveContext);

	const text = t('maps.link.viewOnMap');
	const handlePress = () => {
		trackMapEvent('Map Link Button', trackName);
		onLeave(itemId);
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
				// Centred on the text line rather than its baseline.
				className="-mt-px ml-0.5 align-middle text-default-600"
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
	itemId: number;
	reference: TCollectionPointReference;
}>(function CollectionPointMapLink({ itemId, reference }) {
	const { isMapVisible } = useDayMapVisibility();
	const isHidden = useMapLinksHidden();

	if (
		isHidden ||
		'excludedMaps' in reference ||
		!isMapVisible(reference.map)
	) {
		return null;
	}

	// A group shares one name on the map; its first point stands for it.
	const [label] =
		'labels' in reference ? reference.labels : [reference.label];

	return (
		<MapIconLink
			href={getMapsPageHref(reference.map, getCollectableEntityId(label))}
			itemId={itemId}
			trackName={`Collectable:${reference.map}/${label}`}
		/>
	);
});

/** @description Opens the map with the merchant selected, for merchants with a fixed spot. */
export const MerchantMapLink = memo<{
	itemId: number;
	reference: TMerchantReference;
}>(function MerchantMapLink({ itemId, reference }) {
	const { isMapVisible } = useDayMapVisibility();
	const isHidden = useMapLinksHidden();

	if (
		isHidden ||
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
			itemId={itemId}
			trackName={`Merchant:${reference.map}/${reference.label}`}
		/>
	);
});

/** @description Opens the map with its fishing spot selected. */
export const FishingMapLink = memo<{ itemId: number; map: TMapLabel }>(
	function FishingMapLink({ itemId, map }) {
		const { isMapVisible } = useDayMapVisibility();
		const isHidden = useMapLinksHidden();

		if (isHidden || !isMapVisible(map)) {
			return null;
		}

		return (
			<MapIconLink
				// Every map with fish has exactly one fishing spot.
				href={getMapsPageHref(map, getFishingEntityId(0))}
				itemId={itemId}
				trackName={`Fishing:${map}`}
			/>
		);
	}
);
