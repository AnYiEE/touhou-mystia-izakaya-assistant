import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TMapLabel, TMerchantReference } from '@/domain/data/places/types';
import type { IFoodBase } from '@/domain/data/shared/foodSchema';
import type { TFoodTagId } from '@/domain/data/tags/types';

import type { TFoodId, TRecipeId } from './types';

export interface IRecipeSchema {
	baseCookTime: number;
	cookerType: TCookerTypeId;
	/** @description If the value is `-1`, it means there is no corresponding recipe. */
	id: number;
	ingredients: TIngredientId[];
}

type TFoodAreaTaskSource =
	| { areaTask: { map: TMapLabel; task: '主线任务' | '支线任务' } }
	| {
			areaTask: {
				map: TMapLabel;
				specialGuest: TSpecialGuestId;
				task: '主线任务';
			};
	  };

interface IFoodCollaborationSource {
	collaboration: {
		collaborationLabel: 'MC幻想乡' | '三妖精的蹦蹦跳跳讨伐大作战';
		merchants: [
			{ merchant: TMerchantReference; platformLabel: 'PC' },
			{ merchant: TMerchantReference; platformLabel: 'Switch' },
		];
	};
}

type TFoodFrom =
	| { self: true }
	| { bond: { level: number; specialGuest: TSpecialGuestId } }
	| { levelup: { level: number; map: TMapLabel | null } }
	| {
			buy: {
				merchant: TMerchantReference;
				price:
					| { amount: number; currencyItem: TCurrencyItemId }
					| number
					| null;
			};
	  }
	| TFoodAreaTaskSource
	| IFoodCollaborationSource
	| {
			failedCooking: {
				causeLabels: ['料理制作失败'];
				punishmentSpellCardSpecialGuests: [
					TSpecialGuestId,
					TSpecialGuestId,
				];
			};
	  };

export interface IFoodSchema extends Omit<IFoodBase, 'from'> {
	from: TFoodFrom;
	negativeTags: TFoodTagId[];
	positiveTags: TFoodTagId[];
	recipes: [IRecipeSchema, ...IRecipeSchema[]];
}

export interface IRecipe extends Omit<IRecipeSchema, 'id'> {
	id: TRecipeId;
}

export interface IFood extends Omit<IFoodSchema, 'id' | 'recipes'> {
	id: TFoodId;
	recipes: [IRecipe, ...IRecipe[]];
}
