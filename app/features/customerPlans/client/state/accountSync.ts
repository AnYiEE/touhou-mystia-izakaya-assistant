import type { ICustomerRarePlansState } from '@/features/customerPlans/contracts';

import { customerPlansStore } from './store';

export function readCustomerRarePlansPersistenceSnapshot(): ICustomerRarePlansState {
	return customerPlansStore.persistence.plans.get();
}

export function replaceCustomerRarePlansPersistenceSnapshot(
	snapshot: ICustomerRarePlansState
): void {
	customerPlansStore.persistence.plans.set(snapshot);
}
