import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { Clothes } from '@/domain/catalog/items/Clothes';
import { Cooker } from '@/domain/catalog/items/Cooker';
import { Ornament } from '@/domain/catalog/items/Ornament';
import { Partner } from '@/domain/catalog/items/Partner';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TRecipeTag } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealRecipe } from '@/domain/meals/types';
import type { ICustomerOrder } from '@/domain/orders/types';
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
import { customerPlansStateDefinition } from '@/features/customerPlans/client/state/planStoreDefinition';
import type { ICustomerRareMeal } from '@/features/customerPlans/contracts';

import { toSet } from '@/shared/utilities/collections/convert';

export type TBeverageTableSortDescriptor =
	ITableSortDescriptor<TBeverageTableSortKey>;
export type TRecipeTableSortDescriptor =
	ITableSortDescriptor<TRecipeTableSortKey>;

export const customerRareBeverageInstance = Beverage.getInstance();
export const customerRareClothesInstance = Clothes.getInstance();
export const customerRareCookerInstance = Cooker.getInstance();
export const customerRareCustomerInstance = CustomerRare.getInstance();
export const customerRareIngredientInstance = Ingredient.getInstance();
export const customerRareOrnamentInstance = Ornament.getInstance();
export const customerRarePartnerInstance = Partner.getInstance();
export const customerRareRecipeInstance = Recipe.getInstance();

export const customerRareInitialState = {
	instances: {
		beverage: customerRareBeverageInstance,
		clothes: customerRareClothesInstance,
		cooker: customerRareCookerInstance,
		customer: customerRareCustomerInstance,
		ingredient: customerRareIngredientInstance,
		ornament: customerRareOrnamentInstance,
		partner: customerRarePartnerInstance,
		recipe: customerRareRecipeInstance,
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

			orderLinkedFilter: true,
			showTagDescription: true,
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

		meals: {} as Partial<Record<TCustomerRareName, ICustomerRareMeal[]>>,
		plans: customerPlansStateDefinition.persistence.plans,
	},
	shared: {
		beverage: {
			name: null as TBeverageName | null,

			searchValue: '',
			table: {
				columns: toSet<SelectionSet>(),
				hiddenBeverages: toSet<TBeverageName>() as Set<TBeverageName>,
				page: 1,
				row: 1,
				rows: toSet<SelectionSet>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		customer: {
			name: null as TCustomerRareName | null,

			order: { beverageTag: null, recipeTag: null } as ICustomerOrder,
			select: {
				beverageTag: toSet<SelectionSet>(),
				recipeTag: toSet<SelectionSet>(),
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: { isNegative: false, tag: null } as IPopularTrend,

			hasMystiaCooker: false,
			isDarkMatter: null as boolean | null,
			rating: null as TRatingKey | null,
		},
		drawer: customerPlansStateDefinition.shared.drawer,
		hiddenItems: { dlcs: toSet<TDlc>() },
		ingredient: { filterVisibility: false },
		recipe: {
			data: null as IMealRecipe | null,

			tagsWithTrend: [] as TRecipeTag[],

			searchValue: '',
			table: {
				columns: toSet<SelectionSet>(),
				hiddenIngredients:
					toSet<TIngredientName>() as Set<TIngredientName>,
				hiddenRecipes: toSet<TRecipeName>() as Set<TRecipeName>,
				page: 1,
				row: 1,
				rows: toSet<SelectionSet>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		tab: 'customer' as TTab,
	},
};

export const customerRareNames = createNamesCache(customerRareCustomerInstance);
