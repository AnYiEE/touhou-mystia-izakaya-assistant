import {
	DARK_MATTER_META_MAP,
	type TBeverageName,
	type TCustomerNormalName,
	type TCustomerRareName,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
} from '@/data';
import type { IPopularTrend, TPopularTag } from '@/types';
import type { ICustomerOrder } from '@/stores';
import { union } from '@/utilities';
import { CustomerRare } from '@/utils/customer/customer_rare';
import { CustomerNormal } from '@/utils/customer/customer_normal';
import { Beverage } from '@/utils/food/beverages';
import { Recipe } from '@/utils/food/recipes';
import { Ingredient } from '@/utils/food/ingredients';

export interface IBuildMealEvaluationRareParams {
	customerName: TCustomerRareName;
	customerOrder: ICustomerOrder;
	hasMystiaCooker: boolean;
	beverageName: TBeverageName;
	recipeName: TRecipeName;
	extraIngredients: TIngredientName[];
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}

export interface IBuildMealEvaluationNormalParams {
	customerName: TCustomerNormalName;
	recipeName: TRecipeName;
	extraIngredients: TIngredientName[];
	popularTrend: IPopularTrend;
	isFamousShop: boolean;
}

export interface IMealEvaluationResult {
	rating: TRatingKey | null;
	isDarkMatter: boolean;
	price: number;
}

export function buildFullMealEvaluationRare({
	beverageName,
	customerName,
	customerOrder,
	extraIngredients,
	hasMystiaCooker,
	isFamousShop,
	popularTrend,
	recipeName,
}: IBuildMealEvaluationRareParams): IMealEvaluationResult & {
	rating: TRatingKey;
} {
	const instance_customer = CustomerRare.getInstance();
	const instance_beverage = Beverage.getInstance();
	const instance_recipe = Recipe.getInstance();

	const {
		beverageTags: customerBeverageTags,
		negativeTags: customerNegativeTags,
		positiveTags: customerPositiveTags,
	} = instance_customer.getPropsByName(customerName);

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

	const rating = instance_customer.evaluateMeal({
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

	// Paths 1 (null recipe) & 2 (empty beverage tags) are unreachable: getPropsByName guarantees valid data.
	// Path 3 (null order tags && !hasMystiaCooker) is unreachable for saved meals: save logic pairs null tags with hasMystiaCooker=true.
	// Path 4 (getRatingKey fallback) is unreachable: mealScore is always 0-4.
	return {
		isDarkMatter,
		price: beveragePrice + recipePrice,
		rating: rating!,
	};
}

export function buildFullMealEvaluationNormal({
	customerName,
	extraIngredients,
	isFamousShop,
	popularTrend,
	recipeName,
}: IBuildMealEvaluationNormalParams): IMealEvaluationResult & {
	rating: TRatingKey;
} {
	const instance_customer = CustomerNormal.getInstance();
	const instance_recipe = Recipe.getInstance();
	const instance_ingredient = Ingredient.getInstance();

	const customerPositiveTags = instance_customer.getPropsByName(
		customerName,
		'positiveTags'
	);

	const recipe = instance_recipe.getPropsByName(recipeName);

	const extraTags = extraIngredients.flatMap(
		(ingredient) =>
			instance_ingredient.getPropsByName(
				ingredient,
				'tags'
			) as TPopularTag[]
	);

	const rating = instance_customer.evaluateMeal({
		currentCustomerName: customerName,
		currentCustomerPopularTrend: popularTrend,
		currentCustomerPositiveTags: customerPositiveTags,
		currentExtraIngredientsLength: extraIngredients.length,
		currentExtraTags: extraTags,
		currentRecipe: recipe,
		isFamousShop,
	});

	return { isDarkMatter: false, price: recipe.price, rating };
}
