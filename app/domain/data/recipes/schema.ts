import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCurrencyName } from '@/domain/data/currencies/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TMerchant, TPlace } from '@/domain/data/places/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TRecipeTagSchema } from '@/domain/data/tags/schema';

export interface IRecipe extends Omit<IFoodBase, 'from'> {
	/** @description If the value is `-1`, it means there is no corresponding recipe. */
	recipeId: number;
	ingredients: TIngredientName[];
	positiveTags: TRecipeTagSchema[];
	negativeTags: TRecipeTagSchema[];
	cooker: TCookerName;
	baseCookTime: number;
	from:
		| string
		| Partial<{
				bond: { name: TCustomerRareName; level: number };
				buy: {
					name: TMerchant;
					price:
						| { currency: TCurrencyName; amount: number }
						| number
						| null;
				};
				/** @description Recipes by levelup. */
				levelup: [number, TPlace | null];
				/** @description Initial recipes. */
				self: true;
		  }>;
}
