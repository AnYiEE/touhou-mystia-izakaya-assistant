import type { IAvailabilityPath } from '@/domain/availability/types';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import { COOKER_TYPE_LABEL_MAP } from '@/domain/data/cookers/cookerFacts';
import type { TCookerTypeId } from '@/domain/data/cookers/types';
import type { TFoodId, TRecipeId } from '@/domain/data/foods/types';
import type {
	TSpecialGuestId,
	TSpecialGuestName,
} from '@/domain/data/guests/special/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TMapLabel } from '@/domain/data/places/types';
import type { TDlc } from '@/domain/data/shared/types';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { evaluateSpecialGuestSavedMeal } from '@/domain/evaluation/evaluateSavedMeal';
import type { TRatingKey } from '@/domain/evaluation/types';
import { getMealCookerSeries } from '@/domain/meals/getMealCookerSeries';
import type { IMealFood, ISpecialGuestSavedMeal } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { getVisibleSavedMeals } from '@/features/catalog/guests/shared/mealPlanning/getVisibleSavedMeals';
import type {
	IResolvedSpecialGuestPlanGroup,
	IResolvedSpecialGuestPlanMeal,
	ISpecialGuestPlan,
	TSpecialGuestPlanGuestSort,
} from '@/features/specialGuestPlans/contracts';

import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

interface IResolveSpecialGuestPlanParams {
	beverageCatalog?: BeverageCatalog;
	cookerCatalog?: CookerCatalog;
	foodCatalog?: FoodCatalog;
	hiddenBeverages?: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenFoods?: ReadonlySet<TFoodId>;
	hiddenIngredients?: ReadonlySet<TIngredientId>;
	ingredientCatalog?: IngredientCatalog;
	isFamousShop: boolean;
	meals: Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>;
	plan: ISpecialGuestPlan | null;
	popularTrend: IPopularTrend;
	specialGuestCatalog?: SpecialGuestCatalog;
}

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();
const EMPTY_BEVERAGE_IDS = new Set<TBeverageId>();
const EMPTY_FOOD_IDS = new Set<TFoodId>();
const EMPTY_INGREDIENT_IDS = new Set<TIngredientId>();
const RATING_SORT_SCORE_MAP = {
	bad: 1,
	exbad: 0,
	exgood: 4,
	good: 3,
	norm: 2,
} satisfies Record<TRatingKey, number>;
const specialGuestPlanSortMetaCache = new WeakMap<
	SpecialGuestCatalog,
	Map<TSpecialGuestId, { dlc: TDlc; index: number; name: TSpecialGuestName }>
>();

function getRatingSortScore(rating: TRatingKey | null) {
	return rating === null ? -1 : RATING_SORT_SCORE_MAP[rating];
}

function appendSpecialGuest(
	specialGuests: TSpecialGuestId[],
	specialGuest: TSpecialGuestId
) {
	if (!specialGuests.includes(specialGuest)) {
		specialGuests.push(specialGuest);
	}
}

function getRegionPlanSpecialGuests({
	hiddenDlcs,
	plan,
	specialGuestCatalog: currentSpecialGuestCatalog,
}: {
	hiddenDlcs: ReadonlySet<TDlc>;
	plan: ISpecialGuestPlan;
	specialGuestCatalog: SpecialGuestCatalog;
}) {
	const selectedMaps = new Set<TMapLabel>(plan.maps);
	const excludedSpecialGuests = new Set(plan.excludes);
	const specialGuests: TSpecialGuestId[] = [];

	if (selectedMaps.size > 0) {
		currentSpecialGuestCatalog.data.forEach((specialGuest) => {
			if (
				currentSpecialGuestCatalog.isVisibleWithHiddenDlcs(
					specialGuest,
					hiddenDlcs
				) &&
				specialGuest.maps.some((map) => selectedMaps.has(map))
			) {
				appendSpecialGuest(specialGuests, specialGuest.id);
			}
		});
	}

	plan.includes.forEach((specialGuest) => {
		const specialGuestRecord =
			currentSpecialGuestCatalog.getPropsById(specialGuest);
		if (
			currentSpecialGuestCatalog.isVisibleWithHiddenDlcs(
				specialGuestRecord,
				hiddenDlcs
			)
		) {
			appendSpecialGuest(specialGuests, specialGuest);
		}
	});

	return specialGuests.filter(
		(specialGuest) => !excludedSpecialGuests.has(specialGuest)
	);
}

function getManualPlanSpecialGuests({
	hiddenDlcs,
	plan,
	specialGuestCatalog: currentSpecialGuestCatalog,
}: {
	hiddenDlcs: ReadonlySet<TDlc>;
	plan: ISpecialGuestPlan;
	specialGuestCatalog: SpecialGuestCatalog;
}) {
	return plan.manualGuests.flatMap((specialGuest) =>
		currentSpecialGuestCatalog.isVisibleWithHiddenDlcs(
			currentSpecialGuestCatalog.getPropsById(specialGuest),
			hiddenDlcs
		)
			? [specialGuest]
			: []
	);
}

function getSpecialGuestPlanSortMetaMap(
	currentSpecialGuestCatalog: SpecialGuestCatalog
) {
	return specialGuestPlanSortMetaCache.getOrInsertComputed(
		currentSpecialGuestCatalog,
		() =>
			new Map(
				currentSpecialGuestCatalog.data.map(
					({ dlc, id, name }, index) => [id, { dlc, index, name }]
				)
			)
	);
}

function sortSpecialGuests({
	specialGuestCatalog: currentSpecialGuestCatalog,
	specialGuestSort,
	specialGuests,
}: {
	specialGuestCatalog: SpecialGuestCatalog;
	specialGuests: TSpecialGuestId[];
	specialGuestSort: TSpecialGuestPlanGuestSort;
}) {
	const sortMetaMap = getSpecialGuestPlanSortMetaMap(
		currentSpecialGuestCatalog
	);
	if (
		specialGuestSort === 'pinyin-asc-flat' ||
		specialGuestSort === 'pinyin-desc-flat'
	) {
		return specialGuests.toSorted((a, b) => {
			const aName = sortMetaMap.get(a)?.name ?? '';
			const bName = sortMetaMap.get(b)?.name ?? '';
			return specialGuestSort === 'pinyin-asc-flat'
				? pinyinSort(aName, bName)
				: pinyinSort(bName, aName);
		});
	}

	if (
		specialGuestSort === 'pinyin-asc' ||
		specialGuestSort === 'pinyin-desc'
	) {
		return specialGuests.toSorted((a, b) => {
			const aMeta = sortMetaMap.get(a);
			const bMeta = sortMetaMap.get(b);
			const dlcSort =
				(aMeta?.dlc ?? Number.MAX_SAFE_INTEGER) -
				(bMeta?.dlc ?? Number.MAX_SAFE_INTEGER);
			if (dlcSort !== 0) {
				return dlcSort;
			}

			return specialGuestSort === 'pinyin-asc'
				? pinyinSort(aMeta?.name ?? '', bMeta?.name ?? '')
				: pinyinSort(bMeta?.name ?? '', aMeta?.name ?? '');
		});
	}

	return specialGuests.toSorted(
		(a, b) =>
			(sortMetaMap.get(a)?.index ?? Number.MAX_SAFE_INTEGER) -
				(sortMetaMap.get(b)?.index ?? Number.MAX_SAFE_INTEGER) ||
			pinyinSort(
				sortMetaMap.get(a)?.name ?? '',
				sortMetaMap.get(b)?.name ?? ''
			)
	);
}

function compareOptionalTags<T extends TBeverageTagId | TFoodTagId>(
	a: T | null,
	b: T | null,
	compareTags: (a: T, b: T) => number
) {
	if (a === b) {
		return 0;
	}
	if (a === null) {
		return 1;
	}
	if (b === null) {
		return -1;
	}

	return compareTags(a, b);
}

function getDisplayedCookerName({
	meal,
	resolveFoodCookerType,
}: {
	meal: IResolvedSpecialGuestPlanMeal;
	resolveFoodCookerType: (mealFood: IMealFood) => TCookerTypeId;
}) {
	const cookerType = resolveFoodCookerType(meal.meal.food);
	if (!(cookerType in COOKER_TYPE_LABEL_MAP)) {
		throw new Error(`Unsupported CookerType ID ${cookerType}.`);
	}
	const cookerTypeLabel = COOKER_TYPE_LABEL_MAP[cookerType];

	return meal.evaluation.isDarkMatter || !meal.meal.hasMystiaCooker
		? cookerTypeLabel
		: `夜雀${cookerTypeLabel}`;
}

function sortResolvedSpecialGuestPlanMeals({
	meals,
	resolveFoodCookerType,
}: {
	meals: IResolvedSpecialGuestPlanGroup['meals'];
	resolveFoodCookerType: (mealFood: IMealFood) => TCookerTypeId;
}) {
	const displayedCookerNameMap = new Map(
		meals.map((meal) => [
			meal,
			getDisplayedCookerName({ meal, resolveFoodCookerType }),
		])
	);

	return meals.toSorted((a, b) => {
		const foodTagSort = compareOptionalTags(
			a.meal.order.foodTag,
			b.meal.order.foodTag,
			(a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
		);
		if (foodTagSort !== 0) {
			return foodTagSort;
		}

		const beverageTagSort = compareOptionalTags(
			a.meal.order.beverageTag,
			b.meal.order.beverageTag,
			numberSort
		);
		if (beverageTagSort !== 0) {
			return beverageTagSort;
		}

		const cookerSort = pinyinSort(
			displayedCookerNameMap.get(a) ?? '',
			displayedCookerNameMap.get(b) ?? ''
		);
		if (cookerSort !== 0) {
			return cookerSort;
		}

		const ratingSort =
			getRatingSortScore(b.evaluation.rating) -
			getRatingSortScore(a.evaluation.rating);
		if (ratingSort !== 0) {
			return ratingSort;
		}

		const priceSort = b.evaluation.price - a.evaluation.price;
		if (priceSort !== 0) {
			return priceSort;
		}

		return a.visibleIndex - b.visibleIndex;
	});
}

function createResolvedSpecialGuestPlanMealDedupeKey({
	cooker,
	meal,
}: IResolvedSpecialGuestPlanMeal) {
	const sortedExtraIngredients = meal.food.extraIngredients.toSorted(
		(a, b) => a - b
	);

	return JSON.stringify([
		cooker,
		meal.food.recipeId,
		sortedExtraIngredients,
		meal.beverage,
		meal.hasMystiaCooker,
		meal.order.foodTag,
		meal.order.beverageTag,
	]);
}

function dedupeResolvedSpecialGuestPlanMeals(
	meals: IResolvedSpecialGuestPlanGroup['meals']
) {
	const seenKeys = new Set<string>();
	const dedupedMeals: IResolvedSpecialGuestPlanGroup['meals'] = [];

	meals.forEach((meal) => {
		const key = createResolvedSpecialGuestPlanMealDedupeKey(meal);
		if (seenKeys.has(key)) {
			return;
		}

		seenKeys.add(key);
		dedupedMeals.push(meal);
	});

	return dedupedMeals;
}

export function prepareResolvedSpecialGuestPlanMeals({
	foodCatalog: currentFoodCatalog = foodCatalog,
	meals,
}: {
	foodCatalog?: FoodCatalog;
	meals: IResolvedSpecialGuestPlanGroup['meals'];
}) {
	const cookerTypeCache = new Map<TRecipeId, TCookerTypeId>();
	const resolveFoodCookerType = (mealFood: IMealFood) =>
		cookerTypeCache.getOrInsertComputed(
			mealFood.recipeId,
			() => currentFoodCatalog.resolveMealFood(mealFood).cookerType
		);
	const dedupedMeals = dedupeResolvedSpecialGuestPlanMeals(meals);

	return sortResolvedSpecialGuestPlanMeals({
		meals: dedupedMeals,
		resolveFoodCookerType,
	});
}

function resolveSavedSpecialGuestPlanMeals({
	beverageCatalog: currentBeverageCatalog,
	cookerCatalog: currentCookerCatalog,
	foodCatalog: currentFoodCatalog,
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	ingredientCatalog: currentIngredientCatalog,
	isFamousShop,
	meals,
	popularTrend,
	specialGuest,
}: {
	beverageCatalog: BeverageCatalog;
	cookerCatalog: CookerCatalog;
	foodCatalog: FoodCatalog;
	hiddenBeverages?: ReadonlySet<TBeverageId>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenFoods?: ReadonlySet<TFoodId>;
	hiddenIngredients?: ReadonlySet<TIngredientId>;
	ingredientCatalog: IngredientCatalog;
	isFamousShop: boolean;
	meals: Partial<Record<TSpecialGuestId, ISpecialGuestSavedMeal[]>>;
	popularTrend: IPopularTrend;
	specialGuest: TSpecialGuestId;
}) {
	const beverageAvailabilityCache = new Map<
		TBeverageId,
		ReadonlyArray<IAvailabilityPath>
	>();
	const foodAvailabilityCache = new Map<
		TFoodId,
		ReadonlyArray<IAvailabilityPath>
	>();
	const ingredientAvailabilityCache = new Map<
		TIngredientId,
		ReadonlyArray<IAvailabilityPath>
	>();
	const resolveBeverageAvailability = (beverage: TBeverageId) =>
		beverageAvailabilityCache.getOrInsertComputed(beverage, () =>
			currentBeverageCatalog.getPropsById(beverage, 'availabilityPaths')
		);
	const resolveFoodAvailability = (food: TFoodId) =>
		foodAvailabilityCache.getOrInsertComputed(food, () =>
			currentFoodCatalog.getPropsById(food, 'availabilityPaths')
		);
	const resolveIngredientAvailability = (ingredient: TIngredientId) =>
		ingredientAvailabilityCache.getOrInsertComputed(ingredient, () =>
			currentIngredientCatalog.getPropsById(
				ingredient,
				'availabilityPaths'
			)
		);
	const visibleMeals = getVisibleSavedMeals({
		hiddenBeverages: hiddenBeverages ?? EMPTY_BEVERAGE_IDS,
		hiddenDlcs,
		hiddenFoods: hiddenFoods ?? EMPTY_FOOD_IDS,
		hiddenIngredients: hiddenIngredients ?? EMPTY_INGREDIENT_IDS,
		meals: meals[specialGuest],
		resolveAvailabilityRefs: (meal) => {
			const { food } = currentFoodCatalog.resolveMealFood(meal.food);
			return {
				beveragePaths: resolveBeverageAvailability(meal.beverage),
				foodPaths: resolveFoodAvailability(food),
				ingredientPaths: meal.food.extraIngredients.map(
					resolveIngredientAvailability
				),
			};
		},
		resolveItemRefs: (meal) => {
			const { baseIngredients, food } =
				currentFoodCatalog.resolveMealFood(meal.food);
			return {
				beverage: meal.beverage,
				food,
				ingredients: [
					...baseIngredients,
					...meal.food.extraIngredients,
				],
			};
		},
	});

	return visibleMeals.map(({ dataIndex, meal, visibleIndex }) => {
		const evaluation = evaluateSpecialGuestSavedMeal({
			beverage: meal.beverage,
			hasMystiaCooker: meal.hasMystiaCooker,
			isFamousShop,
			mealFood: meal.food,
			popularTrend,
			specialGuest,
			specialGuestOrder: meal.order,
		});
		const { cookerType } = currentFoodCatalog.resolveMealFood(meal.food);

		return {
			cooker: currentCookerCatalog.getIdByTypeAndSeries(
				cookerType,
				getMealCookerSeries({
					hasMystiaCooker: meal.hasMystiaCooker,
					isDarkMatter: evaluation.isDarkMatter,
				})
			),
			dataIndex,
			evaluation,
			meal,
			recommendedSetIndex: null,
			source: 'saved' as const,
			visibleIndex,
		};
	});
}

export function resolveSpecialGuestPlan({
	beverageCatalog: currentBeverageCatalog = beverageCatalog,
	cookerCatalog: currentCookerCatalog = cookerCatalog,
	foodCatalog: currentFoodCatalog = foodCatalog,
	hiddenBeverages,
	hiddenDlcs,
	hiddenFoods,
	hiddenIngredients,
	ingredientCatalog: currentIngredientCatalog = ingredientCatalog,
	isFamousShop,
	meals,
	plan,
	popularTrend,
	specialGuestCatalog: currentSpecialGuestCatalog = specialGuestCatalog,
}: IResolveSpecialGuestPlanParams): IResolvedSpecialGuestPlanGroup[] {
	if (plan === null) {
		return [];
	}

	const specialGuests = sortSpecialGuests({
		specialGuestCatalog: currentSpecialGuestCatalog,
		specialGuests:
			plan.mode === 'manual'
				? getManualPlanSpecialGuests({
						hiddenDlcs,
						plan,
						specialGuestCatalog: currentSpecialGuestCatalog,
					})
				: getRegionPlanSpecialGuests({
						hiddenDlcs,
						plan,
						specialGuestCatalog: currentSpecialGuestCatalog,
					}),
		specialGuestSort: plan.guestSort,
	});

	return specialGuests.flatMap<IResolvedSpecialGuestPlanGroup>(
		(specialGuest) => {
			try {
				const specialGuestRecord =
					currentSpecialGuestCatalog.getPropsById(specialGuest);
				const resolvedMeals =
					plan.mealSource === 'recommended'
						? []
						: resolveSavedSpecialGuestPlanMeals({
								beverageCatalog: currentBeverageCatalog,
								cookerCatalog: currentCookerCatalog,
								foodCatalog: currentFoodCatalog,
								hiddenDlcs,
								...(hiddenBeverages === undefined
									? {}
									: { hiddenBeverages }),
								...(hiddenFoods === undefined
									? {}
									: { hiddenFoods }),
								...(hiddenIngredients === undefined
									? {}
									: { hiddenIngredients }),
								ingredientCatalog: currentIngredientCatalog,
								isFamousShop,
								meals,
								popularTrend,
								specialGuest,
							});
				const preparedMeals = prepareResolvedSpecialGuestPlanMeals({
					foodCatalog: currentFoodCatalog,
					meals: resolvedMeals,
				});

				return [
					{
						meals: preparedMeals,
						mealSource: plan.mealSource,
						specialGuest,
						specialGuestMaps: [...specialGuestRecord.maps],
						visibleMealCount: preparedMeals.length,
					},
				];
			} catch {
				return [];
			}
		}
	);
}
