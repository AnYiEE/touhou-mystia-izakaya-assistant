interface IFilterableClothes {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
}

export function filterClothesData<TClothes extends IFilterableClothes>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
}: {
	data: ReadonlyArray<TClothes>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
}): TClothes[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;

	return data.filter(({ availabilityDlcs, dlc }) => {
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

		return true;
	});
}
