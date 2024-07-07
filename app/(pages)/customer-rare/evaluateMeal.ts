/* eslint-disable @typescript-eslint/no-unused-vars */
import {intersection, without} from 'lodash';

import type {TCustomerRating} from './types';
import {type TCustomerNames, type TIngredientNames, type TRecipeNames} from '@/data';
import type {TBeverageTag, TRecipeTag} from '@/data/types';

interface IParameters {
	currentBeverageTags: TBeverageTag[];
	currentCustomerBeverageTags: TBeverageTag[];
	currentCustomerName: TCustomerNames;
	currentCustomerNegativeTags: TRecipeTag[];
	currentCustomerOrder: {
		beverageTag: TBeverageTag | null;
		recipeTag: TRecipeTag | null;
	};
	currentCustomerPositiveTags: TRecipeTag[];
	currentIngredients: TIngredientNames[];
	currentRecipeName: TRecipeNames | null;
	currentRecipeTagsWithPopular: TRecipeTag[];
	hasMystiaKitchenware: boolean;
}

function calculateMaxScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithPopular,
	hasMystiaKitchenware,
}: Pick<
	IParameters,
	'currentBeverageTags' | 'currentCustomerOrder' | 'currentRecipeTagsWithPopular' | 'hasMystiaKitchenware'
>) {
	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (!customerOrderBeverageTag && !customerOrderRecipeTag) {
		return 1;
	}

	const beverageMaxScore = customerOrderBeverageTag
		? Number(currentBeverageTags.includes(customerOrderBeverageTag))
		: 0;
	const recipeMaxScore = hasMystiaKitchenware
		? 1
		: customerOrderRecipeTag
			? Number(currentRecipeTagsWithPopular.includes(customerOrderRecipeTag))
			: 0;

	if (beverageMaxScore + recipeMaxScore === 0) {
		return 1;
	}

	return 1 + 1 + beverageMaxScore + recipeMaxScore;
}

function checkEasterEgg({
	currentCustomerName,
	currentIngredients,
	currentRecipeName,
	mealScore,
}: Pick<IParameters, 'currentCustomerName' | 'currentIngredients' | 'currentRecipeName'> & {
	mealScore: number;
}) {
	switch (currentCustomerName) {
		case '古明地恋':
			if (currentRecipeName === '无意识妖怪慕斯') {
				return 0;
			}
			break;
		case '河城荷取':
			if (currentIngredients.includes('黄瓜') && mealScore < 3) {
				return 3;
			}
			break;
		case '蕾米莉亚':
			if (currentRecipeName === '猩红恶魔蛋糕') {
				return 4;
			}
			break;
		case '犬走椛':
			if (currentIngredients.includes('可可豆')) {
				return Math.min(mealScore, 1);
			}
			break;
		case '饕餮尤魔':
			if (currentRecipeName === '油豆腐') {
				return 3;
			}
			break;
		case '绵月丰姬':
		case '绵月依姬':
		case '月人':
			if (currentRecipeName === '蜜桃红烧肉') {
				return 0;
			}
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
	currentRecipeName,
	currentRecipeTagsWithPopular,
	hasMystiaKitchenware,
}: IParameters) {
	if (currentBeverageTags.length === 0 && currentRecipeTagsWithPopular.length === 0) {
		return null;
	}

	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (!customerOrderBeverageTag) {
		return null;
	}
	if (!hasMystiaKitchenware && !customerOrderRecipeTag) {
		return null;
	}

	const matchedBeverageTags = intersection(currentBeverageTags, currentCustomerBeverageTags);
	const orderedBeverageScore = matchedBeverageTags.includes(customerOrderBeverageTag) ? 1 : 0;
	const matchedBeverageScore = without(matchedBeverageTags, customerOrderBeverageTag).length;
	const beverageScore = orderedBeverageScore + matchedBeverageScore;

	const matchedRecipePositiveTags = intersection(currentRecipeTagsWithPopular, currentCustomerPositiveTags);
	const matchedRecipeNegativeTags = intersection(currentRecipeTagsWithPopular, currentCustomerNegativeTags);
	const orderedRecipeScore = Number(
		(customerOrderRecipeTag ? matchedRecipePositiveTags.includes(customerOrderRecipeTag) : 0) ||
			hasMystiaKitchenware
	);
	const [matchedRecipePositiveScore, matchedRecipeNegativeScore] = [
		matchedRecipePositiveTags,
		matchedRecipeNegativeTags,
	]
		.map((value) => (orderedRecipeScore ? without(value, customerOrderRecipeTag) : value))
		.map(({length}) => length) as [number, number];
	const recipeScore = orderedRecipeScore + matchedRecipePositiveScore - matchedRecipeNegativeScore;

	let mealScore = Math.min(
		beverageScore + recipeScore,
		calculateMaxScore({
			currentBeverageTags,
			currentCustomerOrder,
			currentRecipeTagsWithPopular,
			hasMystiaKitchenware,
		})
	);

	mealScore = checkEasterEgg({currentCustomerName, currentIngredients, currentRecipeName, mealScore});

	return getRatingKey(mealScore);
}
