import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { ICustomerRareMeal } from '@/features/customerPlans/contracts';

import { customerRareStore } from './store';

export interface ICustomerPlanCatalogSnapshot {
	hiddenBeverages: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	isFamousShop: boolean;
	meals: Partial<Record<TCustomerRareName, ICustomerRareMeal[]>>;
	popularTrend: IPopularTrend;
}

export const customerPlanCatalogPort = {
	availableCustomerNames: customerRareStore.availableCustomerNames,
	availableCustomerPlaces: customerRareStore.availableCustomerPlaces,
	hiddenBeverages: customerRareStore.shared.beverage.table.hiddenBeverages,
	hiddenDlcs: customerRareStore.shared.hiddenItems.dlcs,
	hiddenIngredients: customerRareStore.shared.recipe.table.hiddenIngredients,
	hiddenRecipes: customerRareStore.shared.recipe.table.hiddenRecipes,
	isFamousShop: customerRareStore.shared.customer.famousShop,
	meals: customerRareStore.persistence.meals,
	openCustomer(customerName: TCustomerRareName) {
		customerRareStore.shared.customer.name.set(customerName);
		customerRareStore.shared.tab.set('customer');
		customerRareStore.shared.customer.filterVisibility.set(true);
	},
	popularTrend: customerRareStore.shared.customer.popularTrend,
	recipe: customerRareStore.instances.recipe,
};
