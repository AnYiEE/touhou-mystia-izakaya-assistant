import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { ISpecialGuestSavedMeal } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { specialGuestStore } from './store';

export interface ISpecialGuestPlanCatalogSnapshot {
	hiddenBeverages: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenFoods: ReadonlySet<TFoodId>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	isFamousShop: boolean;
	meals: Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>;
	popularTrend: IPopularTrend;
}

export const specialGuestPlanCatalogPort = {
	availableGuestMaps: specialGuestStore.availableGuestMaps,
	availableGuestNames: specialGuestStore.availableGuestNames,
	availableSpecialGuests: specialGuestStore.availableSpecialGuests,
	foodCatalog: specialGuestStore.instances.recipe,
	hiddenBeverages: specialGuestStore.shared.beverage.table.hiddenBeverages,
	hiddenDlcs: specialGuestStore.shared.hiddenItems.dlcs,
	hiddenFoods: specialGuestStore.shared.recipe.table.hiddenFoods,
	hiddenIngredients: specialGuestStore.shared.recipe.table.hiddenIngredients,
	isFamousShop: specialGuestStore.shared.guest.famousShop,
	meals: specialGuestStore.persistence.meals,
	openGuest(specialGuest: TSpecialGuestId) {
		specialGuestStore.shared.guest.id.set(specialGuest);
		specialGuestStore.shared.tab.set('guest');
		specialGuestStore.shared.guest.filterVisibility.set(true);
	},
	popularTrend: specialGuestStore.shared.guest.popularTrend,
};
