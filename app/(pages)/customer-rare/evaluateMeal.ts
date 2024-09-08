import {isObjectLike} from 'lodash';

import type {TCustomerRating, TRecipe} from './types';
import {type TCustomerRareNames, type TCustomerSpecialNames, type TIngredientNames, type TRecipeNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';
import {type ICustomerOrder} from '@/stores';
import {intersection, without} from '@/utils';

interface IParameters {
	currentBeverageTags: TBeverageTag[];
	currentCustomerBeverageTags: TBeverageTag[];
	currentCustomerName: TCustomerRareNames | TCustomerSpecialNames;
	currentCustomerNegativeTags: TRecipeTag[];
	currentCustomerOrder: ICustomerOrder;
	currentCustomerPositiveTags: TRecipeTag[];
	currentIngredients: TIngredientNames[];
	currentRecipe: TRecipe | null;
	currentRecipeTagsWithPopular: TRecipeTag[];
	hasMystiaCooker: boolean;
}

function calculateMaxScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithPopular,
	hasMystiaCooker,
}: Pick<
	IParameters,
	'currentBeverageTags' | 'currentCustomerOrder' | 'currentRecipeTagsWithPopular' | 'hasMystiaCooker'
>) {
	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (!hasMystiaCooker && !customerOrderBeverageTag && !customerOrderRecipeTag) {
		return 0;
	}

	const beverageMaxScore = hasMystiaCooker
		? 1
		: customerOrderBeverageTag
			? Number(currentBeverageTags.includes(customerOrderBeverageTag))
			: 0;
	const recipeMaxScore = hasMystiaCooker
		? 1
		: customerOrderRecipeTag
			? Number(currentRecipeTagsWithPopular.includes(customerOrderRecipeTag))
			: 0;

	if (beverageMaxScore + recipeMaxScore === 0) {
		return 1;
	}

	return 1 + 1 + beverageMaxScore + recipeMaxScore;
}

export function checkIngredientEasterEgg({
	currentCustomerName,
	currentIngredients,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName' | 'currentIngredients'> & {
	mealScore?: number;
}): {
	ingredient: TIngredientNames | null;
	score: number;
} {
	switch (currentCustomerName) {
		case '河城荷取': {
			const ingredient = '黄瓜';
			if (currentIngredients.includes(ingredient)) {
				return {
					ingredient,
					score: Math.max(mealScore, 3),
				};
			}
			break;
		}
		case '犬走椛': {
			const ingredient = '可可豆';
			if (currentIngredients.includes(ingredient)) {
				return {
					ingredient,
					score: Math.min(mealScore, 1),
				};
			}
			break;
		}
	}

	return {
		ingredient: null,
		score: mealScore,
	};
}

export function checkRecipeEasterEgg({
	currentCustomerName,
	currentRecipeName,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName'> & {
	currentRecipeName: TRecipeNames;
	mealScore?: number;
}): {
	recipe: TRecipeNames | null;
	score: number;
} {
	switch (currentCustomerName) {
		case '古明地恋': {
			const recipe = '无意识妖怪慕斯';
			if (currentRecipeName === recipe) {
				return {
					recipe,
					score: 0,
				};
			}
			break;
		}
		case '蕾米莉亚': {
			const recipe = '猩红恶魔蛋糕';
			if (currentRecipeName === recipe) {
				return {
					recipe,
					score: 4,
				};
			}
			break;
		}
		case '饕餮尤魔': {
			const recipe = '油豆腐';
			if (currentRecipeName === recipe) {
				return {
					recipe,
					score: 3,
				};
			}
			break;
		}
		case '绵月丰姬':
		case '绵月依姬': {
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

function checkEasterEgg({
	currentCustomerName,
	currentIngredients,
	currentRecipeName,
	mealScore,
}: Pick<IParameters, 'currentCustomerName' | 'currentIngredients'> & {
	currentRecipeName: TRecipeNames;
	mealScore: number;
}) {
	switch (currentCustomerName) {
		case '河城荷取':
		case '犬走椛':
			return checkIngredientEasterEgg({
				currentCustomerName,
				currentIngredients,
				mealScore,
			}).score;
		case '古明地恋':
		case '蕾米莉亚':
		case '饕餮尤魔':
		case '绵月丰姬':
		case '绵月依姬':
			return checkRecipeEasterEgg({
				currentCustomerName,
				currentRecipeName,
				mealScore,
			}).score;
	}

	return mealScore;
}

function checkRecipeFrom({
	currentCustomerName,
	currentRecipe,
	mealScore,
}: Pick<IParameters, 'currentCustomerName' | 'currentRecipe'> & {
	mealScore: number;
}) {
	if (currentRecipe === null) {
		return mealScore;
	}

	const {from} = currentRecipe;

	if (isObjectLike(from) && 'bond' in from && from.bond.name === currentCustomerName) {
		return Math.max(mealScore, 2);
	}

	return mealScore;
}

function getRatingKey(mealScore: number): TCustomerRating | null {
	if (mealScore <= 0) {
		return '极度不满';
	}

	switch (mealScore) {
		case 1:
			return '不满';
		case 2:
			return '普通';
		case 3:
			return '满意';
		case 4:
			return '完美';
	}

	return null;
}

export function evaluateMeal({
	currentBeverageTags,
	currentCustomerName,
	currentCustomerBeverageTags,
	currentCustomerNegativeTags,
	currentCustomerOrder,
	currentCustomerPositiveTags,
	currentIngredients,
	currentRecipe,
	currentRecipeTagsWithPopular,
	hasMystiaCooker,
}: IParameters) {
	if (currentBeverageTags.length === 0 || !currentRecipe) {
		return null;
	}

	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (!hasMystiaCooker && !customerOrderBeverageTag) {
		return null;
	}
	if (!hasMystiaCooker && !customerOrderRecipeTag) {
		return null;
	}

	const matchedBeverageTags = intersection(currentBeverageTags, currentCustomerBeverageTags);
	const matchedBeverageTagsWithoutOrderedBeverage = without(
		matchedBeverageTags,
		hasMystiaCooker ? matchedBeverageTags[0] : customerOrderBeverageTag
	);
	const orderedBeverageScore =
		matchedBeverageTags.length > 0
			? Number(
					hasMystiaCooker ||
						(customerOrderBeverageTag ? matchedBeverageTags.includes(customerOrderBeverageTag) : 0)
				)
			: 0;
	const matchedBeverageScore = matchedBeverageTagsWithoutOrderedBeverage.length;
	const beverageScore = orderedBeverageScore + matchedBeverageScore;

	const matchedRecipeNegativeTags = intersection(currentRecipeTagsWithPopular, currentCustomerNegativeTags);
	const matchedRecipePositiveTags = intersection(currentRecipeTagsWithPopular, currentCustomerPositiveTags);
	const matchedRecipePositiveTagsWithoutOrderedRecipe = without(
		matchedRecipePositiveTags,
		hasMystiaCooker ? matchedRecipePositiveTags[0] : customerOrderRecipeTag
	);
	const orderedRecipeScore =
		matchedRecipePositiveTags.length > 0
			? Number(
					hasMystiaCooker ||
						(customerOrderRecipeTag ? matchedRecipePositiveTags.includes(customerOrderRecipeTag) : 0)
				)
			: 0;
	const matchedRecipeNegativeScore = matchedRecipeNegativeTags.length;
	const matchedRecipePositiveScore = matchedRecipePositiveTagsWithoutOrderedRecipe.length;
	const recipeScore = orderedRecipeScore + matchedRecipePositiveScore - matchedRecipeNegativeScore;

	let mealScore = Math.min(
		beverageScore + recipeScore,
		calculateMaxScore({
			currentBeverageTags,
			currentCustomerOrder,
			currentRecipeTagsWithPopular,
			hasMystiaCooker,
		})
	);

	const {name: currentRecipeName} = currentRecipe;
	mealScore = checkEasterEgg({currentCustomerName, currentIngredients, currentRecipeName, mealScore});
	mealScore = checkRecipeFrom({currentCustomerName, currentRecipe, mealScore});

	return getRatingKey(mealScore);
}
