import {
	DARK_MATTER_META_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCustomerRareName,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import { type ICustomerOrder } from '@/stores';
import { checkLengthEmpty, intersection, union, without } from '@/utilities';
import { Beverage, CustomerRare, Recipe } from '@/utils';
import type { IPopularTrend } from '@/types';

interface IParameters {
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

interface INameBasedParameters {
	mode: 'name-based';
	customerName: TCustomerRareName;
	recipeName: TRecipeName;
	beverageName: TBeverageName;
	extraIngredients?: TIngredientName[];
	customerOrder: ICustomerOrder;
	hasMystiaCooker?: boolean;
	popularTrend?: IPopularTrend;
	isFamousShop?: boolean;
}

function calculateMaxScore({
	currentBeverageTags,
	currentCustomerOrder,
	currentRecipeTagsWithTrend,
	hasMystiaCooker,
}: Pick<
	IParameters,
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
	IParameters,
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

export function checkIngredientEasterEgg({
	currentCustomerName,
	currentIngredients,
	currentRecipeName,
	mealScore = 0,
}: Pick<
	IParameters,
	'currentCustomerName' | 'currentIngredients' | 'currentRecipeName'
> & { mealScore?: number }): {
	ingredient: TIngredientName | null;
	score: number;
} {
	const noChanged = { ingredient: null, score: mealScore };

	if (currentRecipeName === DARK_MATTER_META_MAP.name) {
		return noChanged;
	}

	switch (currentCustomerName) {
		case '河城荷取': {
			const ingredient = '黄瓜';
			if (currentIngredients.includes(ingredient)) {
				return { ingredient, score: Math.max(mealScore, 3) };
			}
			break;
		}
		case '犬走椛': {
			const ingredient = '可可豆';
			if (currentIngredients.includes(ingredient)) {
				return { ingredient, score: Math.min(mealScore, 1) };
			}
			break;
		}
	}

	return noChanged;
}

export function checkRecipeEasterEgg({
	currentCustomerName,
	currentRecipeName,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName' | 'currentRecipeName'> & {
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
	IParameters,
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

function getRatingKey(mealScore: number): TRatingKey {
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
		default:
			return 'exbad';
	}
}

function resolveNameBasedParameters(params: INameBasedParameters): IParameters {
	const {
		beverageName,
		customerName,
		customerOrder,
		extraIngredients = [],
		hasMystiaCooker = false,
		isFamousShop = false,
		popularTrend = { isNegative: false, tag: null },
		recipeName,
	} = params;

	const instance_customer = CustomerRare.getInstance();
	const instance_beverage = Beverage.getInstance();
	const instance_recipe = Recipe.getInstance();

	const {
		beverageTags: customerBeverageTags,
		negativeTags: customerNegativeTags,
		positiveTags: customerPositiveTags,
	} = instance_customer.getPropsByName(customerName);

	const { tags: beverageTags } =
		instance_beverage.getPropsByName(beverageName);
	const { ingredients, negativeTags, positiveTags } =
		instance_recipe.getPropsByName(recipeName);

	const { extraTags, isDarkMatter } = instance_recipe.checkDarkMatter({
		extraIngredients,
		negativeTags,
	});

	const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		ingredients,
		extraIngredients,
		positiveTags,
		extraTags,
		popularTrend
	);

	const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
		composedRecipeTags,
		popularTrend,
		isFamousShop
	);

	return {
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags,
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags,
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags,
		currentIngredients: union(ingredients, extraIngredients),
		currentRecipeName: recipeName,
		currentRecipeTagsWithTrend: recipeTagsWithTrend,
		hasMystiaCooker,
		isDarkMatter,
	};
}

export function evaluateMeal(args: IParameters | INameBasedParameters) {
	const resolved = 'mode' in args ? resolveNameBasedParameters(args) : args;
	const {
		currentBeverageTags,
		currentCustomerBeverageTags,
		currentCustomerName,
		currentCustomerNegativeTags,
		currentCustomerOrder,
		currentCustomerPositiveTags,
		currentIngredients,
		isDarkMatter,
	} = resolved;
	let { currentRecipeName, currentRecipeTagsWithTrend, hasMystiaCooker } =
		resolved;
	if (checkLengthEmpty(currentBeverageTags) || currentRecipeName === null) {
		return null;
	}

	let currentRecipeScore: number | null = null;

	if (isDarkMatter) {
		currentRecipeName = DARK_MATTER_META_MAP.name;
		currentRecipeScore = 0;
		currentRecipeTagsWithTrend = [DARK_MATTER_META_MAP.positiveTag];
		hasMystiaCooker = false;
	}

	const {
		beverageTag: customerOrderBeverageTag,
		recipeTag: customerOrderRecipeTag,
	} = currentCustomerOrder;

	if (customerOrderBeverageTag === null && !hasMystiaCooker) {
		return null;
	}
	if (customerOrderRecipeTag === null && !hasMystiaCooker) {
		return null;
	}

	const matchedBeverageTags = intersection(
		currentBeverageTags,
		currentCustomerBeverageTags
	);
	const matchedBeverageTagsWithoutOrderedBeverage = without(
		matchedBeverageTags,
		hasMystiaCooker ? matchedBeverageTags[0] : customerOrderBeverageTag
	);
	const orderedBeverageScore = checkLengthEmpty(matchedBeverageTags)
		? 0
		: Number(
				hasMystiaCooker ||
					(customerOrderBeverageTag
						? matchedBeverageTags.includes(customerOrderBeverageTag)
						: 0)
			);
	const { length: matchedBeverageScore } =
		matchedBeverageTagsWithoutOrderedBeverage;
	const beverageScore = orderedBeverageScore + matchedBeverageScore;

	if (currentRecipeScore === null) {
		const matchedRecipeNegativeTags = intersection(
			currentRecipeTagsWithTrend,
			currentCustomerNegativeTags
		);
		const matchedRecipePositiveTags = intersection(
			currentRecipeTagsWithTrend,
			currentCustomerPositiveTags
		);
		const matchedRecipePositiveTagsWithoutOrderedRecipe = without(
			matchedRecipePositiveTags,
			hasMystiaCooker
				? matchedRecipePositiveTags[0]
				: customerOrderRecipeTag
		);
		const orderedRecipeScore = checkLengthEmpty(matchedRecipePositiveTags)
			? 0
			: Number(
					hasMystiaCooker ||
						(customerOrderRecipeTag
							? matchedRecipePositiveTags.includes(
									customerOrderRecipeTag
								)
							: 0)
				);
		const { length: matchedRecipeNegativeScore } =
			matchedRecipeNegativeTags;
		const { length: matchedRecipePositiveScore } =
			matchedRecipePositiveTagsWithoutOrderedRecipe;
		currentRecipeScore = isDarkMatter
			? 0
			: orderedRecipeScore +
				matchedRecipePositiveScore -
				matchedRecipeNegativeScore;
	}

	let mealScore = Math.min(
		beverageScore + currentRecipeScore,
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
