interface IFilterableDecoration {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
}

export function filterDecorationData<
	TDecoration extends IFilterableDecoration,
>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
}: {
	data: ReadonlyArray<TDecoration>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
}): TDecoration[] {
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
