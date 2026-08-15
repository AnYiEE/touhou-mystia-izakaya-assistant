import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DYNAMIC_FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TFoodTagId } from '@/domain/data/tags/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type {
	IIngredientScoreCandidate,
	IIngredientScoreChangesResult,
	TIngredientScoreRestriction,
} from './types';

const foodCatalog = FoodCatalog.getInstance();

function getIngredientRestriction(
	scoreChange: number,
	isDarkIngredient: boolean,
	isDarkMatter: boolean
): TIngredientScoreRestriction {
	if (isDarkMatter) {
		return 'darkMatterOverride';
	}

	if (isDarkIngredient) {
		return 'darkIngredient';
	}

	if (scoreChange === Infinity) {
		return 'lowestRestricted';
	}

	if (scoreChange === -Infinity) {
		return 'highestRestricted';
	}

	return 'none';
}

function getLargePartitionScoreChange({
	before,
	currentPopularTrend,
	isLargePartitionTagNext,
	shouldCalculateLargePartitionTag,
	specialGuestNegativeTags,
	specialGuestPositiveTags,
}: {
	before: ReadonlyArray<TFoodTagId>;
	currentPopularTrend: IPopularTrend;
	isLargePartitionTagNext: boolean;
	shouldCalculateLargePartitionTag: boolean;
	specialGuestNegativeTags: ReadonlyArray<TFoodTagId>;
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>;
}) {
	let scoreChange = 0;

	if (
		isLargePartitionTagNext &&
		!before.includes(DYNAMIC_FOOD_TAG_MAP.largePartition)
	) {
		scoreChange -= Number(
			specialGuestNegativeTags.includes(
				DYNAMIC_FOOD_TAG_MAP.largePartition
			)
		);
		scoreChange += Number(
			specialGuestPositiveTags.includes(
				DYNAMIC_FOOD_TAG_MAP.largePartition
			)
		);
	}

	if (!shouldCalculateLargePartitionTag) {
		return scoreChange;
	}

	scoreChange -= Number(
		specialGuestNegativeTags.includes(
			DYNAMIC_FOOD_TAG_MAP.popularNegative
		) && currentPopularTrend.isNegative
	);
	scoreChange -= Number(
		specialGuestNegativeTags.includes(
			DYNAMIC_FOOD_TAG_MAP.popularPositive
		) && !currentPopularTrend.isNegative
	);
	scoreChange += Number(
		specialGuestPositiveTags.includes(
			DYNAMIC_FOOD_TAG_MAP.popularNegative
		) && currentPopularTrend.isNegative
	);
	scoreChange += Number(
		specialGuestPositiveTags.includes(
			DYNAMIC_FOOD_TAG_MAP.popularPositive
		) && !currentPopularTrend.isNegative
	);

	return scoreChange;
}

export function getIngredientScoreChanges({
	calculateFoodTagsWithTrend,
	calculateIngredientTagsWithTrend,
	candidates,
	composeFoodTagsWithPopularTrend,
	currentGuestOrderFoodTag = null,
	currentMealFood,
	currentPopularTrend,
	getIngredientEasterEggScore,
	getIngredientScoreChange,
	getIngredientTags,
	isDarkMatter = false,
	specialGuestNegativeTags = [],
	specialGuestPositiveTags,
}: {
	calculateFoodTagsWithTrend: (
		tags: ReadonlyArray<TFoodTagId>
	) => TFoodTagId[];
	calculateIngredientTagsWithTrend: (
		tags: ReadonlyArray<TFoodTagId>
	) => TFoodTagId[];
	candidates: ReadonlyArray<IIngredientScoreCandidate>;
	composeFoodTagsWithPopularTrend: (
		tags: ReadonlyArray<TFoodTagId>
	) => TFoodTagId[];
	currentGuestOrderFoodTag?: TFoodTagId | null;
	currentMealFood: IMealFood;
	currentPopularTrend: IPopularTrend;
	getIngredientEasterEggScore?: (args: {
		currentFood: TFoodId;
		currentIngredients: ReadonlyArray<TIngredientId>;
		ingredient: TIngredientId;
	}) => number | null | undefined;
	getIngredientScoreChange: (
		oldFoodPositiveTags: ReadonlyArray<TFoodTagId>,
		newFoodPositiveTags: ReadonlyArray<TFoodTagId>,
		specialGuestPositiveTags: ReadonlyArray<TFoodTagId>,
		specialGuestNegativeTags?: ReadonlyArray<TFoodTagId>
	) => number;
	getIngredientTags: (ingredient: TIngredientId) => ReadonlyArray<TFoodTagId>;
	isDarkMatter?: boolean;
	specialGuestNegativeTags?: ReadonlyArray<TFoodTagId>;
	specialGuestPositiveTags: ReadonlyArray<TFoodTagId>;
}): IIngredientScoreChangesResult {
	const { food: currentFood, recipe: currentRecipe } =
		foodCatalog.getRecipeOwnerById(currentMealFood.recipeId);
	const currentFoodExtraIngredients = currentMealFood.extraIngredients;
	const currentFoodIngredients = currentRecipe.ingredients;
	const currentFoodNegativeTags = currentFood.negativeTags;
	const currentFoodAllIngredients = [
		...new Set([...currentFoodIngredients, ...currentFoodExtraIngredients]),
	];
	const currentFoodExtraIngredientTags = currentFoodExtraIngredients.flatMap(
		(extraIngredient) => getIngredientTags(extraIngredient)
	);
	const currentFoodExtraIngredientTagsWithTrend =
		calculateIngredientTagsWithTrend(currentFoodExtraIngredientTags);
	const currentFoodComposedTags = composeFoodTagsWithPopularTrend(
		currentFoodExtraIngredientTagsWithTrend
	);
	const currentFoodTagsWithTrend = [
		...new Set(calculateFoodTagsWithTrend(currentFoodComposedTags)),
	];
	const before = composeFoodTagsWithPopularTrend(currentFoodTagsWithTrend);

	const currentIngredientCount =
		currentFoodIngredients.length + currentFoodExtraIngredients.length;
	const isLargePartitionTagNext = currentIngredientCount === 4;
	const shouldCalculateLargePartitionTag =
		isLargePartitionTagNext &&
		currentPopularTrend.tag === DYNAMIC_FOOD_TAG_MAP.largePartition;

	const negativeTagSet = new Set<TFoodTagId>(currentFoodNegativeTags);
	const darkIngredients: TIngredientId[] = [];
	for (const { id, tags } of candidates) {
		if (tags.some((tag) => negativeTagSet.has(tag))) {
			darkIngredients.push(id);
		}
	}
	const darkIngredientSet = new Set(darkIngredients);

	const changesById: IIngredientScoreChangesResult['changesById'] = {};

	candidates.forEach(({ id, tags }) => {
		const tagsWithTrend = calculateIngredientTagsWithTrend(tags);
		const allTagsWithTrend = [
			...new Set([...currentFoodTagsWithTrend, ...tagsWithTrend]),
		];
		const after = composeFoodTagsWithPopularTrend(allTagsWithTrend);

		let scoreChange = getIngredientScoreChange(
			before,
			after,
			specialGuestPositiveTags,
			specialGuestNegativeTags
		);
		scoreChange += getLargePartitionScoreChange({
			before,
			currentPopularTrend,
			isLargePartitionTagNext,
			shouldCalculateLargePartitionTag,
			specialGuestNegativeTags,
			specialGuestPositiveTags,
		});

		const isDarkIngredient = darkIngredientSet.has(id);
		const easterEggScore = getIngredientEasterEggScore?.({
			currentFood: isDarkIngredient || isDarkMatter ? -1 : currentFood.id,
			currentIngredients: [
				...new Set([...currentFoodAllIngredients, id]),
			],
			ingredient: id,
		});

		if (easterEggScore !== null && easterEggScore !== undefined) {
			scoreChange = easterEggScore === 0 ? -Infinity : Infinity;
		}

		if (isDarkIngredient) {
			scoreChange = -Infinity;
		}

		if (isDarkMatter) {
			scoreChange = 0;
		}

		const isOrderTag =
			currentGuestOrderFoodTag !== null &&
			tagsWithTrend.includes(currentGuestOrderFoodTag) &&
			after.includes(currentGuestOrderFoodTag) &&
			!before.includes(currentGuestOrderFoodTag);

		changesById[id] = {
			isDarkIngredient,
			isOrderTag,
			restriction: getIngredientRestriction(
				scoreChange,
				isDarkIngredient,
				isDarkMatter
			),
			scoreChange,
		};
	});

	return { changesById, darkIngredients };
}
