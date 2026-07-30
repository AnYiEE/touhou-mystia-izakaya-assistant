interface IFilterableCurrency {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
}

export function filterCurrencyData<TCurrency extends IFilterableCurrency>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
}: {
	data: ReadonlyArray<TCurrency>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
}): TCurrency[] {
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
