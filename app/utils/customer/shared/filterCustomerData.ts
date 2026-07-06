import { checkLengthEmpty, filterItems } from '@/utilities';

interface IFilterableCustomer {
	dlc: number;
	name: string;
	places: ReadonlyArray<string>;
}

export function filterCustomerData<TCustomer extends IFilterableCustomer>({
	customerData,
	customerFilterDlcs,
	customerFilterExcludes,
	customerFilterIncludes,
	customerFilterNoPlaces,
	customerFilterPlaces,
}: {
	customerData: ReadonlyArray<TCustomer>;
	customerFilterDlcs: ReadonlyArray<string>;
	customerFilterExcludes: ReadonlyArray<string>;
	customerFilterIncludes: ReadonlyArray<string>;
	customerFilterNoPlaces: ReadonlyArray<string>;
	customerFilterPlaces: ReadonlyArray<string>;
}): TCustomer[] {
	const filtered = filterItems(customerData, [
		{ field: 'name', match: 'excludeIn', values: customerFilterExcludes },
		{ field: 'dlc', match: 'in', values: customerFilterDlcs },
		{ field: 'places', match: 'any', values: customerFilterPlaces },
		{
			field: 'places',
			match: 'excludeAny',
			values: customerFilterNoPlaces,
		},
	]);

	if (checkLengthEmpty(customerFilterIncludes)) {
		return filtered;
	}

	const filteredNames = new Set(filtered.map(({ name }) => name));

	return customerData.filter(
		({ name }) =>
			filteredNames.has(name) || customerFilterIncludes.includes(name)
	);
}
