import type { TCustomerRareName } from '@/domain/data/customers/rare/types';

import type { ICustomerRareMeal } from '@/features/customerPlans/contracts';

import { customerRareStore } from './store';

export type TCustomerRareMealsPersistenceSnapshot = Partial<
	Record<TCustomerRareName, ICustomerRareMeal[]>
>;

export interface ICustomerRareSettingsPersistenceSnapshot {
	orderLinkedFilter: boolean;
	showTagDescription: boolean;
}

export function readCustomerRareMealsPersistenceSnapshot(): TCustomerRareMealsPersistenceSnapshot {
	return customerRareStore.persistence.meals.get();
}

export function replaceCustomerRareMealsPersistenceSnapshot(
	snapshot: TCustomerRareMealsPersistenceSnapshot
): void {
	customerRareStore.persistence.meals.set(snapshot);
}

export function readCustomerRareSettingsPersistenceSnapshot(): ICustomerRareSettingsPersistenceSnapshot {
	return {
		orderLinkedFilter:
			customerRareStore.persistence.customer.orderLinkedFilter.get(),
		showTagDescription:
			customerRareStore.persistence.customer.showTagDescription.get(),
	};
}

export function replaceCustomerRareSettingsPersistenceSnapshot(
	snapshot: ICustomerRareSettingsPersistenceSnapshot
): void {
	customerRareStore.persistence.customer.assign({
		orderLinkedFilter: snapshot.orderLinkedFilter,
		showTagDescription: snapshot.showTagDescription,
	});
}
