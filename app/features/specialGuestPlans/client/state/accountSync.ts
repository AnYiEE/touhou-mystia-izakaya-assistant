import type { ISpecialGuestPlansState } from '@/features/specialGuestPlans/contracts';

import { specialGuestPlansStore } from './store';

export function readSpecialGuestPlansPersistenceSnapshot(): ISpecialGuestPlansState {
	return specialGuestPlansStore.persistence.plans.get();
}

export function replaceSpecialGuestPlansPersistenceSnapshot(
	snapshot: ISpecialGuestPlansState
): void {
	specialGuestPlansStore.persistence.plans.set(snapshot);
}
