import { normalGuestPersistenceShape } from '@/features/catalog/guests/shared/state/guestPersistenceShape';

import { type TNormalGuestStore } from './createStoreActions';

export function wireNormalGuestStoreSubscriptions(
	normalGuestStore: TNormalGuestStore
): void {
	normalGuestStore.shared.guest.id.onChange((normalGuest) => {
		normalGuestStore.refreshGuest(normalGuest);
		normalGuestStore.refreshGuestSelectedItems();
	});

	normalGuestStore.shared.guest.famousShop.onChange(() => {
		normalGuestStore.updateFoodTagsWithTrend();
		normalGuestStore.evaluateMealResult();
		normalGuestStore.shared.beverage.table.page.set(1);
		normalGuestStore.shared.recipe.table.page.set(1);
	});
	normalGuestStore.shared.guest.popularTrend.onChange(() => {
		normalGuestStore.updateFoodTagsWithTrend();
		normalGuestStore.evaluateMealResult();
		normalGuestStore.shared.beverage.table.page.set(1);
		normalGuestStore.shared.recipe.table.page.set(1);
	});

	normalGuestStore.shared.recipe.data.onChange(() => {
		normalGuestStore.updateFoodTagsWithTrend();
		normalGuestStore.evaluateMealResult();
	});

	normalGuestStore.shared.hiddenItems.dlcs.onChange(() => {
		const defaults = normalGuestPersistenceShape.createDefault();
		normalGuestStore.persistence.beverage.table.availabilityDlcs.set(
			defaults.beverage.table.availabilityDlcs
		);
		normalGuestStore.persistence.guest.filters.set(defaults.guest.filters);
		normalGuestStore.persistence.ingredient.filters.set(
			defaults.ingredient.filters
		);
		normalGuestStore.persistence.recipe.table.availabilityDlcs.set(
			defaults.recipe.table.availabilityDlcs
		);
		normalGuestStore.persistence.recipe.table.cookerTypes.set(
			defaults.recipe.table.cookerTypes
		);
		normalGuestStore.shared.guest.id.set(null);
	});
}
