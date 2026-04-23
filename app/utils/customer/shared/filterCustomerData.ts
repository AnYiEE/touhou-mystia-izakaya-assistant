import { checkLengthEmpty, filterItems } from '@/utilities';

interface IFilterableCustomer {
	dlc: number;
	name: string;
	places: ReadonlyArray<string>;
}

export interface IFilterCustomerDataArgs<
	TCustomer extends IFilterableCustomer,
> {
	customerFilterDlcs: ReadonlyArray<string>;
	customerFilterExcludes: ReadonlyArray<string>;
	customerFilterIncludes: ReadonlyArray<string>;
	customerFilterNoPlaces: ReadonlyArray<string>;
	customerFilterPlaces: ReadonlyArray<string>;
	customerSearchResult: ReadonlyArray<TCustomer>;
}

/**
 * 对顾客搜索结果应用纯过滤规则，保留 includes 对局部筛选的回补语义。
 */
export function filterCustomerData<TCustomer extends IFilterableCustomer>({
	customerFilterDlcs,
	customerFilterExcludes,
	customerFilterIncludes,
	customerFilterNoPlaces,
	customerFilterPlaces,
	customerSearchResult,
}: IFilterCustomerDataArgs<TCustomer>): TCustomer[] {
	const filtered = filterItems(customerSearchResult, [
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

	return customerSearchResult.filter(
		({ name }) =>
			filteredNames.has(name) || customerFilterIncludes.includes(name)
	);
}
