import { type State } from '@davstack/store';

import { type FoodCatalog } from '@/domain/catalog/food/FoodCatalog';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import { type createSpecialGuestStoreActions } from './createStoreActions';
import { type specialGuestInitialState } from './initialState';

type TSpecialGuestSubscriptionStore = State<typeof specialGuestInitialState> &
	ReturnType<typeof createSpecialGuestStoreActions>;

export function wireSpecialGuestStoreSubscriptions(
	specialGuestPersistenceStore: TSpecialGuestSubscriptionStore,
	foodCatalog: FoodCatalog
) {
	specialGuestPersistenceStore.shared.guest.id.onChange((specialGuest) => {
		specialGuestPersistenceStore.refreshGuest(specialGuest);
		specialGuestPersistenceStore.refreshGuestSelectedItems();
	});

	specialGuestPersistenceStore.shared.guest.order.onChange(
		specialGuestPersistenceStore.evaluateMealResult
	);

	specialGuestPersistenceStore.shared.guest.famousShop.onChange(() => {
		specialGuestPersistenceStore.updateFoodTagsWithTrend();
		specialGuestPersistenceStore.evaluateMealResult();
		specialGuestPersistenceStore.shared.beverage.table.page.set(1);
		specialGuestPersistenceStore.shared.recipe.table.page.set(1);
	});

	specialGuestPersistenceStore.shared.guest.popularTrend.onChange(() => {
		specialGuestPersistenceStore.updateFoodTagsWithTrend();
		specialGuestPersistenceStore.evaluateMealResult();
		specialGuestPersistenceStore.shared.beverage.table.page.set(1);
		specialGuestPersistenceStore.shared.recipe.table.page.set(1);
	});

	specialGuestPersistenceStore.shared.guest.hasMystiaCooker.onChange(
		specialGuestPersistenceStore.evaluateMealResult
	);

	specialGuestPersistenceStore.shared.guest.isDarkMatter.onChange(
		specialGuestPersistenceStore.evaluateMealResult
	);

	specialGuestPersistenceStore.shared.beverage.id.onChange(
		specialGuestPersistenceStore.evaluateMealResult
	);

	specialGuestPersistenceStore.shared.recipe.data.onChange((data) => {
		specialGuestPersistenceStore.updateFoodTagsWithTrend();
		specialGuestPersistenceStore.evaluateMealResult();
		if (data !== null) {
			if (checkLengthEmpty(data.extraIngredients)) {
				specialGuestPersistenceStore.shared.guest.isDarkMatter.set(
					false
				);
			} else {
				specialGuestPersistenceStore.shared.guest.isDarkMatter.set(
					foodCatalog.checkDarkMatter(data).isDarkMatter
				);
			}
		}
	});

	specialGuestPersistenceStore.shared.hiddenItems.dlcs.onChange(() => {
		specialGuestPersistenceStore.persistence.beverage.table.availabilityDlcs.set(
			[]
		);
		specialGuestPersistenceStore.persistence.guest.filters.set({
			availabilityDlcs: [],
			excludes: [],
			includes: [],
			noPlaces: [],
			places: [],
		});
		specialGuestPersistenceStore.persistence.ingredient.filters.set({
			availabilityDlcs: [],
			levels: [],
			noTags: [],
			tags: [],
		});
		specialGuestPersistenceStore.persistence.recipe.table.availabilityDlcs.set(
			[]
		);
		specialGuestPersistenceStore.persistence.recipe.table.cookerTypes.set(
			[]
		);
		specialGuestPersistenceStore.shared.guest.id.set(null);
	});
}
