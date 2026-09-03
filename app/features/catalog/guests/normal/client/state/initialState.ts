import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { TRatingKey } from '@/domain/evaluation/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { TTab } from '@/features/catalog/guests/shared/contracts';

import { normalGuestPersistenceShape } from '@/features/catalog/guests/shared/state/guestPersistenceShape';

export const normalGuestBeverageCatalog = BeverageCatalog.getInstance();
const normalGuestClothesCatalog = ClothesCatalog.getInstance();
export const normalGuestFoodCatalog = FoodCatalog.getInstance();
export const normalGuestCatalog = NormalGuestCatalog.getInstance();
export const normalGuestIngredientCatalog = IngredientCatalog.getInstance();

export const normalGuestInitialState = {
	instances: {
		beverage: normalGuestBeverageCatalog,
		clothes: normalGuestClothesCatalog,
		guest: normalGuestCatalog,
		ingredient: normalGuestIngredientCatalog,
		recipe: normalGuestFoodCatalog,
	},

	persistence: normalGuestPersistenceShape.createDefault(),
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
		guest: {
			id: null as TNormalGuestId | null,

			select: {
				beverageTag: new Set<string | number>(),
				foodTag: new Set<string | number>(),
			},

			filterVisibility: true,

			famousShop: false,
			popularTrend: { isNegative: false, tag: null } as IPopularTrend,

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
