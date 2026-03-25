import {
	DYNAMIC_TAG_MAP,
	type TCustomerNormalName,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import { type IPopularTrend, type TPopularTag } from '@/types';
import { intersection } from '@/utilities';
import { CustomerNormal, Ingredient, Recipe } from '@/utils';
import type { TRecipe } from '@/utils/types';

interface IParameters {
	currentCustomerName: TCustomerNormalName;
	currentCustomerPopularTrend: IPopularTrend;
	currentCustomerPositiveTags: TRecipeTag[];
	currentExtraIngredientsLength: number;
	currentExtraTags: TPopularTag[];
	currentRecipe: TRecipe | null;
	isFamousShop: boolean;
}

interface INameBasedParameters {
	mode: 'name-based';
	customerName: TCustomerNormalName;
	recipeName: TRecipeName;
	extraIngredients?: TIngredientName[];
	popularTrend?: IPopularTrend;
	isFamousShop?: boolean;
}

export function checkEasterEgg({
	currentCustomerName,
	currentRecipe,
	mealScore = 0,
}: Pick<IParameters, 'currentCustomerName'> & {
	currentRecipe: TRecipe;
	mealScore?: number;
}): { recipe: TRecipeName | null; score: number } {
	const { name: currentRecipeName } = currentRecipe;

	switch (currentCustomerName) {
		case '月人': {
			const recipe = '蜜桃红烧肉';
			if (currentRecipeName === recipe) {
				return { recipe, score: 0 };
			}
		}
	}

	return { recipe: null, score: mealScore };
}

function getRatingKey(mealScore: number): TRatingKey {
	if (mealScore <= 0) {
		return 'exbad';
	} else if (mealScore <= 2) {
		return 'norm';
	}

	return 'good';
}

function resolveNameBasedParameters(params: INameBasedParameters): IParameters {
	const {
		customerName,
		extraIngredients = [],
		isFamousShop = false,
		popularTrend = { isNegative: false, tag: null },
		recipeName,
	} = params;

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

	return {
		currentCustomerName: customerName,
		currentCustomerPopularTrend: popularTrend,
		currentCustomerPositiveTags: customerPositiveTags,
		currentExtraIngredientsLength: extraIngredients.length,
		currentExtraTags: extraTags,
		currentRecipe: recipe,
		isFamousShop,
	};
}

export function evaluateMeal(args: IParameters | INameBasedParameters) {
	const resolved = 'mode' in args ? resolveNameBasedParameters(args) : args;
	const {
		currentCustomerName,
		currentCustomerPopularTrend,
		currentCustomerPositiveTags,
		currentExtraIngredientsLength,
		currentExtraTags,
		currentRecipe,
		isFamousShop,
	} = resolved;
	if (currentRecipe === null) {
		return null;
	}

	let extraScore = 0;

	if (
		isFamousShop &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularPositive) &&
		(currentRecipe.positiveTags.includes(DYNAMIC_TAG_MAP.signature) ||
			currentExtraTags.includes(DYNAMIC_TAG_MAP.signature))
	) {
		extraScore += 1;
	}

	let currentCustomerPopularTag: IPopularTrend['tag'] = null;
	const { isNegative: popularTrendIsNegative, tag: popularTag } =
		currentCustomerPopularTrend;
	if (
		popularTrendIsNegative &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularNegative)
	) {
		currentCustomerPopularTag = popularTag;
	} else if (
		!popularTrendIsNegative &&
		currentCustomerPositiveTags.includes(DYNAMIC_TAG_MAP.popularPositive)
	) {
		currentCustomerPopularTag = popularTag;
	}

	if (currentCustomerPopularTag !== null) {
		extraScore +=
			Number(
				currentRecipe.positiveTags.includes(currentCustomerPopularTag)
			) + Number(currentExtraTags.includes(currentCustomerPopularTag));
	}

	const { length: originalIngredientsLength } = currentRecipe.ingredients;
	const totalIngredientsLength =
		originalIngredientsLength + currentExtraIngredientsLength;

	if (
		(currentCustomerPopularTag === DYNAMIC_TAG_MAP.largePartition ||
			currentCustomerPositiveTags.includes(
				DYNAMIC_TAG_MAP.largePartition
			)) &&
		originalIngredientsLength !== 5 &&
		totalIngredientsLength === 5
	) {
		extraScore += 1;
	}

	extraScore += intersection(
		currentExtraTags,
		currentCustomerPositiveTags
	).length;

	let mealScore = 2 + extraScore;

	mealScore = checkEasterEgg({
		currentCustomerName,
		currentRecipe,
		mealScore,
	}).score;

	return getRatingKey(mealScore);
}
