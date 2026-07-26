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
	currentBeverageTags: ReadonlyArray<TBeverageTag>;
	currentCustomerBeverageTags: ReadonlyArray<TBeverageTag>;
	currentCustomerName: TCustomerRareName;
	currentCustomerNegativeTags: ReadonlyArray<TRecipeTag>;
	currentCustomerOrder: ICustomerOrder;
	currentCustomerPositiveTags: ReadonlyArray<TRecipeTag>;
	currentIngredients: ReadonlyArray<TIngredientName>;
	currentRecipeName: TRecipeName | null;
	currentRecipeTagsWithTrend: ReadonlyArray<TRecipeTag>;
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

export interface IMealEvaluatorRecipeSideFacts {
	readonly firstMatchedPositiveTagCount: number;
	readonly matchedNegativeTagCount: number;
	readonly matchedPositiveTagCount: number;
	readonly tagCounts: ReadonlyMap<TRecipeTag, number>;
}

export interface IMealEvaluatorRecipeSideCache {
	resolve(
		currentRecipeTagsWithTrend: ReadonlyArray<TRecipeTag>
	): IMealEvaluatorRecipeSideFacts;
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

function buildRecipeSideFacts({
	currentCustomerNegativeTags,
	currentCustomerPositiveTags,
	currentRecipeTagsWithTrend,
}: Pick<
	IEvaluateMealParams,
	| 'currentCustomerNegativeTags'
	| 'currentCustomerPositiveTags'
	| 'currentRecipeTagsWithTrend'
>) {
	let firstMatchedPositiveTag: TRecipeTag | undefined;
	let firstMatchedPositiveTagCount = 0;
	let matchedNegativeTagCount = 0;
	let matchedPositiveTagCount = 0;
	const tagCounts = new Map<TRecipeTag, number>();

	for (const tag of currentRecipeTagsWithTrend) {
		tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
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
	}

	return {
		firstMatchedPositiveTagCount,
		matchedNegativeTagCount,
		matchedPositiveTagCount,
		tagCounts,
	};
}

function evaluateRecipeSideFromFacts(
	{
		firstMatchedPositiveTagCount,
		matchedNegativeTagCount,
		matchedPositiveTagCount,
		tagCounts,
	}: IMealEvaluatorRecipeSideFacts,
	recipeOrderTag: TRecipeTag | null,
	isRecipeOrderPositive: boolean,
	hasMystiaCooker: boolean
) {
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

	const matchedOrderedTagCount =
		recipeOrderTag === null || !isRecipeOrderPositive
			? 0
			: (tagCounts.get(recipeOrderTag) ?? 0);

	return (
		Number(matchedOrderedTagCount > 0) +
		matchedPositiveTagCount -
		matchedOrderedTagCount -
		matchedNegativeTagCount
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

export function createMealEvaluatorRecipeSideCache({
	currentCustomerNegativeTags,
	currentCustomerPositiveTags,
}: Pick<
	TCreateMealEvaluatorParams,
	'currentCustomerNegativeTags' | 'currentCustomerPositiveTags'
>): IMealEvaluatorRecipeSideCache {
	const cache = new WeakMap<
		ReadonlyArray<TRecipeTag>,
		IMealEvaluatorRecipeSideFacts
	>();

	return {
		resolve(currentRecipeTagsWithTrend) {
			const cached = cache.get(currentRecipeTagsWithTrend);
			if (cached !== undefined) {
				return cached;
			}

			const facts = buildRecipeSideFacts({
				currentCustomerNegativeTags,
				currentCustomerPositiveTags,
				currentRecipeTagsWithTrend,
			});
			cache.set(currentRecipeTagsWithTrend, facts);

			return facts;
		},
	};
}

function combineMealScoreValues(
	beverageScore: number,
	recipeScore: number,
	hasMystiaCooker: boolean,
	hasBeverageOrder: boolean,
	hasRecipeOrder: boolean,
	matchesBeverageOrder: boolean,
	matchesRecipeOrder: boolean,
	currentCustomerName: TCustomerRareName,
	currentIngredients: ReadonlyArray<TIngredientName>,
	currentRecipeName: TRecipeName | null
) {
	let maxScore: number;

	if (!hasBeverageOrder && !hasRecipeOrder && !hasMystiaCooker) {
		maxScore = 0;
	} else {
		const beverageMaxScore = hasMystiaCooker
			? 1
			: Number(matchesBeverageOrder);
		const recipeMaxScore = hasMystiaCooker ? 1 : Number(matchesRecipeOrder);
		maxScore =
			beverageMaxScore + recipeMaxScore === 0
				? 1
				: 2 + beverageMaxScore + recipeMaxScore;
	}

	let mealScore = Math.min(beverageScore + recipeScore, maxScore);
	if (
		!hasMystiaCooker &&
		hasBeverageOrder &&
		hasRecipeOrder &&
		matchesBeverageOrder &&
		matchesRecipeOrder
	) {
		mealScore = Math.max(mealScore, 2);
	}

	mealScore = checkEasterEgg({
		currentCustomerName,
		currentIngredients,
		currentRecipeName,
		mealScore,
	});

	return getRatingKey(mealScore);
}

function combineMealSides({
	beverageScore,
	currentCustomerName,
	currentCustomerOrder,
	currentIngredients,
	currentRecipeName,
	currentRecipeTagsWithTrend,
	doesBeverageMatchOrder,
	hasMystiaCooker,
	recipeScore,
}: Pick<
	IEvaluateMealParams,
	| 'currentCustomerName'
	| 'currentCustomerOrder'
	| 'currentIngredients'
	| 'currentRecipeName'
	| 'currentRecipeTagsWithTrend'
	| 'hasMystiaCooker'
> & {
	readonly beverageScore: number;
	readonly doesBeverageMatchOrder: boolean;
	readonly recipeScore: number;
}) {
	const {
		beverageTag: customerOrderBeverageTag,
		recipeTag: customerOrderRecipeTag,
	} = currentCustomerOrder;
	const matchesBeverageOrder =
		customerOrderBeverageTag !== null && doesBeverageMatchOrder;
	const matchesRecipeOrder =
		customerOrderRecipeTag !== null &&
		currentRecipeTagsWithTrend.includes(customerOrderRecipeTag);

	return combineMealScoreValues(
		beverageScore,
		recipeScore,
		hasMystiaCooker,
		customerOrderBeverageTag !== null,
		customerOrderRecipeTag !== null,
		matchesBeverageOrder,
		matchesRecipeOrder,
		currentCustomerName,
		currentIngredients,
		currentRecipeName
	);
}

function createMealEvaluatorInternal({
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
	const doesBeverageMatchOrder =
		currentCustomerOrder.beverageTag !== null &&
		currentBeverageTags.includes(currentCustomerOrder.beverageTag);

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
			currentCustomerName,
			currentCustomerOrder,
			currentIngredients,
			currentRecipeName: effectiveRecipeName,
			currentRecipeTagsWithTrend: effectiveRecipeTagsWithTrend,
			doesBeverageMatchOrder,
			hasMystiaCooker: effectiveHasMystiaCooker,
			recipeScore,
		});
	};
}

export function createMealEvaluator(params: TCreateMealEvaluatorParams) {
	return createMealEvaluatorInternal(params);
}

export function createMealEvaluatorWithRecipeSideCache(
	params: TCreateMealEvaluatorParams,
	recipeSideCache: IMealEvaluatorRecipeSideCache
) {
	const {
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerName,
		currentCustomerOrder,
		currentCustomerPositiveTags,
		hasMystiaCooker,
	} = params;
	const evaluateWithoutCache = createMealEvaluatorInternal(params);
	const beverageOrderTag = currentCustomerOrder.beverageTag;
	const recipeOrderTag = currentCustomerOrder.recipeTag;
	const beverageScore = evaluateBeverageSide({
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerOrder,
		hasMystiaCooker,
	});
	const hasBeverageOrder = beverageOrderTag !== null;
	const hasRecipeOrder = recipeOrderTag !== null;
	const isRecipeOrderPositive =
		recipeOrderTag !== null &&
		currentCustomerPositiveTags.includes(recipeOrderTag);
	const matchesBeverageOrder =
		beverageOrderTag !== null &&
		currentBeverageTags.includes(beverageOrderTag);

	return ({
		currentIngredients,
		currentRecipeName,
		currentRecipeTagsWithTrend,
		isDarkMatter,
	}: TMealEvaluatorParams) => {
		if (isDarkMatter) {
			return evaluateWithoutCache({
				currentIngredients,
				currentRecipeName,
				currentRecipeTagsWithTrend,
				isDarkMatter,
			});
		}
		if (currentBeverageTags.length === 0 || currentRecipeName === null) {
			return null;
		}
		if ((!hasBeverageOrder || !hasRecipeOrder) && !hasMystiaCooker) {
			return null;
		}

		const recipeSideFacts = recipeSideCache.resolve(
			currentRecipeTagsWithTrend
		);
		const recipeScore = evaluateRecipeSideFromFacts(
			recipeSideFacts,
			recipeOrderTag,
			isRecipeOrderPositive,
			hasMystiaCooker
		);
		const matchesRecipeOrder =
			recipeOrderTag !== null &&
			recipeSideFacts.tagCounts.has(recipeOrderTag);

		return combineMealScoreValues(
			beverageScore,
			recipeScore,
			hasMystiaCooker,
			hasBeverageOrder,
			hasRecipeOrder,
			matchesBeverageOrder,
			matchesRecipeOrder,
			currentCustomerName,
			currentIngredients,
			currentRecipeName
		);
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
