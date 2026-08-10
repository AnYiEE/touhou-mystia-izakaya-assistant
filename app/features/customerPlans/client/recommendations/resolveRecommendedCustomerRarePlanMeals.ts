import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { CustomerRare } from '@/domain/catalog/customers/CustomerRare';
import { Recipe } from '@/domain/catalog/food/Recipe';
import { Cooker } from '@/domain/catalog/items/Cooker';
import type { TBeverageName } from '@/domain/data/beverages/types';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TRecipeName } from '@/domain/data/recipes/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { TBeverageTag, TRecipeTag } from '@/domain/data/tags/types';
import type { ISuggestedMeal } from '@/domain/recommendations/types';
import type { IPopularTrend } from '@/domain/trends/types';

import type { IResolvedCustomerRarePlanGroup } from '@/features/customerPlans/contracts';
import {
	type ISuggestMealsOptions,
	suggestMealsBatch,
} from '@/features/recommendations/client/suggestMeals';

import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

export interface IRecommendedCustomerRarePlanMealCombo {
	beverageTag: TBeverageTag;
	cooker: TCookerName;
	recipeTag: TRecipeTag;
}

export interface IRecommendedCustomerRarePlanMealSession {
	readonly combos: ReadonlyArray<IRecommendedCustomerRarePlanMealCombo>;
}

export interface IRecommendedCustomerRarePlanMealProgress {
	readonly isComplete: boolean;
	readonly meals: IResolvedCustomerRarePlanGroup['meals'];
	readonly nextIndex: number;
}

interface IResolveRecommendedCustomerRarePlanMealBatchParams {
	batchSize: number;
	customerName: TCustomerRareName;
	hiddenBeverages: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	isFamousShop: boolean;
	maxExtraIngredients: number | null;
	maxRating: number;
	maxResults: number;
	onProgress?: (progress: IRecommendedCustomerRarePlanMealProgress) => void;
	popularTrend: IPopularTrend;
	recipeInstance?: Recipe;
	session: IRecommendedCustomerRarePlanMealSession;
	startIndex: number;
}

const instance_cooker = Cooker.getInstance();
const instance_customer = CustomerRare.getInstance();
const instance_recipe = Recipe.getInstance();
const CUSTOMER_RARE_PLAN_RECOMMENDED_COOKER_CATEGORY = '初始';

export function createRecommendedCustomerRarePlanMealSession({
	cookerInstance = instance_cooker,
	customerInstance = instance_customer,
	customerName,
	hiddenDlcs,
}: {
	cookerInstance?: Cooker;
	customerInstance?: CustomerRare;
	customerName: TCustomerRareName;
	hiddenDlcs: ReadonlySet<TDlc>;
}): IRecommendedCustomerRarePlanMealSession {
	const customer = customerInstance.getPropsByName(customerName);
	const recipeTags = customer.positiveTags.toSorted(pinyinSort);
	const beverageTags = customer.beverageTags.toSorted(pinyinSort);
	const cookers = cookerInstance.data
		.filter(
			({ availabilityPaths, category }) =>
				category === CUSTOMER_RARE_PLAN_RECOMMENDED_COOKER_CATEGORY &&
				isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		)
		.map(({ name }) => name)
		.sort(pinyinSort);

	return {
		combos: recipeTags.flatMap<IRecommendedCustomerRarePlanMealCombo>(
			(recipeTag) =>
				beverageTags.flatMap((beverageTag) =>
					cookers.map((cooker) => ({
						beverageTag,
						cooker,
						recipeTag,
					}))
				)
		),
	};
}

export async function resolveRecommendedCustomerRarePlanMealBatch(
	{
		batchSize,
		customerName,
		hiddenBeverages,
		hiddenDlcs,
		hiddenIngredients,
		hiddenRecipes,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		onProgress,
		popularTrend,
		recipeInstance = instance_recipe,
		session,
		startIndex,
	}: IResolveRecommendedCustomerRarePlanMealBatchParams,
	options: ISuggestMealsOptions = {}
) {
	const { combos } = session;
	const safeStartIndex = Math.max(0, startIndex);
	const safeBatchSize = Math.max(1, batchSize);
	const safeMaxResults = Math.max(1, maxResults);
	const batchCombos = combos.slice(
		safeStartIndex,
		safeStartIndex + safeBatchSize
	);
	const resolveSuggestedMeals = (
		suggestedMeals: ReadonlyArray<ISuggestedMeal>,
		index: number
	): IResolvedCustomerRarePlanGroup['meals'] => {
		const combo = batchCombos[index];
		if (combo === undefined) {
			return [];
		}
		const { beverageTag, recipeTag } = combo;

		return suggestedMeals.map((meal, recommendedSetIndex) => ({
			dataIndex: null,
			evaluation: {
				isDarkMatter: recipeInstance.checkDarkMatter(meal.recipe)
					.isDarkMatter,
				price: meal.price,
				rating: meal.rating,
			},
			meal: {
				beverage: meal.beverage,
				hasMystiaCooker: false,
				order: { beverageTag, recipeTag },
				recipe: meal.recipe,
			},
			recommendedSetIndex,
			source: 'recommended' as const,
			visibleIndex:
				(safeStartIndex + index) * safeMaxResults + recommendedSetIndex,
		}));
	};
	const resolvedBatches: Array<IResolvedCustomerRarePlanGroup['meals']> = [];
	await suggestMealsBatch(
		batchCombos.map(({ beverageTag, cooker, recipeTag }) => ({
			cooker,
			currentBeverage: null,
			currentRecipe: null,
			customerName,
			customerOrder: { beverageTag, recipeTag },
			hasMystiaCooker: false,
			hiddenBeverages,
			hiddenDlcs,
			hiddenIngredients,
			hiddenRecipes,
			isFamousShop,
			maxExtraIngredients,
			maxRating,
			maxResults: safeMaxResults,
			popularTrend,
		})),
		{
			...options,
			onResult: ({ index, meals: suggestedMeals }) => {
				const resolvedMeals = resolveSuggestedMeals(
					suggestedMeals,
					index
				);
				resolvedBatches[index] = resolvedMeals;
				const nextIndex = safeStartIndex + index + 1;
				onProgress?.({
					isComplete: nextIndex >= combos.length,
					meals: resolvedMeals,
					nextIndex,
				});
			},
		}
	);
	const meals = resolvedBatches.flat();
	const nextIndex = safeStartIndex + batchCombos.length;

	return { isComplete: nextIndex >= combos.length, meals, nextIndex };
}
