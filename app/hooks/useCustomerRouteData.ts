import { useCallback } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import { customerNormalStore, customerRareStore } from '@/stores';
import { type CustomerNormal, type CustomerRare } from '@/utils';
import { filterCustomerData } from '@/utils/customer/shared';
import type { TItemData } from '@/utils/types';

type TCustomerInstance = CustomerNormal | CustomerRare;
type TCustomerRouteStore =
	| typeof customerNormalStore
	| typeof customerRareStore;

type TCustomerData = TItemData<CustomerNormal> | TItemData<CustomerRare>;
type TCustomerRouteItem =
	| TItemData<CustomerNormal>[number]
	| TItemData<CustomerRare>[number];

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
			filterCustomerData<TCustomerRouteItem>({
				customerData: instance_customer.data,
				customerFilterDlcs,
				customerFilterExcludes,
				customerFilterIncludes,
				customerFilterNoPlaces,
				customerFilterPlaces,
			}) as TCustomerData,
		[
			customerFilterDlcs,
			customerFilterExcludes,
			customerFilterIncludes,
			customerFilterNoPlaces,
			customerFilterPlaces,
			instance_customer.data,
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
