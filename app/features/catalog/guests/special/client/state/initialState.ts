import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { PartnerCatalog } from '@/domain/catalog/items/PartnerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood, ISpecialGuestSavedMeal } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { TTab } from '@/features/catalog/guests/shared/contracts';
import {
	type ITableSortDescriptor,
	type TBeverageTableSortKey,
	type TFoodTableSortKey,
} from '@/features/catalog/guests/shared/state/tableDescriptors';
import {
	type TTabVisibilityState,
	tabVisibilityStateMap,
} from '@/features/catalog/guests/shared/state/tabVisibility';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import {
	PINYIN_SORT_STATE_MAP,
	type TPinyinSortState,
} from '@/features/catalog/shared/state/pinyinSort';
import { specialGuestPlansStateDefinition } from '@/features/specialGuestPlans/client/state/planStoreDefinition';

export type TBeverageTableSortDescriptor =
	ITableSortDescriptor<TBeverageTableSortKey>;
export type TFoodTableSortDescriptor = ITableSortDescriptor<TFoodTableSortKey>;

export const specialGuestBeverageCatalog = BeverageCatalog.getInstance();
export const specialGuestClothesCatalog = ClothesCatalog.getInstance();
export const specialGuestCookerCatalog = CookerCatalog.getInstance();
export const specialGuestDecorationCatalog = DecorationCatalog.getInstance();
export const specialGuestFoodCatalog = FoodCatalog.getInstance();
export const specialGuestIngredientCatalog = IngredientCatalog.getInstance();
export const specialGuestPartnerCatalog = PartnerCatalog.getInstance();
export const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export const specialGuestInitialState = {
	instances: {
		beverage: specialGuestBeverageCatalog,
		clothes: specialGuestClothesCatalog,
		cooker: specialGuestCookerCatalog,
		guest: specialGuestCatalog,
		ingredient: specialGuestIngredientCatalog,
		partner: specialGuestPartnerCatalog,
		recipe: specialGuestFoodCatalog,
	},

	persistence: {
		beverage: {
			table: {
				availabilityDlcs: [] as string[],
				sortDescriptor: {} as TBeverageTableSortDescriptor,
			},
		},
		guest: {
			filters: {
				availabilityDlcs: [] as string[],
				excludes: [] as TSpecialGuestId[],
				includes: [] as TSpecialGuestId[],
				noPlaces: [] as TMapLabel[],
				places: [] as TMapLabel[],
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
				levels: [] as string[],
				noTags: [] as TFoodTagId[],
				tags: [] as TFoodTagId[],
			},
			pinyinSortState: PINYIN_SORT_STATE_MAP.none as TPinyinSortState,
			tabVisibility:
				tabVisibilityStateMap.collapse as TTabVisibilityState,
		},
		recipe: {
			table: {
				availabilityDlcs: [] as string[],
				cookerTypes: [] as TCookerTypeId[],
				sortDescriptor: {} as TFoodTableSortDescriptor,
			},
		},

		meals: {} as Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>,
		plans: specialGuestPlansStateDefinition.persistence.plans,
	},
	shared: {
		beverage: {
			id: null as TBeverageId | null,

			searchValue: '',
			table: {
				columns: new Set<string>(),
				hiddenBeverages: new Set<TBeverageId>(),
				page: 1,
				row: 1,
				rows: new Set<string>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		drawer: specialGuestPlansStateDefinition.shared.drawer,
		guest: {
			id: null as TSpecialGuestId | null,

			order: { beverageTag: null, foodTag: null } as IGuestOrder,
			select: {
				beverageTag: new Set<string | number>(),
				foodTag: new Set<string | number>(),
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: { isNegative: false, tag: null } as IPopularTrend,

			hasMystiaCooker: false,
			isDarkMatter: null as boolean | null,
			rating: null as TRatingKey | null,
		},
		hiddenItems: { dlcs: new Set<TDlc>() },
		ingredient: { filterVisibility: false },
		recipe: {
			data: null as IMealFood | null,

			tagsWithTrend: [] as TFoodTagId[],

			searchValue: '',
			table: {
				columns: new Set<string>(),
				hiddenFoods: new Set<TFoodId>(),
				hiddenIngredients: new Set<TIngredientId>(),
				page: 1,
				row: 1,
				rows: new Set<string>(),
				selectableRows: [] as Array<ValueCollection<number>>,
			},
		},
		tab: 'guest' as TTab,
	},
};

export const specialGuestNames = createNamesCache(specialGuestCatalog);
