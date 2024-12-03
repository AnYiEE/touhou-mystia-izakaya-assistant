import type {TCustomerRating} from './types';
import {
	DARK_MATTER_NAME,
	DARK_MATTER_TAG,
	type TBeverageTag,
	type TCustomerRareName,
	type TIngredientName,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import {type ICustomerOrder} from '@/stores';
import {intersection, without} from '@/utils';

interface IParameters {
	currentBeverageTags: TBeverageTag[];
	currentCustomerBeverageTags: TBeverageTag[];
	currentCustomerName: TCustomerRareName;
	currentCustomerNegativeTags: TRecipeTag[];
	currentCustomerOrder: ICustomerOrder;
	currentCustomerPositiveTags: TRecipeTag[];
	currentIngredients: TIngredientName[];
	currentRecipeName: TRecipeName | null;
	currentRecipeTagsWithPopular: TRecipeTag[];
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
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

	if (customerOrderBeverageTag === null && customerOrderRecipeTag === null && !hasMystiaCooker) {
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

function calculateMinScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithPopular,
	hasMystiaCooker,
	mealScore,
}: Pick<
	IParameters,
	'currentBeverageTags' | 'currentCustomerOrder' | 'currentRecipeTagsWithPopular' | 'hasMystiaCooker'
> & {
	mealScore: number;
}) {
	if (hasMystiaCooker) {
		return mealScore;
	}

	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (customerOrderBeverageTag === null || customerOrderRecipeTag === null) {
		return mealScore;
	}

	if (
		currentBeverageTags.includes(customerOrderBeverageTag) &&
		currentRecipeTagsWithPopular.includes(customerOrderRecipeTag)
	) {
		return Math.max(mealScore, 2);
	}

	return mealScore;
}

export function checkIngredientEasterEgg({
	currentCustomerName,
	currentIngredients,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName' | 'currentIngredients'> & {
	mealScore?: number;
}): {
	ingredient: TIngredientName | null;
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
}: Pick<IParameters, 'currentCustomerName' | 'currentRecipeName'> & {
	mealScore?: number;
}): {
	recipe: TRecipeName | null;
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
		case '梅蒂欣': {
			const recipe = DARK_MATTER_NAME;
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
}: Pick<IParameters, 'currentCustomerName' | 'currentRecipeName' | 'currentIngredients'> & {
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
		case '梅蒂欣':
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
	currentCustomerName,
	currentCustomerNegativeTags,
	currentCustomerOrder,
	currentCustomerPositiveTags,
	currentIngredients,
	currentRecipeName,
	currentRecipeTagsWithPopular,
	hasMystiaCooker,
	isDarkMatter,
}: IParameters) {
	if (currentBeverageTags.length === 0 || currentRecipeName === null) {
		return null;
	}

	let currentRecipeScore: number | null = null;

	if (isDarkMatter) {
		currentRecipeName = DARK_MATTER_NAME;
		currentRecipeScore = 0;
		currentRecipeTagsWithPopular = [DARK_MATTER_TAG];
		hasMystiaCooker = false;
	}

	const {beverageTag: customerOrderBeverageTag, recipeTag: customerOrderRecipeTag} = currentCustomerOrder;

	if (customerOrderBeverageTag === null && !hasMystiaCooker) {
		return null;
	}
	if (customerOrderRecipeTag === null && !hasMystiaCooker) {
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
	const {length: matchedBeverageScore} = matchedBeverageTagsWithoutOrderedBeverage;
	const beverageScore = orderedBeverageScore + matchedBeverageScore;

	if (currentRecipeScore === null) {
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
		const {length: matchedRecipeNegativeScore} = matchedRecipeNegativeTags;
		const {length: matchedRecipePositiveScore} = matchedRecipePositiveTagsWithoutOrderedRecipe;
		currentRecipeScore = isDarkMatter
			? 0
			: orderedRecipeScore + matchedRecipePositiveScore - matchedRecipeNegativeScore;
	}

	let mealScore = Math.min(
		beverageScore + currentRecipeScore,
		calculateMaxScore({
			currentBeverageTags,
			currentCustomerOrder,
			currentRecipeTagsWithPopular,
			hasMystiaCooker,
		})
	);

	mealScore = calculateMinScore({
		currentBeverageTags,
		currentCustomerOrder,
		currentRecipeTagsWithPopular,
		hasMystiaCooker,
		mealScore,
	});

	mealScore = checkEasterEgg({
		currentCustomerName,
		currentIngredients,
		currentRecipeName,
		mealScore,
	});

	return getRatingKey(mealScore);
}
