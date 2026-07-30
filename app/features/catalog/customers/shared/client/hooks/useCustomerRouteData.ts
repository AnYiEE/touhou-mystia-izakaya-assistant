import { useCallback } from 'react';

import { type CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { type CustomerRare } from '@/domain/catalog/customers/CustomerRare';

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import { filterCustomerData } from '@/features/catalog/customers/shared/queries/filterCustomerData';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import type { TItemData } from '@/features/catalog/shared/contracts';

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

	const customerFilterAvailabilityDlcs =
		store.persistence.customer.filters.availabilityDlcs.use();
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
				customerFilterAvailabilityDlcs,
				customerFilterExcludes,
				customerFilterIncludes,
				customerFilterNoPlaces,
				customerFilterPlaces,
			}) as TCustomerData,
		[
			customerFilterAvailabilityDlcs,
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
