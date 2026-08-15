import { COOKER_SERIES_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerSeriesId } from '@/domain/data/cookers/types';

export function resolveLegacyCookerSeries(value: unknown): TCookerSeriesId[] {
	const matches = Object.entries(COOKER_SERIES_LABEL_MAP)
		.filter(
			([series, label]) => Number(series) === value || label === value
		)
		.map(([series]) => Number(series) as TCookerSeriesId);
	if (matches.length === 0) {
		throw new Error('invalid-legacy-cooker-series');
	}

	return matches;
}
