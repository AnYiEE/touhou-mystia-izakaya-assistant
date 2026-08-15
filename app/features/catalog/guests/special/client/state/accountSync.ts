import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { ISpecialGuestSavedMeal } from '@/domain/meals/types';

import { specialGuestStore } from './store';

export type TSpecialGuestMealsPersistenceSnapshot = Partial<
	Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>
>;

export interface ISpecialGuestSettingsPersistenceSnapshot {
	orderLinkedFilter: boolean;
	showTagDescription: boolean;
}

export function readSpecialGuestMealsPersistenceSnapshot(): TSpecialGuestMealsPersistenceSnapshot {
	return specialGuestStore.persistence.meals.get();
}

export function replaceSpecialGuestMealsPersistenceSnapshot(
	snapshot: TSpecialGuestMealsPersistenceSnapshot
): void {
	specialGuestStore.persistence.meals.set(snapshot);
}

export function readSpecialGuestSettingsPersistenceSnapshot(): ISpecialGuestSettingsPersistenceSnapshot {
	return {
		orderLinkedFilter:
			specialGuestStore.persistence.guest.orderLinkedFilter.get(),
		showTagDescription:
			specialGuestStore.persistence.guest.showTagDescription.get(),
	};
}

export function replaceSpecialGuestSettingsPersistenceSnapshot(
	snapshot: ISpecialGuestSettingsPersistenceSnapshot
): void {
	specialGuestStore.persistence.guest.assign({
		orderLinkedFilter: snapshot.orderLinkedFilter,
		showTagDescription: snapshot.showTagDescription,
	});
}
