'use client';

import { useCallback } from 'react';

import { customerNormalStore, customerRareStore } from '@/stores';
import { filterCustomerData } from '@/utils/customer/shared';
import type { CustomerNormal, CustomerRare } from '@/utils';
import type { TItemData } from '@/utils/types';

import { useFilteredData } from './useFilteredData';
import { useSearchResult } from './useSearchResult';
import { useSortedData } from './useSortedData';
import { useThrottle } from './useThrottle';

interface IFilterableCustomer {
	dlc: number;
	name: string;
	places: ReadonlyArray<string>;
}

type TCustomerInstance = CustomerNormal | CustomerRare;

type TCustomerRouteStore =
	| typeof customerNormalStore
	| typeof customerRareStore;

type TCustomerData = TItemData<CustomerNormal> | TItemData<CustomerRare>;

export function useCustomerRouteData(
	instance_customer: CustomerNormal,
	store: typeof customerNormalStore
): { customerSortedData: TItemData<CustomerNormal> };

export function useCustomerRouteData(
	instance_customer: CustomerRare,
	store: typeof customerRareStore
): { customerSortedData: TItemData<CustomerRare> };

export function useCustomerRouteData(
	instance_customer: TCustomerInstance,
	store: TCustomerRouteStore
) {
	const customerPinyinSortState =
		store.persistence.customer.pinyinSortState.use();
	const customerSearchValue = store.persistence.customer.searchValue.use();
	const throttledCustomerSearchValue = useThrottle(customerSearchValue);

	const customerSearchResult = useSearchResult(
		instance_customer as never,
		throttledCustomerSearchValue
	) as TCustomerData;

	const customerFilterDlcs = store.persistence.customer.filters.dlcs.use();
	const customerFilterExcludes =
		store.persistence.customer.filters.excludes.use();
	const customerFilterIncludes =
		store.persistence.customer.filters.includes.use();
	const customerFilterNoPlaces =
		store.persistence.customer.filters.noPlaces.use();
	const customerFilterPlaces =
		store.persistence.customer.filters.places.use();

	const filterData = useCallback(
		() =>
			filterCustomerData({
				customerFilterDlcs,
				customerFilterExcludes,
				customerFilterIncludes,
				customerFilterNoPlaces,
				customerFilterPlaces,
				customerSearchResult:
					customerSearchResult as ReadonlyArray<IFilterableCustomer>,
			}) as unknown as TCustomerData,
		[
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
			customerSearchResult,
		]
	);

	const customerFilteredData = useFilteredData(
		instance_customer as never,
		filterData as never
	) as TCustomerData;

	const customerSortedData = useSortedData(
		instance_customer as never,
		customerFilteredData as never,
		customerPinyinSortState
	) as TCustomerData;

	return { customerSortedData };
}
