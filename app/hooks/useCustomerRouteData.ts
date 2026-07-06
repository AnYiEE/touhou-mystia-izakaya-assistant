import { useCallback } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import { type TDlc } from '@/data';
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
	const isCustomerVisibleWithHiddenDlcs = useCallback(
		(item: TCustomerRouteItem, hiddenDlcs: ReadonlySet<TDlc>) => {
			if ('isVisibleWithHiddenDlcs' in instance_customer) {
				return instance_customer.isVisibleWithHiddenDlcs(
					{ dlc: item.dlc, name: item.name } as Parameters<
						typeof instance_customer.isVisibleWithHiddenDlcs
					>[0],
					hiddenDlcs
				);
			}

			return !hiddenDlcs.has(item.dlc);
		},
		[instance_customer]
	);

	const customerFilteredData = useFilteredData(
		instance_customer,
		filterData,
		isCustomerVisibleWithHiddenDlcs
	);

	const customerSortedData = useSortedData(
		instance_customer,
		customerFilteredData,
		customerPinyinSortState
	);

	return { customerSortedData };
}
