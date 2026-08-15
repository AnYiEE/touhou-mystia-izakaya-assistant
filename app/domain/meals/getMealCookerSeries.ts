import type { TCookerSeriesId } from '@/domain/data/cookers/types';

export function getMealCookerSeries({
	hasMystiaCooker,
	isDarkMatter,
}: {
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
}): TCookerSeriesId {
	return isDarkMatter || !hasMystiaCooker ? 0 : 1;
}
