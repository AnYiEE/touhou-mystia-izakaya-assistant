interface IFilterableBeverage {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
	level: number;
	places: ReadonlyArray<string>;
	tags: ReadonlyArray<string>;
}

export function filterBeverageData<TBeverage extends IFilterableBeverage>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterLevels,
	filterNoPlaces,
	filterNoTags,
	filterPlaces,
	filterTags,
}: {
	data: ReadonlyArray<TBeverage>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNoPlaces: ReadonlyArray<string>;
	filterNoTags: ReadonlyArray<string>;
	filterPlaces: ReadonlyArray<string>;
	filterTags: ReadonlyArray<string>;
}): TBeverage[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNoPlaceFilter = filterNoPlaces.length > 0;
	const hasNoTagFilter = filterNoTags.length > 0;
	const hasPlaceFilter = filterPlaces.length > 0;
	const hasTagFilter = filterTags.length > 0;

	return data.filter(({ availabilityDlcs, dlc, level, places, tags }) => {
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
			hasPlaceFilter &&
			!filterPlaces.some((place) => places.includes(place))
		) {
			return false;
		}
		if (
			hasNoPlaceFilter &&
			filterNoPlaces.some((place) => places.includes(place))
		) {
			return false;
		}

		return true;
	});
}
