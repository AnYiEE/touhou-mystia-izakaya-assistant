interface IFilterableCollectible {
	availabilityDlcs: ReadonlyArray<number>;
	dlc: number;
}

export function filterCollectibleData<
	TCollectible extends IFilterableCollectible,
>({
	data,
	filterAvailabilityDlcs,
	filterContentDlcs,
	filterSources,
	getSources,
}: {
	data: ReadonlyArray<TCollectible>;
	filterAvailabilityDlcs: ReadonlyArray<string>;
	filterContentDlcs: ReadonlyArray<string>;
	filterSources: ReadonlyArray<string>;
	getSources: (item: TCollectible) => string[];
}): TCollectible[] {
	const hasAvailabilityDlcFilter = filterAvailabilityDlcs.length > 0;
	const hasContentDlcFilter = filterContentDlcs.length > 0;
	const hasSourceFilter = filterSources.length > 0;

	return data.filter((item) => {
		if (
			hasAvailabilityDlcFilter &&
			!filterAvailabilityDlcs.some((selectedDlc) =>
				item.availabilityDlcs.some(
					(availabilityDlc) => selectedDlc === String(availabilityDlc)
				)
			)
		) {
			return false;
		}
		if (
			hasContentDlcFilter &&
			!filterContentDlcs.includes(String(item.dlc))
		) {
			return false;
		}
		if (
			hasSourceFilter &&
			!filterSources.some((source) => getSources(item).includes(source))
		) {
			return false;
		}

		return true;
	});
}
