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
		normalGuestStore.persistence.beverage.table.availabilityDlcs.set([]);
		normalGuestStore.persistence.guest.filters.set({
			availabilityDlcs: [],
			excludes: [],
			includes: [],
			noPlaces: [],
			places: [],
		});
		normalGuestStore.persistence.ingredient.filters.set({
			availabilityDlcs: [],
			levels: [],
			noTags: [],
			tags: [],
		});
		normalGuestStore.persistence.recipe.table.availabilityDlcs.set([]);
		normalGuestStore.persistence.recipe.table.cookerTypes.set([]);
		normalGuestStore.shared.guest.id.set(null);
	});
}
