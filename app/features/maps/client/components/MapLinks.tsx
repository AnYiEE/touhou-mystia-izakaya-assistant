'use client';

import { createContext, memo, useContext } from 'react';

import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Link from '@/design/ui/components/link';
import Tooltip from '@/design/ui/components/tooltip';

import {
	SCHEDULER_FACTS,
	type TSchedulerLabel,
} from '@/domain/data/labels/schedulerFacts';
import {
	DAY_MAP_MERCHANT_SPECIAL_GUESTS,
	DAY_MAP_SPECIAL_GUEST_LOCATIONS,
	DAY_MAP_TASK_LOCATIONS,
	type IDayMapCharacterLocation,
} from '@/domain/data/maps/dayMapSourceFacts';
import type {
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';

import { useParams } from '@/features/appShell/client/navigation/useParams';
import { rememberOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import { ITEM_PREVIEW_PARAM_NAME } from '@/features/itemSharing/contracts';
import { mapsMessages } from '@/features/maps/client/messages';
import { trackMapEvent } from '@/features/maps/client/model/analytics';
import { prepareMapsNavigation } from '@/features/maps/client/model/mapsHistory';
import { useDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';
import {
	getCharacterEntityId,
	getCollectableEntityId,
	getFishingEntityId,
	getMapsPageHref,
	getMerchantReference,
} from '@/features/maps/links';

import { useI18n } from '@/shared/i18n/useI18n';

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
		prepareMapsNavigation(href);
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

/** @description Opens the map at the merchant's character, including special-guest shops. */
export const MerchantMapLink = memo<{
	itemId: number;
	reference: TMerchantReference;
}>(function MerchantMapLink({ itemId, reference }) {
	const { isMapVisible, isSpecialGuestVisible } = useDayMapVisibility();
	const isHidden = useMapLinksHidden();
	const specialGuest =
		reference.specialGuest ??
		DAY_MAP_MERCHANT_SPECIAL_GUESTS[reference.label];
	const location =
		specialGuest === undefined
			? undefined
			: DAY_MAP_SPECIAL_GUEST_LOCATIONS[specialGuest];
	const map = reference.map ?? location?.map;
	const entity =
		location === undefined
			? reference.label === undefined
				? null
				: getMerchantReference(reference.label)
			: getCharacterEntityId(location.characterId);

	if (
		isHidden ||
		map === undefined ||
		entity === null ||
		!isMapVisible(map) ||
		(specialGuest !== undefined && !isSpecialGuestVisible(specialGuest))
	) {
		return null;
	}

	return (
		<MapIconLink
			href={getMapsPageHref(map, entity)}
			itemId={itemId}
			trackName={`Merchant:${map}/${reference.label ?? reference.specialGuest}`}
		/>
	);
});

function getTaskLocation(
	label: TSchedulerLabel
): IDayMapCharacterLocation | undefined {
	const location = DAY_MAP_TASK_LOCATIONS[label];
	if (location !== undefined) {
		return location;
	}
	const fact = SCHEDULER_FACTS[label];
	return 'specialGuestBond' in fact
		? DAY_MAP_SPECIAL_GUEST_LOCATIONS[fact.specialGuestBond.specialGuest]
		: undefined;
}

/** @description Task links point to the actual sender/receiver and share duplicate destinations. */
export const TaskMapLinks = memo<{ itemId: number; reference: ITaskReference }>(
	function TaskMapLinks({ itemId, reference }) {
		const { isDlcVisible, isMapVisible, isSpecialGuestVisible } =
			useDayMapVisibility();
		const isHidden = useMapLinksHidden();
		if (isHidden) {
			return null;
		}
		const labels =
			typeof reference.task === 'string'
				? [reference.task]
				: reference.task;
		const locations = new Map<string, IDayMapCharacterLocation>();
		for (const label of labels) {
			const fact = SCHEDULER_FACTS[label];
			if (
				!isDlcVisible(fact.dlc) ||
				('specialGuestBond' in fact &&
					!isSpecialGuestVisible(fact.specialGuestBond.specialGuest))
			) {
				continue;
			}
			const location = getTaskLocation(label);
			if (location !== undefined && isMapVisible(location.map)) {
				locations.set(location.characterId, location);
			}
		}
		return [...locations.values()].map(({ characterId, map }) => (
			<MapIconLink
				key={characterId}
				href={getMapsPageHref(map, getCharacterEntityId(characterId))}
				itemId={itemId}
				trackName={`Task:${map}/${characterId}`}
			/>
		));
	}
);

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
