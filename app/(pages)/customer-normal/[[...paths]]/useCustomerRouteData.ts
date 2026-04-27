'use client';

import { useCallback } from 'react';

import {
	useFilteredData,
	useSearchResult,
	useSortedData,
	useThrottle,
} from '@/hooks';
import { customerNormalStore as customerStore } from '@/stores';
import { filterCustomerData } from '@/utils/customer/shared';

export function useCustomerRouteData() {
	const instance_customer = customerStore.instances.customer.get();

	const customerPinyinSortState =
		customerStore.persistence.customer.pinyinSortState.use();
	const customerSearchValue =
		customerStore.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const customerSearchResult = useSearchResult(
		instance_customer,
		throttledCustomerSearchValue
	);

	const customerFilterDlcs =
		customerStore.persistence.customer.filters.dlcs.use();
	const customerFilterExcludes =
		customerStore.persistence.customer.filters.excludes.use();
	const customerFilterIncludes =
		customerStore.persistence.customer.filters.includes.use();
	const customerFilterNoPlaces =
		customerStore.persistence.customer.filters.noPlaces.use();
	const customerFilterPlaces =
		customerStore.persistence.customer.filters.places.use();

	const filterData = useCallback(
		() =>
			filterCustomerData({
				customerFilterDlcs,
				customerFilterExcludes,
				customerFilterIncludes,
				customerFilterNoPlaces,
				customerFilterPlaces,
				customerSearchResult,
			}),
		[
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
			customerSearchResult,
		]
	);

	const customerFilteredData = useFilteredData(instance_customer, filterData);

	const customerSortedData = useSortedData(
		instance_customer,
		customerFilteredData,
		customerPinyinSortState
	);

	return { customerSortedData };
}
