import { TaggedRecordCatalog } from '@/domain/catalog/shared/TaggedRecordCatalog';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import type {
	TIngredientId,
	TIngredients,
} from '@/domain/data/ingredients/types';
import type { TLevel } from '@/domain/data/shared/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import { extractMapsFromFoodFrom } from '@/domain/places/foodSources';
import type { IPopularTrend } from '@/domain/trends/types';

import type { TIngredient } from './types';

export class IngredientCatalog extends TaggedRecordCatalog<
	TIngredients,
	TFoodTagId,
	TIngredient
> {
	private static _instance: IngredientCatalog | undefined;

	public readonly blockedIngredients: ReadonlySet<TIngredientId> = new Set([
		-1, 5002, 5005,
	]);
	public readonly blockedLevels: ReadonlySet<TLevel> = new Set([10]);
	public readonly blockedTags: ReadonlySet<TFoodTagId> = new Set([30, 5000]);

	private constructor(data: TIngredients) {
		const dataWithMaps = data.map((item) => ({
			...item,
			maps: extractMapsFromFoodFrom(item.from),
		}));

		super(dataWithMaps as unknown as TIngredients, 'ingredient');
	}

	public static getInstance() {
		if (IngredientCatalog._instance !== undefined) {
			return IngredientCatalog._instance;
		}

		const instance = new IngredientCatalog(INGREDIENT_LIST);

		IngredientCatalog._instance = instance;

		return instance;
	}

	public getIngredientTags(ingredient: TIngredientId) {
		return this.getPropsById(ingredient, 'tags');
	}

	public calculateIngredientTagsWithTrend(
		tags: ReadonlyArray<TFoodTagId>,
		popularTrend: IPopularTrend,
		isFamousShop: boolean
	) {
		const resultTags = new Set(tags);
		if (isFamousShop && tags.includes(DYNAMIC_FOOD_TAG_MAP.signature)) {
			resultTags.add(DYNAMIC_FOOD_TAG_MAP.popularPositive);
		}
		if (popularTrend.tag !== null && tags.includes(popularTrend.tag)) {
			resultTags.add(
				popularTrend.isNegative
					? DYNAMIC_FOOD_TAG_MAP.popularNegative
					: DYNAMIC_FOOD_TAG_MAP.popularPositive
			);
		}

		return [...resultTags];
	}
}
