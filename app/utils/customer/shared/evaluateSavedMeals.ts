import {
	DARK_MATTER_META_MAP,
	type TBeverageName,
	type TCustomerNormalName,
	type TCustomerRareName,
} from '@/data';
import { type ICustomerOrder } from '@/stores';
import {
	type IMealRecipe,
	type IPopularTrend,
	type TPopularTag,
	type TRatingKey,
} from '@/types';
import {
	Beverage,
	CustomerNormal,
	CustomerRare,
	Ingredient,
	Recipe,
} from '@/utils';
import { createBoundedRuntimeCache, union } from '@/utilities';

const instance_beverage = Beverage.getInstance();
const instance_customer_normal = CustomerNormal.getInstance();
const instance_customer_rare = CustomerRare.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const SAVED_MEAL_RATING_CACHE_MAX_SIZE = 256;

const rareSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	IRareSavedMealEvaluation
>(SAVED_MEAL_RATING_CACHE_MAX_SIZE);

const normalSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	TRatingKey
>(SAVED_MEAL_RATING_CACHE_MAX_SIZE);

export interface IEvaluateRareSavedMealArgs {
	beverageName: TBeverageName;
	customerName: TCustomerRareName;
	customerOrder: ICustomerOrder;
	hasMystiaCooker: boolean;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeData: IMealRecipe;
}

export interface IRareSavedMealEvaluation {
	isDarkMatter: boolean;
	price: number;
	rating: TRatingKey | null;
}

export interface IEvaluateNormalSavedMealArgs {
	customerName: TCustomerNormalName;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeData: IMealRecipe;
}

/**
 * 评估单条稀客保存套餐，保留现有 Dark Matter、总价与评级计算逻辑。
 */
export function evaluateRareSavedMeal({
	beverageName,
	customerName,
	customerOrder,
	hasMystiaCooker,
	isFamousShop,
	popularTrend,
	recipeData: { extraIngredients, name: recipeName },
}: IEvaluateRareSavedMealArgs): IRareSavedMealEvaluation {
	const cacheKey = JSON.stringify({
		beverageName,
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		popularTrend,
		recipeData: { extraIngredients, name: recipeName },
	});
	const cachedResult = rareSavedMealRatingCache.get(cacheKey);

	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const {
		beverageTags: customerBeverageTags,
		negativeTags: customerNegativeTags,
		positiveTags: customerPositiveTags,
	} = instance_customer_rare.getPropsByName(customerName);
	const { price: beveragePrice, tags: beverageTags } =
		instance_beverage.getPropsByName(beverageName);
	const {
		ingredients,
		negativeTags,
		positiveTags,
		price: originalRecipePrice,
	} = instance_recipe.getPropsByName(recipeName);
	const { extraTags, isDarkMatter } = instance_recipe.checkDarkMatter({
		extraIngredients,
		negativeTags,
	});
	const recipePrice = isDarkMatter
		? DARK_MATTER_META_MAP.price
		: originalRecipePrice;
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
	const rating = instance_customer_rare.evaluateMeal({
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
	});
	const result = { isDarkMatter, price: beveragePrice + recipePrice, rating };

	rareSavedMealRatingCache.set(cacheKey, result);

	return result;
}

/**
 * 评估单条普客保存套餐，保留现有额外食材与流行趋势的评级逻辑。
 */
export function evaluateNormalSavedMeal({
	customerName,
	isFamousShop,
	popularTrend,
	recipeData: { extraIngredients, name: recipeName },
}: IEvaluateNormalSavedMealArgs): TRatingKey {
	const cacheKey = JSON.stringify({
		customerName,
		isFamousShop,
		popularTrend,
		recipeData: { extraIngredients, name: recipeName },
	});
	const cachedResult = normalSavedMealRatingCache.get(cacheKey);

	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const extraTags = extraIngredients.flatMap(
		(ingredientName) =>
			instance_ingredient.getPropsByName(
				ingredientName,
				'tags'
			) as TPopularTag[]
	);

	const rating = instance_customer_normal.evaluateMeal({
		currentCustomerName: customerName,
		currentCustomerPopularTrend: popularTrend,
		currentCustomerPositiveTags: instance_customer_normal.getPropsByName(
			customerName,
			'positiveTags'
		),
		currentExtraIngredientsLength: extraIngredients.length,
		currentExtraTags: extraTags,
		currentRecipe: instance_recipe.getPropsByName(recipeName),
		isFamousShop,
	}) as TRatingKey;

	normalSavedMealRatingCache.set(cacheKey, rating);

	return rating;
}
