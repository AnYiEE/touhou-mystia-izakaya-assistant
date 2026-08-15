import type { TMapLabel } from '@/domain/data/places/types';

interface IFilterableGuest {
	availabilityDlcs: ReadonlyArray<number>;
	id: number;
	maps: ReadonlyArray<TMapLabel>;
}

export function filterGuestData<TGuest extends IFilterableGuest>({
	guestData,
	guestFilterAvailabilityDlcs,
	guestFilterExcludes,
	guestFilterIncludes,
	guestFilterMaps,
	guestFilterNoMaps,
}: {
	guestData: ReadonlyArray<TGuest>;
	guestFilterAvailabilityDlcs: ReadonlyArray<string>;
	guestFilterExcludes: ReadonlyArray<number>;
	guestFilterIncludes: ReadonlyArray<number>;
	guestFilterMaps: ReadonlyArray<TMapLabel>;
	guestFilterNoMaps: ReadonlyArray<TMapLabel>;
}): TGuest[] {
	const hasAvailabilityDlcFilter = guestFilterAvailabilityDlcs.length > 0;
	const hasExcludeFilter = guestFilterExcludes.length > 0;
	const hasIncludeFilter = guestFilterIncludes.length > 0;
	const hasMapFilter = guestFilterMaps.length > 0;
	const hasNoMapFilter = guestFilterNoMaps.length > 0;

	return guestData.filter(({ availabilityDlcs, id, maps }) => {
		let isMatched = true;

		if (hasExcludeFilter && guestFilterExcludes.includes(id)) {
			isMatched = false;
		} else if (
			hasAvailabilityDlcFilter &&
			!guestFilterAvailabilityDlcs.some((selectedDlc) =>
				availabilityDlcs.some((dlc) => selectedDlc === String(dlc))
			)
		) {
			isMatched = false;
		} else if (
			hasMapFilter &&
			!guestFilterMaps.some((map) => maps.includes(map))
		) {
			isMatched = false;
		} else if (
			hasNoMapFilter &&
			guestFilterNoMaps.some((map) => maps.includes(map))
		) {
			isMatched = false;
		}

		return (
			isMatched || (hasIncludeFilter && guestFilterIncludes.includes(id))
		);
	});
}
