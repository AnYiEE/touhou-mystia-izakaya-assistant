import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import { DYNAMIC_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TRecipeTag } from '@/domain/data/tags/types';
import type { IPopularTrend, TPopularTag } from '@/domain/trends/types';

import type { TRatingKey } from './types';

interface INormalCustomerRecipe {
	readonly ingredients: ReadonlyArray<TIngredientName>;
	readonly name: TRecipeName;
	readonly positiveTags: ReadonlyArray<TRecipeTag>;
}

interface IParameters {
	currentCustomerName: TCustomerNormalName;
	currentCustomerPopularTrend: IPopularTrend;
	currentCustomerPositiveTags: TRecipeTag[];
	currentExtraIngredientsLength: number;
	currentExtraTags: TPopularTag[];
	currentRecipe: INormalCustomerRecipe | null;
	isFamousShop: boolean;
}

export function checkEasterEgg({
	currentCustomerName,
	currentRecipe,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName'> & {
	currentRecipe: INormalCustomerRecipe;
	mealScore?: number;
}): { recipe: TRecipeName | null; score: number } {
	const { name: currentRecipeName } = currentRecipe;

	switch (currentCustomerName) {
		case '月人': {
			const recipe = '蜜桃红烧肉';
			if (currentRecipeName === recipe) {
				return { recipe, score: 0 };
			}
		}
	}

	return { recipe: null, score: mealScore };
}

function getRatingKey(mealScore: number): TRatingKey {
	if (mealScore <= 0) {
		return 'exbad';
	} else if (mealScore <= 2) {
		return 'norm';
	}

	return 'good';
}

export function evaluateNormalCustomerMeal({
	currentCustomerName,
	currentCustomerPopularTrend,
	currentCustomerPositiveTags,
	currentExtraIngredientsLength,
	currentExtraTags,
	currentRecipe,
	isFamousShop,
}: IParameters) {
	if (currentRecipe === null) {
		return null;
	}

	let extraScore = 0;

	if (
		isFamousShop &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularPositive) &&
		(currentRecipe.positiveTags.includes(DYNAMIC_TAG_MAP.signature) ||
			currentExtraTags.includes(DYNAMIC_TAG_MAP.signature))
	) {
		extraScore += 1;
	}

	let currentCustomerPopularTag: IPopularTrend['tag'] = null;
	const { isNegative: popularTrendIsNegative, tag: popularTag } =
		currentCustomerPopularTrend;
	if (
		popularTrendIsNegative &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularNegative)
	) {
		currentCustomerPopularTag = popularTag;
	} else if (
		!popularTrendIsNegative &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularPositive)
	) {
		currentCustomerPopularTag = popularTag;
	}

	if (currentCustomerPopularTag !== null) {
		extraScore +=
			Number(
				currentRecipe.positiveTags.includes(currentCustomerPopularTag)
			) + Number(currentExtraTags.includes(currentCustomerPopularTag));
	}

	const { length: originalIngredientsLength } = currentRecipe.ingredients;
	const totalIngredientsLength =
		originalIngredientsLength + currentExtraIngredientsLength;

	if (
		(currentCustomerPopularTag === DYNAMIC_TAG_MAP.largePartition ||
			currentCustomerPositiveTags.includes(
				DYNAMIC_TAG_MAP.largePartition
			)) &&
		originalIngredientsLength !== 5 &&
		totalIngredientsLength === 5
	) {
		extraScore += 1;
	}

	for (const tag of currentExtraTags) {
		if (currentCustomerPositiveTags.includes(tag)) {
			extraScore++;
		}
	}

	let mealScore = 2 + extraScore;

	mealScore = checkEasterEgg({
		currentCustomerName,
		currentRecipe,
		mealScore,
	}).score;

	return getRatingKey(mealScore);
}
