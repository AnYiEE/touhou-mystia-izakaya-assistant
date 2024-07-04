/* eslint-disable @typescript-eslint/no-unused-vars */
import {intersection, without} from 'lodash';

import type {TCustomerRating} from './types';
import type {TBeverageTag, TRecipeTag} from '@/data/types';

interface IParameters {
	currentBeverageTags: TBeverageTag[];
	currentCustomerBeverageTags: TBeverageTag[];
	currentCustomerNegativeTags: TRecipeTag[];
	currentCustomerOrder: {
		beverageTag: TBeverageTag | null;
		recipeTag: TRecipeTag | null;
	};
	currentCustomerPositiveTags: TRecipeTag[];
	currentRecipeTagsWithPopular: TRecipeTag[];
	hasMystiaKitchenwware: boolean;
}

function calcMaxScore(
	currentCustomerOrder: IParameters['currentCustomerOrder'],
	currentBeverageTags: IParameters['currentBeverageTags'],
	currentRecipeTagsWithPopular: IParameters['currentRecipeTagsWithPopular'],
	hasMystiaKitchenwware: IParameters['hasMystiaKitchenwware']
) {
	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (!customerOrderBeverageTag && !customerOrderRecipeTag) {
		return 1;
	}

	const beverageMaxScore = customerOrderBeverageTag
		? Number(currentBeverageTags.includes(customerOrderBeverageTag))
		: 0;
	const recipeMaxScore = hasMystiaKitchenwware
		? 1
		: customerOrderRecipeTag
			? Number(currentRecipeTagsWithPopular.includes(customerOrderRecipeTag))
			: 0;

	return 1 + 1 + beverageMaxScore + recipeMaxScore;
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
	currentCustomerBeverageTags,
	currentCustomerNegativeTags,
	currentCustomerOrder,
	currentCustomerPositiveTags,
	currentRecipeTagsWithPopular,
	hasMystiaKitchenwware,
}: IParameters) {
	if (currentBeverageTags.length === 0 && currentRecipeTagsWithPopular.length === 0) {
		return null;
	}

	const customerOrderBeverageTag = currentCustomerOrder.beverageTag ?? ('' as TBeverageTag);
	const customerOrderRecipeTag = currentCustomerOrder.recipeTag ?? ('' as TRecipeTag);

	const matchedBeverageTags = intersection(currentBeverageTags, currentCustomerBeverageTags);
	const orderedBeverageScore = matchedBeverageTags.includes(customerOrderBeverageTag) ? 1 : 0;
	const matchedBeverageScore = without(matchedBeverageTags, customerOrderBeverageTag).length;
	const beverageScore = orderedBeverageScore + matchedBeverageScore;

	const matchedRecipePositiveTags = intersection(currentRecipeTagsWithPopular, currentCustomerPositiveTags);
	const matchedRecipeNegativeTags = intersection(currentRecipeTagsWithPopular, currentCustomerNegativeTags);
	const orderedRecipeScore = Number(
		matchedRecipePositiveTags.includes(customerOrderRecipeTag) || hasMystiaKitchenwware
	);
	const [matchedRecipePositiveScore, matchedRecipeNegativeScore] = [
		matchedRecipePositiveTags,
		matchedRecipeNegativeTags,
	]
		.map((value) => (orderedRecipeScore ? without(value, customerOrderRecipeTag) : value))
		.map(({length}) => length) as [number, number];
	const recipeScore = orderedRecipeScore + matchedRecipePositiveScore - matchedRecipeNegativeScore;

	const mealScore = Math.min(
		beverageScore + recipeScore,
		calcMaxScore(currentCustomerOrder, currentBeverageTags, currentRecipeTagsWithPopular, hasMystiaKitchenwware)
	);

	return getRatingKey(mealScore);
}
