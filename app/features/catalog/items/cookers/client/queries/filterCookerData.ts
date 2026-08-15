import type {
	TCookerSeriesId,
	TCookerTypeId,
} from '@/domain/data/cookers/types';

interface IFilterableCooker {
	availabilityDlcs: ReadonlyArray<number>;
	availableTypes: ReadonlyArray<TCookerTypeId>;
	dlc: number;
	series: TCookerSeriesId;
}

export function filterCookerData<TCooker extends IFilterableCooker>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterNoSeries,
	filterNoTypes,
	filterSeries,
	filterTypes,
}: {
	data: ReadonlyArray<TCooker>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterNoSeries: ReadonlyArray<TCookerSeriesId>;
	filterNoTypes: ReadonlyArray<TCookerTypeId>;
	filterSeries: ReadonlyArray<TCookerSeriesId>;
	filterTypes: ReadonlyArray<TCookerTypeId>;
}): TCooker[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasSeriesFilter = filterSeries.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasNoSeriesFilter = filterNoSeries.length > 0;
	const hasNoTypeFilter = filterNoTypes.length > 0;
	const hasTypeFilter = filterTypes.length > 0;

	return data.filter(({ availabilityDlcs, availableTypes, dlc, series }) => {
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
		if (hasSeriesFilter && !filterSeries.includes(series)) {
			return false;
		}
		if (hasNoSeriesFilter && filterNoSeries.includes(series)) {
			return false;
		}
		if (
			hasTypeFilter &&
			!filterTypes.some((selectedType) =>
				availableTypes.includes(selectedType)
			)
		) {
			return false;
		}
		if (
			hasNoTypeFilter &&
			filterNoTypes.some((selectedType) =>
				availableTypes.includes(selectedType)
			)
		) {
			return false;
		}

		return true;
	});
}
