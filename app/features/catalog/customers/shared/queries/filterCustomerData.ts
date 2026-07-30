interface IFilterableCustomer {
	availabilityDlcs: ReadonlyArray<number>;
	name: string;
	places: ReadonlyArray<string>;
}

export function filterCustomerData<TCustomer extends IFilterableCustomer>({
	customerData,
	customerFilterAvailabilityDlcs,
	customerFilterExcludes,
	customerFilterIncludes,
	customerFilterNoPlaces,
	customerFilterPlaces,
}: {
	customerData: ReadonlyArray<TCustomer>;
	customerFilterAvailabilityDlcs: ReadonlyArray<string>;
	customerFilterExcludes: ReadonlyArray<string>;
	customerFilterIncludes: ReadonlyArray<string>;
	customerFilterNoPlaces: ReadonlyArray<string>;
	customerFilterPlaces: ReadonlyArray<string>;
}): TCustomer[] {
	const hasAvailabilityDlcFilter = customerFilterAvailabilityDlcs.length > 0;
	const hasExcludeFilter = customerFilterExcludes.length > 0;
	const hasIncludeFilter = customerFilterIncludes.length > 0;
	const hasNoPlaceFilter = customerFilterNoPlaces.length > 0;
	const hasPlaceFilter = customerFilterPlaces.length > 0;

	return customerData.filter(({ availabilityDlcs, name, places }) => {
		let isMatched = true;

		if (hasExcludeFilter && customerFilterExcludes.includes(name)) {
			isMatched = false;
		} else if (
			hasAvailabilityDlcFilter &&
			!customerFilterAvailabilityDlcs.some((selectedDlc) =>
				availabilityDlcs.some((dlc) => selectedDlc === String(dlc))
			)
		) {
			isMatched = false;
		} else if (
			hasPlaceFilter &&
			!customerFilterPlaces.some((place) => places.includes(place))
		) {
			isMatched = false;
		} else if (
			hasNoPlaceFilter &&
			customerFilterNoPlaces.some((place) => places.includes(place))
		) {
			isMatched = false;
		}

		return (
			isMatched ||
			(hasIncludeFilter && customerFilterIncludes.includes(name))
		);
	});
}
