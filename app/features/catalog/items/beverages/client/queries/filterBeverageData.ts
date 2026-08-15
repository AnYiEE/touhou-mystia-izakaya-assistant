import type { TMapLabel } from '@/domain/data/places/types';
import type { TBeverageTagId } from '@/domain/data/tags/types';

interface IFilterableBeverage {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
	level: number;
	maps: ReadonlyArray<TMapLabel>;
	tags: ReadonlyArray<TBeverageTagId>;
}

export function filterBeverageData<TBeverage extends IFilterableBeverage>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterLevels,
	filterMaps,
	filterNoMaps,
	filterNoTags,
	filterTags,
}: {
	data: ReadonlyArray<TBeverage>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterMaps: ReadonlyArray<TMapLabel>;
	filterNoMaps: ReadonlyArray<TMapLabel>;
	filterNoTags: ReadonlyArray<TBeverageTagId>;
	filterTags: ReadonlyArray<TBeverageTagId>;
}): TBeverage[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNoMapFilter = filterNoMaps.length > 0;
	const hasNoTagFilter = filterNoTags.length > 0;
	const hasMapFilter = filterMaps.length > 0;
	const hasTagFilter = filterTags.length > 0;

	return data.filter(({ availabilityDlcs, dlc, level, maps, tags }) => {
		if (
			hasAvailabilityDlcFilter &&
			!filterAvailabilityDlcs.some((selectedDlc) =>
				availabilityDlcs.some(
					(availabilityDlc) => selectedDlc === String(availabilityDlc)
				)
			)
		) {
			return false;
		}
		if (hasContentDlcFilter && !filterContentDlcs.includes(String(dlc))) {
			return false;
		}
		if (hasLevelFilter && !filterLevels.includes(String(level))) {
			return false;
		}
		if (hasTagFilter && !filterTags.every((tag) => tags.includes(tag))) {
			return false;
		}
		if (hasNoTagFilter && filterNoTags.some((tag) => tags.includes(tag))) {
			return false;
		}
		if (
			hasMapFilter &&
			!filterMaps.some((filterMap) => maps.includes(filterMap))
		) {
			return false;
		}
		if (
			hasNoMapFilter &&
			filterNoMaps.some((filterMap) => maps.includes(filterMap))
		) {
			return false;
		}

		return true;
	});
}
