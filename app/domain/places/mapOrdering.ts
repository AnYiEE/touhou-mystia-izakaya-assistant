import { ALL_MAP_LABELS, MAP_FACTS } from '@/domain/data/places/placeFacts';

const MAP_CANONICAL_ORDER_MAP = new Map<string, number>(
	ALL_MAP_LABELS.map((map, index) => [map, index])
);

const MAP_DISPLAY_CANONICAL_ORDER_MAP = new Map<string, number>(
	ALL_MAP_LABELS.map((map, index) => [MAP_FACTS[map].label, index])
);

function compareByOrderMap(
	left: string,
	right: string,
	orderMap: ReadonlyMap<string, number>
) {
	const leftOrder = orderMap.get(left) ?? Number.POSITIVE_INFINITY;
	const rightOrder = orderMap.get(right) ?? Number.POSITIVE_INFINITY;

	return leftOrder === rightOrder ? 0 : leftOrder - rightOrder;
}

export function compareMapCanonicalOrder(left: string, right: string) {
	return compareByOrderMap(left, right, MAP_CANONICAL_ORDER_MAP);
}

export function compareMapDisplayCanonicalOrder(left: string, right: string) {
	return compareByOrderMap(left, right, MAP_DISPLAY_CANONICAL_ORDER_MAP);
}
