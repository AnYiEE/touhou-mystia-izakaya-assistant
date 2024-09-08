import {intersection} from 'lodash';

import type {TCustomerRating, TRecipe} from './types';
import {type TBeverageNames, type TCustomerNormalNames, type TRecipeNames} from '@/data';
import type {TRecipeTag} from '@/data/types';
import {type IPopularData, type TPopularTag} from '@/stores';

interface IParameters {
	currentBeverageName: TBeverageNames | null;
	currentCustomerName: TCustomerNormalNames;
	currentCustomerPopularData: IPopularData;
	currentCustomerPositiveTags: TRecipeTag[];
	currentExtraIngredientsLength: number;
	currentExtraTags: TPopularTag[];
	currentRecipe: TRecipe | null;
}

export function checkEasterEgg({
	currentCustomerName,
	currentRecipe,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName'> & {
	currentRecipe: TRecipe;
	mealScore?: number;
}): {
	recipe: TRecipeNames | null;
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

function getRatingKey(mealScore: number): TCustomerRating | null {
	if (mealScore <= 0) {
		return '极度不满';
	}

	switch (mealScore) {
		case 2:
			return '普通';
		default:
			return '满意';
	}
}

export function evaluateMeal({
	currentBeverageName,
	currentCustomerName,
	currentCustomerPopularData,
	currentCustomerPositiveTags,
	currentExtraIngredientsLength,
	currentExtraTags,
	currentRecipe,
}: IParameters) {
	if (!currentBeverageName || !currentRecipe) {
		return null;
	}

	let extraScore = 0;

	let currentCustomerPopularTag: IPopularData['tag'] = null;
	const {isNegative: popularIsNegative, tag: popularTag} = currentCustomerPopularData;
	if (popularIsNegative && currentCustomerPositiveTags.includes('流行厌恶')) {
		currentCustomerPopularTag = popularTag;
	} else if (!popularIsNegative && currentCustomerPositiveTags.includes('流行喜爱')) {
		currentCustomerPopularTag = popularTag;
	}

	if (currentCustomerPopularTag) {
		extraScore +=
			Number((currentRecipe.positiveTags as string[]).includes(currentCustomerPopularTag)) +
			Number(currentExtraTags.includes(currentCustomerPopularTag));
	}

	const originalIngredientsLength = currentRecipe.ingredients.length;
	const totalIngredientsLength = originalIngredientsLength + currentExtraIngredientsLength;

	if (
		(currentCustomerPopularTag === '大份' || currentCustomerPositiveTags.includes('大份')) &&
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
