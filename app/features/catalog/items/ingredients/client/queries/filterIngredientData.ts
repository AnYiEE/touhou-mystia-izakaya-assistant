interface IFilterableIngredient {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
	level: number;
	places: ReadonlyArray<string>;
	tags: ReadonlyArray<string>;
	type: string;
}

export function filterIngredientData<
	TIngredient extends IFilterableIngredient,
>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterLevels,
	filterNoPlaces,
	filterNoTags,
	filterNoTypes,
	filterPlaces,
	filterTags,
	filterTypes,
}: {
	data: ReadonlyArray<TIngredient>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterLevels: ReadonlyArray<string>;
	filterNoPlaces: ReadonlyArray<string>;
	filterNoTags: ReadonlyArray<string>;
	filterNoTypes: ReadonlyArray<string>;
	filterPlaces: ReadonlyArray<string>;
	filterTags: ReadonlyArray<string>;
	filterTypes: ReadonlyArray<string>;
}): TIngredient[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasLevelFilter = filterLevels.length > 0;
	const hasNoPlaceFilter = filterNoPlaces.length > 0;
	const hasNoTagFilter = filterNoTags.length > 0;
	const hasNoTypeFilter = filterNoTypes.length > 0;
	const hasPlaceFilter = filterPlaces.length > 0;
	const hasTagFilter = filterTags.length > 0;
	const hasTypeFilter = filterTypes.length > 0;

	return data.filter(
		({ availabilityDlcs, dlc, level, places, tags, type }) => {
			if (
				hasAvailabilityDlcFilter &&
				!filterAvailabilityDlcs.some((selectedDlc) =>
					availabilityDlcs.some(
						(availabilityDlc) =>
							selectedDlc === String(availabilityDlc)
					)
				)
			) {
				return false;
			}
			if (
				hasContentDlcFilter &&
				!filterContentDlcs.includes(String(dlc))
			) {
				return false;
			}
			if (hasLevelFilter && !filterLevels.includes(String(level))) {
				return false;
			}
			if (
				hasTagFilter &&
				!filterTags.every((tag) => tags.includes(tag))
			) {
				return false;
			}
			if (
				hasNoTagFilter &&
				filterNoTags.some((tag) => tags.includes(tag))
			) {
				return false;
			}
			if (hasTypeFilter && !filterTypes.includes(type)) {
				return false;
			}
			if (hasNoTypeFilter && filterNoTypes.includes(type)) {
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
		}
	);
}
