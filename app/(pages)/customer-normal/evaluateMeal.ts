import {intersection} from 'lodash';

import type {TCustomerRating, TRecipe} from './types';
import {type TBeverageNames} from '@/data';
import type {TRecipeTag} from '@/data/types';
import {type IPopularData, type TPopularTag} from '@/stores';

interface IParameters {
	currentBeverageName: TBeverageNames | null;
	currentCustomerPopularData: IPopularData;
	currentCustomerPositiveTags: TRecipeTag[];
	currentExtraIngredientsLength: number;
	currentExtraTags: TPopularTag[];
	currentRecipe: TRecipe | null;
}

function getRatingKey(mealScore: number): TCustomerRating | null {
	if (mealScore <= 1) {
		return null;
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
		extraScore += Number(currentExtraTags.includes(currentCustomerPopularTag));
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

	return getRatingKey(2 + extraScore);
}
