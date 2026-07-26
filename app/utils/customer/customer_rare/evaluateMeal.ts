import {
	DARK_MATTER_META_MAP,
	type TBeverageTag,
	type TCustomerRareName,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import { type ICustomerOrder } from '@/types';

export interface IEvaluateMealParams {
	currentBeverageTags: TBeverageTag[];
	currentCustomerBeverageTags: TBeverageTag[];
	currentCustomerName: TCustomerRareName;
	currentCustomerNegativeTags: TRecipeTag[];
	currentCustomerOrder: ICustomerOrder;
	currentCustomerPositiveTags: TRecipeTag[];
	currentIngredients: TIngredientName[];
	currentRecipeName: TRecipeName | null;
	currentRecipeTagsWithTrend: TRecipeTag[];
	hasMystiaCooker: boolean;
	isDarkMatter: boolean;
}

export type TCreateMealEvaluatorParams = Pick<
	IEvaluateMealParams,
	| 'currentBeverageTags'
	| 'currentCustomerBeverageTags'
	| 'currentCustomerName'
	| 'currentCustomerNegativeTags'
	| 'currentCustomerOrder'
	| 'currentCustomerPositiveTags'
	| 'hasMystiaCooker'
>;

export type TMealEvaluatorParams = Pick<
	IEvaluateMealParams,
	| 'currentIngredients'
	| 'currentRecipeName'
	| 'currentRecipeTagsWithTrend'
	| 'isDarkMatter'
>;

function calculateMaxScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
}: Pick<
	IEvaluateMealParams,
	| 'currentBeverageTags'
	| 'currentCustomerOrder'
	| 'currentRecipeTagsWithTrend'
	| 'hasMystiaCooker'
>) {
	const {
		beverageTag: customerOrderBeverageTag,
		recipeTag: customerOrderRecipeTag,
	} = currentCustomerOrder;

	if (
		customerOrderBeverageTag === null &&
		customerOrderRecipeTag === null &&
		!hasMystiaCooker
	) {
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
			? Number(
					currentRecipeTagsWithTrend.includes(customerOrderRecipeTag)
				)
			: 0;

	if (beverageMaxScore + recipeMaxScore === 0) {
		return 1;
	}

	return 1 + 1 + beverageMaxScore + recipeMaxScore;
}

function calculateMinScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
	mealScore,
}: Pick<
	IEvaluateMealParams,
	| 'currentBeverageTags'
	| 'currentCustomerOrder'
	| 'currentRecipeTagsWithTrend'
	| 'hasMystiaCooker'
> & { mealScore: number }) {
	if (hasMystiaCooker) {
		return mealScore;
	}

	const {
		beverageTag: customerOrderBeverageTag,
		recipeTag: customerOrderRecipeTag,
	} = currentCustomerOrder;

	if (customerOrderBeverageTag === null || customerOrderRecipeTag === null) {
		return mealScore;
	}

	if (
		currentBeverageTags.includes(customerOrderBeverageTag) &&
		currentRecipeTagsWithTrend.includes(customerOrderRecipeTag)
	) {
		return Math.max(mealScore, 2);
	}

	return mealScore;
}

export function getIngredientEasterEggTarget(
	currentCustomerName: TCustomerRareName
): TIngredientName | null {
	switch (currentCustomerName) {
		case '河城荷取':
			return '黄瓜';
		case '犬走椛':
			return '可可豆';
		default:
			return null;
	}
}

export function checkIngredientEasterEgg({
	currentCustomerName,
	currentIngredients,
	currentRecipeName,
	mealScore = 0,
}: Pick<
	IEvaluateMealParams,
	'currentCustomerName' | 'currentIngredients' | 'currentRecipeName'
> & { mealScore?: number }): {
	ingredient: TIngredientName | null;
	score: number;
} {
	const noChanged = { ingredient: null, score: mealScore };

	if (currentRecipeName === DARK_MATTER_META_MAP.name) {
		return noChanged;
	}

	const ingredient = getIngredientEasterEggTarget(currentCustomerName);
	if (ingredient === null || !currentIngredients.includes(ingredient)) {
		return noChanged;
	}

	switch (currentCustomerName) {
		case '河城荷取':
			return { ingredient, score: Math.max(mealScore, 3) };
		case '犬走椛':
			return { ingredient, score: Math.min(mealScore, 1) };
	}

	return noChanged;
}

export function checkRecipeEasterEgg({
	currentCustomerName,
	currentRecipeName,
	mealScore = 0,
}: Pick<IEvaluateMealParams, 'currentCustomerName' | 'currentRecipeName'> & {
	mealScore?: number;
}): { recipe: TRecipeName | null; score: number } {
	switch (currentCustomerName) {
		case '古明地恋': {
			const recipe = '无意识妖怪慕斯';
			if (currentRecipeName === recipe) {
				return { recipe, score: 0 };
			}
			break;
		}
		case '蕾米莉亚': {
			const recipe = '猩红恶魔蛋糕';
			if (currentRecipeName === recipe) {
				return { recipe, score: 4 };
			}
			break;
		}
		case '梅蒂欣': {
			const recipe = DARK_MATTER_META_MAP.name;
			if (currentRecipeName === recipe) {
				return { recipe, score: 3 };
			}
			break;
		}
		case '绵月丰姬':
		case '绵月依姬': {
			const recipe = '蜜桃红烧肉';
			if (currentRecipeName === recipe) {
				return { recipe, score: 0 };
			}
			break;
		}
		case '饕餮尤魔': {
			const recipe = '油豆腐';
			if (currentRecipeName === recipe) {
				return { recipe, score: 3 };
			}
			break;
		}
		case '雾雨魔理沙': {
			const recipe = '牛肉鸳鸯火锅';
			if (currentRecipeName === recipe) {
				return { recipe, score: 4 };
			}
			break;
		}
	}

	return { recipe: null, score: mealScore };
}

function checkEasterEgg({
	currentCustomerName,
	currentIngredients,
	currentRecipeName,
	mealScore,
}: Pick<
	IEvaluateMealParams,
	'currentCustomerName' | 'currentRecipeName' | 'currentIngredients'
> & { mealScore: number }) {
	switch (currentCustomerName) {
		case '河城荷取':
		case '犬走椛':
			return checkIngredientEasterEgg({
				currentCustomerName,
				currentIngredients,
				currentRecipeName,
				mealScore,
			}).score;
		case '古明地恋':
		case '蕾米莉亚':
		case '梅蒂欣':
		case '绵月丰姬':
		case '绵月依姬':
		case '饕餮尤魔':
		case '雾雨魔理沙':
			return checkRecipeEasterEgg({
				currentCustomerName,
				currentRecipeName,
				mealScore,
			}).score;
	}

	return mealScore;
}

function getRatingKey(mealScore: number): TRatingKey | null {
	if (mealScore <= 0) {
		return 'exbad';
	}

	switch (mealScore) {
		case 1:
			return 'bad';
		case 2:
			return 'norm';
		case 3:
			return 'good';
		case 4:
			return 'exgood';
	}

	return null;
}

function evaluateBeverageSide({
	currentBeverageTags,
	currentCustomerBeverageTags,
	currentCustomerOrder,
	hasMystiaCooker,
}: Pick<
	TCreateMealEvaluatorParams,
	| 'currentBeverageTags'
	| 'currentCustomerBeverageTags'
	| 'currentCustomerOrder'
	| 'hasMystiaCooker'
>) {
	let firstMatchedTag: TBeverageTag | undefined;
	let firstMatchedTagCount = 0;
	let matchedOrderedTagCount = 0;
	let matchedTagCount = 0;

	for (const tag of currentBeverageTags) {
		if (!currentCustomerBeverageTags.includes(tag)) {
			continue;
		}

		matchedTagCount++;
		if (firstMatchedTag === undefined) {
			firstMatchedTag = tag;
			firstMatchedTagCount = 1;
		} else if (tag === firstMatchedTag) {
			firstMatchedTagCount++;
		}
		if (tag === currentCustomerOrder.beverageTag) {
			matchedOrderedTagCount++;
		}
	}

	if (matchedTagCount === 0) {
		return 0;
	}
	if (hasMystiaCooker) {
		return 1 + matchedTagCount - firstMatchedTagCount;
	}

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedTagCount -
		matchedOrderedTagCount
	);
}

function evaluateRecipeSide({
	currentCustomerNegativeTags,
	currentCustomerOrder,
	currentCustomerPositiveTags,
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
}: Pick<
	IEvaluateMealParams,
	| 'currentCustomerNegativeTags'
	| 'currentCustomerOrder'
	| 'currentCustomerPositiveTags'
	| 'currentRecipeTagsWithTrend'
	| 'hasMystiaCooker'
>) {
	let firstMatchedPositiveTag: TRecipeTag | undefined;
	let firstMatchedPositiveTagCount = 0;
	let matchedNegativeTagCount = 0;
	let matchedOrderedTagCount = 0;
	let matchedPositiveTagCount = 0;

	for (const tag of currentRecipeTagsWithTrend) {
		if (currentCustomerNegativeTags.includes(tag)) {
			matchedNegativeTagCount++;
		}
		if (!currentCustomerPositiveTags.includes(tag)) {
			continue;
		}

		matchedPositiveTagCount++;
		if (firstMatchedPositiveTag === undefined) {
			firstMatchedPositiveTag = tag;
			firstMatchedPositiveTagCount = 1;
		} else if (tag === firstMatchedPositiveTag) {
			firstMatchedPositiveTagCount++;
		}
		if (tag === currentCustomerOrder.recipeTag) {
			matchedOrderedTagCount++;
		}
	}

	if (matchedPositiveTagCount === 0) {
		return -matchedNegativeTagCount;
	}
	if (hasMystiaCooker) {
		return (
			1 +
			matchedPositiveTagCount -
			firstMatchedPositiveTagCount -
			matchedNegativeTagCount
		);
	}

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedPositiveTagCount -
		matchedOrderedTagCount -
		matchedNegativeTagCount
	);
}

function combineMealSides({
	beverageScore,
	currentBeverageTags,
	currentCustomerName,
	currentCustomerOrder,
	currentIngredients,
	currentRecipeName,
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
	recipeScore,
}: Pick<
	IEvaluateMealParams,
	| 'currentBeverageTags'
	| 'currentCustomerName'
	| 'currentCustomerOrder'
	| 'currentIngredients'
	| 'currentRecipeName'
	| 'currentRecipeTagsWithTrend'
	| 'hasMystiaCooker'
> & { beverageScore: number; recipeScore: number }) {
	let mealScore = Math.min(
		beverageScore + recipeScore,
		calculateMaxScore({
			currentBeverageTags,
			currentCustomerOrder,
			currentRecipeTagsWithTrend,
			hasMystiaCooker,
		})
	);

	mealScore = calculateMinScore({
		currentBeverageTags,
		currentCustomerOrder,
		currentRecipeTagsWithTrend,
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

export function createMealEvaluator({
	currentBeverageTags,
	currentCustomerBeverageTags,
	currentCustomerName,
	currentCustomerNegativeTags,
	currentCustomerOrder,
	currentCustomerPositiveTags,
	hasMystiaCooker,
}: TCreateMealEvaluatorParams) {
	const beverageScoreWithMystiaCooker = evaluateBeverageSide({
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerOrder,
		hasMystiaCooker: true,
	});
	const beverageScoreWithoutMystiaCooker = evaluateBeverageSide({
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerOrder,
		hasMystiaCooker: false,
	});

	return ({
		currentIngredients,
		currentRecipeName,
		currentRecipeTagsWithTrend,
		isDarkMatter,
	}: TMealEvaluatorParams) => {
		if (currentBeverageTags.length === 0 || currentRecipeName === null) {
			return null;
		}

		const effectiveHasMystiaCooker = isDarkMatter ? false : hasMystiaCooker;
		const effectiveRecipeName = isDarkMatter
			? DARK_MATTER_META_MAP.name
			: currentRecipeName;
		const effectiveRecipeTagsWithTrend = isDarkMatter
			? [DARK_MATTER_META_MAP.positiveTag]
			: currentRecipeTagsWithTrend;

		if (
			(currentCustomerOrder.beverageTag === null ||
				currentCustomerOrder.recipeTag === null) &&
			!effectiveHasMystiaCooker
		) {
			return null;
		}

		const beverageScore = effectiveHasMystiaCooker
			? beverageScoreWithMystiaCooker
			: beverageScoreWithoutMystiaCooker;
		const recipeScore = isDarkMatter
			? 0
			: evaluateRecipeSide({
					currentCustomerNegativeTags,
					currentCustomerOrder,
					currentCustomerPositiveTags,
					currentRecipeTagsWithTrend: effectiveRecipeTagsWithTrend,
					hasMystiaCooker: effectiveHasMystiaCooker,
				});

		return combineMealSides({
			beverageScore,
			currentBeverageTags,
			currentCustomerName,
			currentCustomerOrder,
			currentIngredients,
			currentRecipeName: effectiveRecipeName,
			currentRecipeTagsWithTrend: effectiveRecipeTagsWithTrend,
			hasMystiaCooker: effectiveHasMystiaCooker,
			recipeScore,
		});
	};
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
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
	isDarkMatter,
}: IEvaluateMealParams) {
	return createMealEvaluator({
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerName,
		currentCustomerNegativeTags,
		currentCustomerOrder,
		currentCustomerPositiveTags,
		hasMystiaCooker,
	})({
		currentIngredients,
		currentRecipeName,
		currentRecipeTagsWithTrend,
		isDarkMatter,
	});
}
