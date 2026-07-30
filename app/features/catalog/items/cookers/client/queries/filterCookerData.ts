interface IFilterableCooker {
	availabilityDlcs: ReadonlyArray<number>;
	category: string;
	dlc: number;
	type: string | ReadonlyArray<string>;
}

export function filterCookerData<TCooker extends IFilterableCooker>({
	data,
	filterAvailabilityDlcs,
	filterCategories,
	filterContentDlcs,
	filterNoCategories,
	filterNoTypes,
	filterTypes,
}: {
	data: ReadonlyArray<TCooker>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterCategories: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterNoCategories: ReadonlyArray<string>;
	filterNoTypes: ReadonlyArray<string>;
	filterTypes: ReadonlyArray<string>;
}): TCooker[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasCategoryFilter = filterCategories.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasNoCategoryFilter = filterNoCategories.length > 0;
	const hasNoTypeFilter = filterNoTypes.length > 0;
	const hasTypeFilter = filterTypes.length > 0;

	return data.filter(({ availabilityDlcs, category, dlc, type }) => {
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
		if (hasCategoryFilter && !filterCategories.includes(category)) {
			return false;
		}
		if (hasNoCategoryFilter && filterNoCategories.includes(category)) {
			return false;
		}
		if (
			hasTypeFilter &&
			!filterTypes.some((selectedType) =>
				Array.isArray(type)
					? type.includes(selectedType)
					: selectedType === type
			)
		) {
			return false;
		}
		if (
			hasNoTypeFilter &&
			filterNoTypes.some((selectedType) =>
				Array.isArray(type)
					? type.includes(selectedType)
					: selectedType === type
			)
		) {
			return false;
		}

		return true;
	});
}
