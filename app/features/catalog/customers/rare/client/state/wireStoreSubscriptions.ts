import { type State } from '@davstack/store';

import { type Recipe } from '@/domain/catalog/food/Recipe';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import { type createCustomerRareStoreActions } from './createStoreActions';
import { type customerRareInitialState } from './initialState';

type TCustomerRareSubscriptionStore = State<typeof customerRareInitialState> &
	ReturnType<typeof createCustomerRareStoreActions>;

export function wireCustomerRareStoreSubscriptions(
	customerRarePersistenceStore: TCustomerRareSubscriptionStore,
	instance_recipe: Recipe
) {
	customerRarePersistenceStore.shared.customer.name.onChange((name) => {
		customerRarePersistenceStore.refreshCustomer(name);
		customerRarePersistenceStore.refreshCustomerSelectedItems();
	});

	customerRarePersistenceStore.shared.customer.order.onChange(
		customerRarePersistenceStore.evaluateMealResult
	);

	customerRarePersistenceStore.shared.customer.famousShop.onChange(() => {
		customerRarePersistenceStore.updateRecipeTagsWithTrend();
		customerRarePersistenceStore.evaluateMealResult();
		customerRarePersistenceStore.shared.beverage.table.page.set(1);
		customerRarePersistenceStore.shared.recipe.table.page.set(1);
	});

	customerRarePersistenceStore.shared.customer.popularTrend.onChange(() => {
		customerRarePersistenceStore.updateRecipeTagsWithTrend();
		customerRarePersistenceStore.evaluateMealResult();
		customerRarePersistenceStore.shared.beverage.table.page.set(1);
		customerRarePersistenceStore.shared.recipe.table.page.set(1);
	});

	customerRarePersistenceStore.shared.customer.hasMystiaCooker.onChange(
		customerRarePersistenceStore.evaluateMealResult
	);

	customerRarePersistenceStore.shared.customer.isDarkMatter.onChange(
		customerRarePersistenceStore.evaluateMealResult
	);

	customerRarePersistenceStore.shared.beverage.name.onChange(
		customerRarePersistenceStore.evaluateMealResult
	);

	customerRarePersistenceStore.shared.recipe.data.onChange((data) => {
		customerRarePersistenceStore.updateRecipeTagsWithTrend();
		customerRarePersistenceStore.evaluateMealResult();
		if (data !== null) {
			if (checkLengthEmpty(data.extraIngredients)) {
				customerRarePersistenceStore.shared.customer.isDarkMatter.set(
					false
				);
			} else {
				customerRarePersistenceStore.shared.customer.isDarkMatter.set(
					instance_recipe.checkDarkMatter(data).isDarkMatter
				);
			}
		}
	});

	customerRarePersistenceStore.shared.hiddenItems.dlcs.onChange(() => {
		customerRarePersistenceStore.persistence.beverage.table.availabilityDlcs.set(
			[]
		);
		customerRarePersistenceStore.persistence.customer.filters.set({
			availabilityDlcs: [],
			excludes: [],
			includes: [],
			noPlaces: [],
			places: [],
		});
		customerRarePersistenceStore.persistence.ingredient.filters.set({
			availabilityDlcs: [],
			levels: [],
			noTags: [],
			tags: [],
		});
		customerRarePersistenceStore.persistence.recipe.table.availabilityDlcs.set(
			[]
		);
		customerRarePersistenceStore.persistence.recipe.table.cookers.set([]);
		customerRarePersistenceStore.shared.customer.name.set(null);
	});
}
