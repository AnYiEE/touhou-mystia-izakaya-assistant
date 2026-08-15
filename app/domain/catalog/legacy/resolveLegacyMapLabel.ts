import {
	ALL_MAP_LABELS,
	ALL_MAP_LABELS_SET,
	MAP_FACTS,
} from '@/domain/data/places/placeFacts';
import type { TMapLabel } from '@/domain/data/places/types';

export function resolveLegacyMapLabel({
	errorCode,
	label,
}: {
	errorCode: string;
	label: string;
}): TMapLabel {
	if (ALL_MAP_LABELS_SET.has(label)) {
		return label as TMapLabel;
	}

	const matchingMaps = ALL_MAP_LABELS.filter(
		(map) => MAP_FACTS[map].label === label
	);
	if (matchingMaps.length !== 1) {
		throw new Error(errorCode);
	}

	return matchingMaps[0] as TMapLabel;
}
