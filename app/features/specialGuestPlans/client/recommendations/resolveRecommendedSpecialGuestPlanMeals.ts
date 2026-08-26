import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import {
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { type TRecommendationSortProfile } from '@/domain/recommendations/sortProfiles';
import type { ISuggestedMeal } from '@/domain/recommendations/types';
import type { IPopularTrend } from '@/domain/trends/types';

import {
	type ISuggestMealsOptions,
	suggestMealsBatch,
} from '@/features/recommendations/client/suggestMeals';
import type { IResolvedSpecialGuestPlanGroup } from '@/features/specialGuestPlans/contracts';

import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

export interface IRecommendedSpecialGuestPlanMealCombo {
	beverageTag: TBeverageTagId;
	cooker: TCookerId;
	foodTag: TFoodTagId;
}

export interface IRecommendedSpecialGuestPlanMealSession {
	readonly combos: ReadonlyArray<IRecommendedSpecialGuestPlanMealCombo>;
}

export interface IRecommendedSpecialGuestPlanMealProgress {
	readonly isComplete: boolean;
	readonly meals: IResolvedSpecialGuestPlanGroup['meals'];
	readonly nextIndex: number;
}

interface IResolveRecommendedSpecialGuestPlanMealBatchParams {
	batchSize: number;
	foodCatalog?: FoodCatalog;
	hiddenBeverages: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenFoods: ReadonlySet<TFoodId>;
	hiddenIngredients: ReadonlySet<TIngredientId>;
	isFamousShop: boolean;
	maxExtraIngredients: number | null;
	maxRating: number;
	maxResults: number;
	onProgress?: (progress: IRecommendedSpecialGuestPlanMealProgress) => void;
	popularTrend: IPopularTrend;
	session: IRecommendedSpecialGuestPlanMealSession;
	sortProfile: TRecommendationSortProfile;
	specialGuest: TSpecialGuestId;
	startIndex: number;
}

const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export function createRecommendedSpecialGuestPlanMealSession({
	cookerCatalog: currentCookerCatalog = cookerCatalog,
	hiddenDlcs,
	specialGuest,
	specialGuestCatalog: currentSpecialGuestCatalog = specialGuestCatalog,
}: {
	cookerCatalog?: CookerCatalog;
	hiddenDlcs: ReadonlySet<TDlc>;
	specialGuest: TSpecialGuestId;
	specialGuestCatalog?: SpecialGuestCatalog;
}): IRecommendedSpecialGuestPlanMealSession {
	const specialGuestRecord =
		currentSpecialGuestCatalog.getPropsById(specialGuest);
	const foodTags = specialGuestRecord.positiveTags
		.filter(
			(tag) =>
				tag !== DYNAMIC_FOOD_TAG_MAP.popularNegative &&
				tag !== DYNAMIC_FOOD_TAG_MAP.popularPositive
		)
		.toSorted((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]));
	const beverageTags = specialGuestRecord.beverageTags.toSorted(numberSort);
	const cookers = currentCookerCatalog.data
		.filter(
			({ availabilityPaths, series }) =>
				series === 0 &&
				isAvailableWithHiddenDlcs(availabilityPaths, hiddenDlcs)
		)
		.toSorted(({ name: a }, { name: b }) => pinyinSort(a, b))
		.map(({ id }) => id);

	return {
		combos: foodTags.flatMap<IRecommendedSpecialGuestPlanMealCombo>(
			(foodTag) =>
				beverageTags.flatMap((beverageTag) =>
					cookers.map((cooker) => ({ beverageTag, cooker, foodTag }))
				)
		),
	};
}

export async function resolveRecommendedSpecialGuestPlanMealBatch(
	{
		batchSize,
		foodCatalog: currentFoodCatalog = foodCatalog,
		hiddenBeverages,
		hiddenDlcs,
		hiddenFoods,
		hiddenIngredients,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		onProgress,
		popularTrend,
		session,
		sortProfile,
		specialGuest,
		startIndex,
	}: IResolveRecommendedSpecialGuestPlanMealBatchParams,
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
	): IResolvedSpecialGuestPlanGroup['meals'] => {
		const combo = batchCombos[index];
		if (combo === undefined) {
			return [];
		}
		const { beverageTag, cooker, foodTag } = combo;

		return suggestedMeals.map((meal, recommendedSetIndex) => ({
			cooker,
			dataIndex: null,
			evaluation: {
				isDarkMatter: currentFoodCatalog.checkDarkMatter(meal.food)
					.isDarkMatter,
				price: meal.price,
				rating: meal.rating,
			},
			meal: {
				beverage: meal.beverage,
				food: meal.food,
				hasMystiaCooker: false,
				order: { beverageTag, foodTag },
			},
			recommendedSetIndex,
			source: 'recommended' as const,
			visibleIndex:
				(safeStartIndex + index) * safeMaxResults + recommendedSetIndex,
		}));
	};
	const resolvedBatches: Array<IResolvedSpecialGuestPlanGroup['meals']> = [];
	await suggestMealsBatch(
		batchCombos.map(({ beverageTag, cooker, foodTag }) => ({
			cooker,
			currentBeverage: null,
			currentFood: null,
			guestOrder: { beverageTag, foodTag },
			hasMystiaCooker: false,
			hiddenBeverages,
			hiddenDlcs,
			hiddenFoods,
			hiddenIngredients,
			isFamousShop,
			maxExtraIngredients,
			maxRating,
			maxResults: safeMaxResults,
			popularTrend,
			sortProfile,
			specialGuest,
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
