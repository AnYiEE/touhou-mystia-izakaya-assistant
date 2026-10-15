import { DAY_MAP_EXTRA_FACTS } from '@/domain/data/maps/dayMapExtraFacts';
import type { TDayMapLabel, TExtraDayMapLabel } from '@/domain/data/maps/types';
import { ALL_MAP_LABELS, MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TDlc } from '@/domain/data/shared/types';
import { getDayMapPlaceName } from '@/domain/maps/localizedLabels';
import { getMapLabel, getPlaceLabel } from '@/domain/places/localizedLabels';

export const EXTRA_DAY_MAP_LABELS = Object.keys(
	DAY_MAP_EXTRA_FACTS
) as TExtraDayMapLabel[];

/** @description The fifteen regions in canonical order, then interiors and event scenes. */
export const ALL_DAY_MAP_LABELS: ReadonlyArray<TDayMapLabel> = [
	...ALL_MAP_LABELS,
	...EXTRA_DAY_MAP_LABELS,
];

const DAY_MAP_LABEL_SET: ReadonlySet<string> = new Set(ALL_DAY_MAP_LABELS);
const EXTRA_DAY_MAP_LABEL_SET: ReadonlySet<string> = new Set(
	EXTRA_DAY_MAP_LABELS
);

export function checkDayMapLabel(value: string): value is TDayMapLabel {
	return DAY_MAP_LABEL_SET.has(value);
}

export function checkExtraDayMapLabel(
	map: TDayMapLabel
): map is TExtraDayMapLabel {
	return EXTRA_DAY_MAP_LABEL_SET.has(map);
}

export function getDayMapLabel(map: TDayMapLabel) {
	if (!checkExtraDayMapLabel(map)) {
		return getMapLabel(map);
	}
	if (map === 'Hakugyokurou') {
		return getPlaceLabel(map);
	}

	return getDayMapPlaceName(map, DAY_MAP_EXTRA_FACTS[map].name);
}

export function getDayMapDlc(map: TDayMapLabel): TDlc {
	return checkExtraDayMapLabel(map)
		? DAY_MAP_EXTRA_FACTS[map].dlc
		: MAP_FACTS[map].dlc;
}
