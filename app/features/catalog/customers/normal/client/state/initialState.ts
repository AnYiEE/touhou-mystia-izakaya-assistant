import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { Clothes } from '@/domain/catalog/items/Clothes';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TRecipeTag } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealRecipe } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { TTab } from '@/features/catalog/customers/shared/contracts';
import {
	type TTabVisibilityState,
	tabVisibilityStateMap,
} from '@/features/catalog/customers/shared/state/tabVisibility';
import {
	type ITableSortDescriptor,
	type TBeverageTableSortKey,
	type TRecipeTableSortKey,
} from '@/features/catalog/customers/shared/state/tableDescriptors';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';

export type TBeverageTableSortDescriptor =
	ITableSortDescriptor<TBeverageTableSortKey>;
export type TRecipeTableSortDescriptor =
	ITableSortDescriptor<TRecipeTableSortKey>;

export const customerNormalBeverageInstance = Beverage.getInstance();
const customerNormalClothesInstance = Clothes.getInstance();
export const customerNormalCustomerInstance = CustomerNormal.getInstance();
export const customerNormalIngredientInstance = Ingredient.getInstance();
export const customerNormalRecipeInstance = Recipe.getInstance();

export const customerNormalInitialState = {
	instances: {
		beverage: customerNormalBeverageInstance,
		clothes: customerNormalClothesInstance,
		customer: customerNormalCustomerInstance,
		ingredient: customerNormalIngredientInstance,
		recipe: customerNormalRecipeInstance,
	},

	persistence: {
		beverage: {
			table: {
				availabilityDlcs: [] as string[],
				sortDescriptor: {} as TBeverageTableSortDescriptor,
			},
		},
		customer: {
			filters: {
				availabilityDlcs: [] as string[],
				places: [] as string[], // eslint-disable-next-line sort-keys
				noPlaces: [] as string[], // eslint-disable-next-line sort-keys
				includes: [] as string[], // eslint-disable-next-line sort-keys
				excludes: [] as string[],
			},
			pinyinSortState: PINYIN_SORT_STATE_MAP.none as TPinyinSortState,
			tabVisibility:
				tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		ingredient: {
			filters: {
				availabilityDlcs: [] as string[],
				tags: [] as string[], // eslint-disable-next-line sort-keys
				noTags: [] as string[], // eslint-disable-next-line sort-keys
				levels: [] as string[],
			},
			pinyinSortState: PINYIN_SORT_STATE_MAP.none as TPinyinSortState,
			tabVisibility:
				tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		recipe: {
			table: {
				availabilityDlcs: [] as string[],
				cookers: [] as string[],
				sortDescriptor: {} as TRecipeTableSortDescriptor,
			},
		},

		meals: {} as Partial<
			Record<
				TCustomerNormalName,
				Array<{ beverage: TBeverageName | null; recipe: IMealRecipe }>
			>
		>,
	},
	shared: {
		beverage: {
			name: null as TBeverageName | null,

			searchValue: '',
			table: {
				columns: new Set<string | number>(),
				hiddenBeverages: new Set<TBeverageName>(),
				page: 1,
				row: 1,
				rows: new Set<string | number>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		customer: {
			name: null as TCustomerNormalName | null,

			select: {
				beverageTag: new Set<string | number>(),
				recipeTag: new Set<string | number>(),
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: { isNegative: false, tag: null } as IPopularTrend,

			rating: null as TRatingKey | null,
		},
		hiddenItems: { dlcs: new Set<TDlc>() },
		ingredient: { filterVisibility: false },
		recipe: {
			data: null as IMealRecipe | null,

			tagsWithTrend: [] as TRecipeTag[],

			searchValue: '',
			table: {
				columns: new Set<string | number>(),
				hiddenIngredients: new Set<TIngredientName>(),
				hiddenRecipes: new Set<TRecipeName>(),
				page: 1,
				row: 1,
				rows: new Set<string | number>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		tab: 'customer' as TTab,
	},
};

export const getCustomerNormalNames = createNamesCache(
	customerNormalCustomerInstance
);
