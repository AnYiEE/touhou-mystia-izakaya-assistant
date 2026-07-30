import { CustomerNormal } from '@/domain/catalog/customers/CustomerNormal';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Beverage } from '@/domain/catalog/food/Beverage';
import { Ingredient } from '@/domain/catalog/food/Ingredient';
import { Recipe } from '@/domain/catalog/food/Recipe';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCustomerNormalName } from '@/domain/data/customers/normal/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import type { IMealRecipe } from '@/domain/meals/types';
import type { ICustomerOrder } from '@/domain/orders/types';
import type { IPopularTrend, TPopularTag } from '@/domain/trends/types';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';

import { evaluateNormalCustomerMeal } from './normalCustomerMeal';
import { evaluateRareCustomerMeal } from './rareCustomerMeal';
import type { TRatingKey } from './types';

interface IRareSavedMealEvaluation {
	isDarkMatter: boolean;
	price: number;
	rating: TRatingKey | null;
}

const instance_beverage = Beverage.getInstance();
const instance_customer_normal = CustomerNormal.getInstance();
const instance_customer_rare = CustomerRare.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();

const normalSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	TRatingKey
>();

const rareSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	IRareSavedMealEvaluation
>();

export function evaluateNormalSavedMeal({
	customerName,
	isFamousShop,
	popularTrend,
	recipeData: { extraIngredients, name: recipeName, recipeId },
}: {
	customerName: TCustomerNormalName;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeData: IMealRecipe;
}) {
	const cacheKey = JSON.stringify({
		customerName,
		isFamousShop,
		popularTrend,
		recipeData: { extraIngredients, name: recipeName, recipeId },
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
	const { baseIngredients } = instance_recipe.resolveMealRecipe({
		extraIngredients,
		name: recipeName,
		recipeId,
	});
	const recipe = instance_recipe.getPropsByName(recipeName);

	const rating = evaluateNormalCustomerMeal({
		currentCustomerName: customerName,
		currentCustomerPopularTrend: popularTrend,
		currentCustomerPositiveTags: instance_customer_normal.getPropsByName(
			customerName,
			'positiveTags'
		),
		currentExtraIngredientsLength: extraIngredients.length,
		currentExtraTags: extraTags,
		currentRecipe: {
			ingredients: baseIngredients,
			name: recipeName,
			positiveTags: recipe.positiveTags,
		},
		isFamousShop,
	}) as TRatingKey;

	normalSavedMealRatingCache.set(cacheKey, rating);

	return rating;
}

export function evaluateRareSavedMeal({
	beverageName,
	customerName,
	customerOrder,
	hasMystiaCooker,
	isFamousShop,
	popularTrend,
	recipeData: { extraIngredients, name: recipeName, recipeId },
}: {
	beverageName: TBeverageName;
	customerName: TCustomerRareName;
	customerOrder: ICustomerOrder;
	hasMystiaCooker: boolean;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeData: IMealRecipe;
}): IRareSavedMealEvaluation {
	const cacheKey = JSON.stringify({
		beverageName,
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		popularTrend,
		recipeData: { extraIngredients, name: recipeName, recipeId },
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
		negativeTags,
		positiveTags,
		price: originalRecipePrice,
	} = instance_recipe.getPropsByName(recipeName);
	const { baseIngredients } = instance_recipe.resolveMealRecipe({
		extraIngredients,
		name: recipeName,
		recipeId,
	});
	const { extraTags, isDarkMatter } = instance_recipe.checkDarkMatter({
		extraIngredients,
		negativeTags,
	});
	const recipePrice = isDarkMatter
		? DARK_MATTER_META_MAP.price
		: originalRecipePrice;
	const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		baseIngredients,
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

	const rating = evaluateRareCustomerMeal({
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags,
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags,
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags,
		currentIngredients: [
			...new Set([...baseIngredients, ...extraIngredients]),
		],
		currentRecipeName: recipeName,
		currentRecipeTagsWithTrend: recipeTagsWithTrend,
		hasMystiaCooker,
		isDarkMatter,
	});
	const result = { isDarkMatter, price: beveragePrice + recipePrice, rating };

	rareSavedMealRatingCache.set(cacheKey, result);

	return result;
}
