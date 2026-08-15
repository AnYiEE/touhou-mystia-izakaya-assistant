import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { NormalGuestCatalog } from '@/domain/catalog/guests/NormalGuestCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TNormalGuestId } from '@/domain/data/guests/normal/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { createBoundedRuntimeCache } from '@/shared/utilities/cache/createBoundedRuntimeCache';

import { evaluateNormalGuestMeal } from './normalGuestMeal';
import { evaluateSpecialGuestMeal } from './specialGuestMeal';
import type { TRatingKey } from './types';

interface ISpecialGuestSavedMealEvaluation {
	isDarkMatter: boolean;
	price: number;
	rating: TRatingKey | null;
}

const beverageCatalog = BeverageCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const normalGuestCatalog = NormalGuestCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

const normalGuestSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	TRatingKey
>();

const specialGuestSavedMealRatingCache = createBoundedRuntimeCache<
	string,
	ISpecialGuestSavedMealEvaluation
>();

export function evaluateNormalGuestSavedMeal({
	isFamousShop,
	mealFood,
	normalGuest,
	popularTrend,
}: {
	isFamousShop: boolean;
	mealFood: IMealFood;
	normalGuest: TNormalGuestId;
	popularTrend: IPopularTrend;
}) {
	const { extraIngredients, recipeId } = mealFood;
	const cacheKey = JSON.stringify({
		isFamousShop,
		mealFood: { extraIngredients, recipeId },
		normalGuest,
		popularTrend,
	});
	const cachedResult = normalGuestSavedMealRatingCache.get(cacheKey);

	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const { food, recipe } = foodCatalog.getRecipeOwnerById(recipeId);
	const extraTags = extraIngredients.flatMap((ingredient) =>
		ingredientCatalog.getIngredientTags(ingredient)
	);
	const composedFoodTags = foodCatalog.composeFoodTagsWithPopularTrend(
		recipe.ingredients,
		extraIngredients,
		food.positiveTags,
		extraTags,
		popularTrend
	);
	const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
		composedFoodTags,
		popularTrend,
		isFamousShop
	);
	const rating = evaluateNormalGuestMeal({
		currentFoodTagsWithTrend: foodTagsWithTrend,
		currentMealFood: mealFood,
		currentNormalGuest: normalGuest,
		currentNormalGuestPositiveTags: normalGuestCatalog.getPropsById(
			normalGuest,
			'positiveTags'
		),
	}) as TRatingKey;

	normalGuestSavedMealRatingCache.set(cacheKey, rating);

	return rating;
}

export function evaluateSpecialGuestSavedMeal({
	beverage,
	hasMystiaCooker,
	isFamousShop,
	mealFood,
	popularTrend,
	specialGuest,
	specialGuestOrder,
}: {
	beverage: TBeverageId;
	hasMystiaCooker: boolean;
	isFamousShop: boolean;
	mealFood: IMealFood;
	popularTrend: IPopularTrend;
	specialGuest: TSpecialGuestId;
	specialGuestOrder: IGuestOrder;
}): ISpecialGuestSavedMealEvaluation {
	const { extraIngredients, recipeId } = mealFood;
	const cacheKey = JSON.stringify({
		beverage,
		hasMystiaCooker,
		isFamousShop,
		mealFood: { extraIngredients, recipeId },
		popularTrend,
		specialGuest,
		specialGuestOrder,
	});
	const cachedResult = specialGuestSavedMealRatingCache.get(cacheKey);

	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const {
		beverageTags: specialGuestBeverageTags,
		negativeTags: specialGuestNegativeTags,
		positiveTags: specialGuestPositiveTags,
	} = specialGuestCatalog.getPropsById(specialGuest);
	const { price: beveragePrice, tags: beverageTags } =
		beverageCatalog.getPropsById(beverage);
	const { food, recipe } = foodCatalog.getRecipeOwnerById(recipeId);
	const { negativeTags, positiveTags, price: originalFoodPrice } = food;
	const { extraTags, isDarkMatter } = foodCatalog.checkDarkMatter({
		extraIngredients,
		negativeTags,
	});
	const foodPrice = isDarkMatter
		? DARK_MATTER_META_MAP.price
		: originalFoodPrice;
	const composedFoodTags = foodCatalog.composeFoodTagsWithPopularTrend(
		recipe.ingredients,
		extraIngredients,
		positiveTags,
		extraTags,
		popularTrend
	);
	const foodTagsWithTrend = foodCatalog.calculateFoodTagsWithTrend(
		composedFoodTags,
		popularTrend,
		isFamousShop
	);

	const rating = evaluateSpecialGuestMeal({
		currentBeverageTags: beverageTags,
		currentFoodTagsWithTrend: foodTagsWithTrend,
		currentMealFood: mealFood,
		currentSpecialGuest: specialGuest,
		currentSpecialGuestBeverageTags: specialGuestBeverageTags,
		currentSpecialGuestNegativeTags: specialGuestNegativeTags,
		currentSpecialGuestOrder: specialGuestOrder,
		currentSpecialGuestPositiveTags: specialGuestPositiveTags,
		hasMystiaCooker,
		isDarkMatter,
	});
	const result = { isDarkMatter, price: beveragePrice + foodPrice, rating };

	specialGuestSavedMealRatingCache.set(cacheKey, result);

	return result;
}
