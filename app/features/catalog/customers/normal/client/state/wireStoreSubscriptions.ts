import { type TCustomerNormalStore } from './createStoreActions';

export function wireCustomerNormalStoreSubscriptions(
	customerNormalStore: TCustomerNormalStore
): void {
	customerNormalStore.shared.customer.name.onChange((name) => {
		customerNormalStore.refreshCustomer(name);
		customerNormalStore.refreshCustomerSelectedItems();
	});

	customerNormalStore.shared.customer.famousShop.onChange(() => {
		customerNormalStore.updateRecipeTagsWithTrend();
		customerNormalStore.evaluateMealResult();
		customerNormalStore.shared.beverage.table.page.set(1);
		customerNormalStore.shared.recipe.table.page.set(1);
	});
	customerNormalStore.shared.customer.popularTrend.onChange(() => {
		customerNormalStore.updateRecipeTagsWithTrend();
		customerNormalStore.evaluateMealResult();
		customerNormalStore.shared.beverage.table.page.set(1);
		customerNormalStore.shared.recipe.table.page.set(1);
	});

	customerNormalStore.shared.recipe.data.onChange(() => {
		customerNormalStore.updateRecipeTagsWithTrend();
		customerNormalStore.evaluateMealResult();
	});

	customerNormalStore.shared.hiddenItems.dlcs.onChange(() => {
		customerNormalStore.persistence.beverage.table.availabilityDlcs.set([]);
		customerNormalStore.persistence.customer.filters.set({
			availabilityDlcs: [],
			excludes: [],
			includes: [],
			noPlaces: [],
			places: [],
		});
		customerNormalStore.persistence.ingredient.filters.set({
			availabilityDlcs: [],
			levels: [],
			noTags: [],
			tags: [],
		});
		customerNormalStore.persistence.recipe.table.availabilityDlcs.set([]);
		customerNormalStore.persistence.recipe.table.cookers.set([]);
		customerNormalStore.shared.customer.name.set(null);
	});
}
