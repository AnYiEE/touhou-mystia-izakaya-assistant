import type {TRecipe} from './types';
import {
	TAG_LARGE_PARTITION,
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
	TAG_SIGNATURE,
	type TCustomerNormalName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import {type IPopularTrend, type TPopularTag} from '@/types';
import {intersection} from '@/utilities';

interface IParameters {
	currentCustomerName: TCustomerNormalName;
	currentCustomerPopularTrend: IPopularTrend;
	currentCustomerPositiveTags: TRecipeTag[];
	currentExtraIngredientsLength: number;
	currentExtraTags: TPopularTag[];
	currentRecipe: TRecipe | null;
	isFamousShop: boolean;
}

export function checkEasterEgg({
	currentCustomerName,
	currentRecipe,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName'> & {
	currentRecipe: TRecipe;
	mealScore?: number;
}): {
	recipe: TRecipeName | null;
	score: number;
} {
	const {name: currentRecipeName} = currentRecipe;

	switch (currentCustomerName) {
		case '月人': {
			const recipe = '蜜桃红烧肉';
			if (currentRecipeName === recipe) {
				return {
					recipe,
					score: 0,
				};
			}
		}
	}

	return {
		recipe: null,
		score: mealScore,
	};
}

function getRatingKey(mealScore: number): TRatingKey {
	if (mealScore <= 0) {
		return 'exbad';
	} else if (mealScore <= 2) {
		return 'norm';
	}

	return 'good';
}

export function evaluateMeal({
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
		currentCustomerPositiveTags.includes(TAG_POPULAR_POSITIVE) &&
		((currentRecipe.positiveTags as TRecipeTag[]).includes(TAG_SIGNATURE) ||
			currentExtraTags.includes(TAG_SIGNATURE))
	) {
		extraScore += 1;
	}

	let currentCustomerPopularTag: IPopularTrend['tag'] = null;
	const {isNegative: popularTrendIsNegative, tag: popularTag} = currentCustomerPopularTrend;
	if (popularTrendIsNegative && currentCustomerPositiveTags.includes(TAG_POPULAR_NEGATIVE)) {
		currentCustomerPopularTag = popularTag;
	} else if (!popularTrendIsNegative && currentCustomerPositiveTags.includes(TAG_POPULAR_POSITIVE)) {
		currentCustomerPopularTag = popularTag;
	}

	if (currentCustomerPopularTag !== null) {
		extraScore +=
			Number((currentRecipe.positiveTags as TRecipeTag[]).includes(currentCustomerPopularTag)) +
			Number(currentExtraTags.includes(currentCustomerPopularTag));
	}

	const {length: originalIngredientsLength} = currentRecipe.ingredients;
	const totalIngredientsLength = originalIngredientsLength + currentExtraIngredientsLength;

	if (
		(currentCustomerPopularTag === TAG_LARGE_PARTITION ||
			currentCustomerPositiveTags.includes(TAG_LARGE_PARTITION)) &&
		originalIngredientsLength !== 5 &&
		totalIngredientsLength === 5
	) {
		extraScore += 1;
	}

	extraScore += intersection(currentExtraTags, currentCustomerPositiveTags).length;

	let mealScore = 2 + extraScore;

	mealScore = checkEasterEgg({currentCustomerName, currentRecipe, mealScore}).score;

	return getRatingKey(mealScore);
}
