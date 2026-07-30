interface IFilterableOrnament {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
}

export function filterOrnamentData<TOrnament extends IFilterableOrnament>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
}: {
	data: ReadonlyArray<TOrnament>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
}): TOrnament[] {
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
