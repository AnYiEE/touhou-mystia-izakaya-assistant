import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { COLLECTION_POINT_REFRESH_FACTS } from '@/domain/data/places/collectionFacts';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type {
	ITaskReference,
	TCollectionPointReference,
	TMapLabel,
	TMerchantReference,
} from '@/domain/data/places/types';

type TSourceReference =
	| ITaskReference
	| TCollectionPointReference
	| TMapLabel
	| TMerchantReference;

const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export function formatSourceReference(reference: TSourceReference) {
	if (typeof reference === 'string') {
		return MAP_FACTS[reference].label;
	}
	if ('task' in reference) {
		return reference.task;
	}
	if ('specialGuest' in reference) {
		return `【${specialGuestCatalog.getPropsById(reference.specialGuest, 'name')}】${reference.label}`;
	}
	if ('excludedMaps' in reference) {
		return `非【${reference.excludedMaps.map((map) => MAP_FACTS[map].label).join('、')}】${reference.label}`;
	}

	return `【${MAP_FACTS[reference.map].label}】${reference.label}`;
}

export function getCollectionPointRefreshTimeHours(
	reference: TSourceReference
) {
	if (
		typeof reference === 'string' ||
		'task' in reference ||
		'specialGuest' in reference
	) {
		return null;
	}
	const excludedMaps =
		'excludedMaps' in reference ? reference.excludedMaps : undefined;

	const fact = COLLECTION_POINT_REFRESH_FACTS.find((candidate) => {
		if (excludedMaps !== undefined) {
			return (
				'excludedMaps' in candidate &&
				candidate.label === reference.label &&
				candidate.excludedMaps.length === excludedMaps.length &&
				candidate.excludedMaps.every(
					(map, index) => map === excludedMaps[index]
				)
			);
		}

		return (
			'map' in candidate &&
			candidate.label === reference.label &&
			candidate.map === reference.map
		);
	});

	return fact?.refreshTimeHours ?? null;
}
