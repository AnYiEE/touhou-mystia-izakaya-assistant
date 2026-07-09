import {
	type TBeverageName,
	type TBeverageTag,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TPlace,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type {
	ICustomerRareMeal,
	ICustomerRarePlan,
	IPopularTrend,
	IResolvedCustomerRarePlanGroup,
	TCustomerRarePlanCustomerSort,
	TRatingKey,
} from '@/types';
import { Beverage, Cooker, CustomerRare, Ingredient, Recipe } from '@/utils';
import { pinyinSort } from '@/utilities';

import { evaluateRareSavedMeal } from './evaluateSavedMeals';
import { getVisibleSavedMeals } from './getVisibleSavedMeals';
import { suggestMeals } from '../customer_rare/suggestMeals';

interface IResolveCustomerRarePlanParams {
	beverageInstance?: Beverage;
	cookerInstance?: Cooker;
	customerInstance?: CustomerRare;
	hiddenBeverages?: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients?: ReadonlySet<TIngredientName>;
	hiddenRecipes?: ReadonlySet<TRecipeName>;
	ingredientInstance?: Ingredient;
	isFamousShop: boolean;
	meals: Partial<Record<TCustomerRareName, ICustomerRareMeal[]>>;
	plan: ICustomerRarePlan | null;
	popularTrend: IPopularTrend;
	recipeInstance?: Recipe;
}

interface IRecommendedCustomerRarePlanMealCombo {
	beverageTag: TBeverageTag;
	cooker: TCookerName;
	recipeTag: TRecipeTag;
}

interface IResolveRecommendedCustomerRarePlanMealBatchParams {
	batchSize: number;
	cookerInstance?: Cooker;
	customerInstance?: CustomerRare;
	customerName: TCustomerRareName;
	hiddenBeverages: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	isFamousShop: boolean;
	maxExtraIngredients: number | null;
	maxRating: number;
	maxResults: number;
	popularTrend: IPopularTrend;
	recipeInstance?: Recipe;
	startIndex: number;
}

const instance_beverage = Beverage.getInstance();
const instance_cooker = Cooker.getInstance();
const instance_customer = CustomerRare.getInstance();
const instance_ingredient = Ingredient.getInstance();
const instance_recipe = Recipe.getInstance();
const RATING_SORT_SCORE_MAP = {
	bad: 1,
	exbad: 0,
	exgood: 4,
	good: 3,
	norm: 2,
} satisfies Record<TRatingKey, number>;
const CUSTOMER_RARE_PLAN_RECOMMENDED_COOKER_CATEGORY = '初始';
const customerRarePlanCustomerSortMetaCache = new WeakMap<
	CustomerRare,
	Map<TCustomerRareName, { dlc: TDlc; index: number }>
>();

function getRatingSortScore(rating: TRatingKey | null) {
	return rating === null ? -1 : RATING_SORT_SCORE_MAP[rating];
}

function getCachedValue<Key, Value>(
	cache: Map<Key, Value>,
	key: Key,
	getValue: () => Value
) {
	const cachedValue = cache.get(key);
	if (cachedValue !== undefined) {
		return cachedValue;
	}

	const value = getValue();
	cache.set(key, value);

	return value;
}

function appendCustomerName(
	customerNames: TCustomerRareName[],
	customerName: TCustomerRareName
) {
	if (!customerNames.includes(customerName)) {
		customerNames.push(customerName);
	}
}

function getRegionPlanCustomerNames({
	customerInstance,
	hiddenDlcs,
	plan,
}: {
	customerInstance: CustomerRare;
	hiddenDlcs: ReadonlySet<TDlc>;
	plan: ICustomerRarePlan;
}) {
	const selectedPlaces = new Set<TPlace>(plan.places);
	const excludedCustomers = new Set<TCustomerRareName>(plan.excludes);
	const customerNames: TCustomerRareName[] = [];

	if (selectedPlaces.size > 0) {
		customerInstance.data.forEach((customer) => {
			if (
				customerInstance.isVisibleWithHiddenDlcs(
					customer,
					hiddenDlcs
				) &&
				customer.places.some((place) => selectedPlaces.has(place))
			) {
				appendCustomerName(customerNames, customer.name);
			}
		});
	}

	plan.includes.forEach((customerName) => {
		try {
			const customer = customerInstance.getPropsByName(customerName);
			if (
				customerInstance.isVisibleWithHiddenDlcs(customer, hiddenDlcs)
			) {
				appendCustomerName(customerNames, customerName);
			}
		} catch {
			/* Ignore stale customer names from imported or older data. */
		}
	});

	return customerNames.filter(
		(customerName) => !excludedCustomers.has(customerName)
	);
}

function getManualPlanCustomerNames({
	customerInstance,
	hiddenDlcs,
	plan,
}: {
	customerInstance: CustomerRare;
	hiddenDlcs: ReadonlySet<TDlc>;
	plan: ICustomerRarePlan;
}) {
	return plan.manualCustomers.filter((customerName) => {
		try {
			return customerInstance.isVisibleWithHiddenDlcs(
				customerInstance.getPropsByName(customerName),
				hiddenDlcs
			);
		} catch {
			return false;
		}
	});
}

function getCustomerRarePlanCustomerSortMetaMap(
	customerInstance: CustomerRare
) {
	const cachedMetaMap =
		customerRarePlanCustomerSortMetaCache.get(customerInstance);
	if (cachedMetaMap !== undefined) {
		return cachedMetaMap;
	}

	const metaMap = new Map(
		customerInstance.data.map(({ dlc, name }, index) => [
			name,
			{ dlc, index },
		])
	);
	customerRarePlanCustomerSortMetaCache.set(customerInstance, metaMap);

	return metaMap;
}

function sortCustomerRarePlanCustomerNames({
	customerInstance,
	customerNames,
	customerSort,
}: {
	customerInstance: CustomerRare;
	customerNames: TCustomerRareName[];
	customerSort: TCustomerRarePlanCustomerSort;
}) {
	if (customerSort === 'pinyin-asc-flat') {
		return [...customerNames].sort(pinyinSort);
	}
	if (customerSort === 'pinyin-desc-flat') {
		return [...customerNames].sort((a, b) => pinyinSort(b, a));
	}

	const customerSortMetaMap =
		getCustomerRarePlanCustomerSortMetaMap(customerInstance);

	if (customerSort === 'pinyin-asc' || customerSort === 'pinyin-desc') {
		return [...customerNames].sort((a, b) => {
			const dlcSort =
				(customerSortMetaMap.get(a)?.dlc ?? Number.MAX_SAFE_INTEGER) -
				(customerSortMetaMap.get(b)?.dlc ?? Number.MAX_SAFE_INTEGER);
			if (dlcSort !== 0) {
				return dlcSort;
			}

			return customerSort === 'pinyin-asc'
				? pinyinSort(a, b)
				: pinyinSort(b, a);
		});
	}

	return [...customerNames].sort(
		(a, b) =>
			(customerSortMetaMap.get(a)?.index ?? Number.MAX_SAFE_INTEGER) -
				(customerSortMetaMap.get(b)?.index ??
					Number.MAX_SAFE_INTEGER) || pinyinSort(a, b)
	);
}

function compareOptionalText(a: string | null, b: string | null) {
	if (a === b) {
		return 0;
	}
	if (a === null) {
		return 1;
	}
	if (b === null) {
		return -1;
	}

	return pinyinSort(a, b);
}

function getDisplayedCookerName({
	meal,
	resolveRecipeCooker,
}: {
	meal: IResolvedCustomerRarePlanGroup['meals'][number];
	resolveRecipeCooker: (recipeName: TRecipeName) => TCookerName;
}) {
	const originalCooker = resolveRecipeCooker(meal.meal.recipe.name);

	return meal.evaluation.isDarkMatter || !meal.meal.hasMystiaCooker
		? originalCooker
		: `夜雀${originalCooker}`;
}

function sortResolvedCustomerRarePlanMeals({
	meals,
	resolveRecipeCooker,
}: {
	meals: IResolvedCustomerRarePlanGroup['meals'];
	resolveRecipeCooker: (recipeName: TRecipeName) => TCookerName;
}) {
	const displayedCookerNameMap = new Map(
		meals.map((meal) => [
			meal,
			getDisplayedCookerName({ meal, resolveRecipeCooker }),
		])
	);

	return [...meals].sort((a, b) => {
		const recipeTagSort = compareOptionalText(
			a.meal.order.recipeTag,
			b.meal.order.recipeTag
		);
		if (recipeTagSort !== 0) {
			return recipeTagSort;
		}

		const beverageTagSort = compareOptionalText(
			a.meal.order.beverageTag,
			b.meal.order.beverageTag
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

function createResolvedCustomerRarePlanMealDedupeKey({
	meal,
}: IResolvedCustomerRarePlanGroup['meals'][number]) {
	const sortedExtraIngredients = [...meal.recipe.extraIngredients].sort(
		pinyinSort
	);

	return JSON.stringify([
		meal.recipe.name,
		sortedExtraIngredients,
		meal.beverage,
		meal.hasMystiaCooker,
		meal.order.recipeTag,
		meal.order.beverageTag,
	]);
}

function dedupeResolvedCustomerRarePlanMeals(
	meals: IResolvedCustomerRarePlanGroup['meals']
) {
	const seenKeys = new Set<string>();
	const dedupedMeals: IResolvedCustomerRarePlanGroup['meals'] = [];

	meals.forEach((meal) => {
		const key = createResolvedCustomerRarePlanMealDedupeKey(meal);
		if (seenKeys.has(key)) {
			return;
		}

		seenKeys.add(key);
		dedupedMeals.push(meal);
	});

	return dedupedMeals;
}

export function prepareResolvedCustomerRarePlanMeals({
	meals,
	recipeInstance = instance_recipe,
}: {
	meals: IResolvedCustomerRarePlanGroup['meals'];
	recipeInstance?: Recipe;
}) {
	const recipeCookerCache = new Map<TRecipeName, TCookerName>();
	const resolveRecipeCooker = (recipeName: TRecipeName) =>
		getCachedValue(recipeCookerCache, recipeName, () =>
			recipeInstance.getPropsByName(recipeName, 'cooker')
		);
	const dedupedMeals = dedupeResolvedCustomerRarePlanMeals(meals);

	return sortResolvedCustomerRarePlanMeals({
		meals: dedupedMeals,
		resolveRecipeCooker,
	});
}

function resolveSavedCustomerRarePlanMeals({
	beverageInstance,
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	ingredientInstance,
	isFamousShop,
	meals,
	popularTrend,
	recipeInstance,
}: {
	beverageInstance: Beverage;
	customerName: TCustomerRareName;
	hiddenBeverages?: ReadonlySet<TBeverageName>;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients?: ReadonlySet<TIngredientName>;
	hiddenRecipes?: ReadonlySet<TRecipeName>;
	ingredientInstance: Ingredient;
	isFamousShop: boolean;
	meals: Partial<Record<TCustomerRareName, ICustomerRareMeal[]>>;
	popularTrend: IPopularTrend;
	recipeInstance: Recipe;
}) {
	const beverageDlcCache = new Map<TBeverageName, TDlc>();
	const ingredientDlcCache = new Map<TIngredientName, TDlc>();
	const recipeDlcCache = new Map<TRecipeName, TDlc>();
	const recipeIngredientsCache = new Map<TRecipeName, TIngredientName[]>();
	const resolveBeverageDlc = (beverageName: TBeverageName) =>
		getCachedValue(beverageDlcCache, beverageName, () =>
			beverageInstance.getPropsByName(beverageName, 'dlc')
		);
	const resolveIngredientDlc = (ingredientName: TIngredientName) =>
		getCachedValue(ingredientDlcCache, ingredientName, () =>
			ingredientInstance.getPropsByName(ingredientName, 'dlc')
		);
	const resolveRecipeDlc = (recipeName: TRecipeName) =>
		getCachedValue(recipeDlcCache, recipeName, () =>
			recipeInstance.getPropsByName(recipeName, 'dlc')
		);
	const resolveRecipeIngredients = (recipeName: TRecipeName) =>
		getCachedValue(recipeIngredientsCache, recipeName, () =>
			recipeInstance.getPropsByName(recipeName, 'ingredients')
		);
	const visibleMeals = getVisibleSavedMeals({
		hiddenDlcs,
		...(hiddenBeverages === undefined ? {} : { hiddenBeverages }),
		...(hiddenIngredients === undefined ? {} : { hiddenIngredients }),
		...(hiddenRecipes === undefined ? {} : { hiddenRecipes }),
		meals: meals[customerName],
		resolveDlcRefs: (meal) => {
			try {
				return {
					beverageDlc: resolveBeverageDlc(meal.beverage),
					ingredientDlcs:
						meal.recipe.extraIngredients.map(resolveIngredientDlc),
					recipeDlc: resolveRecipeDlc(meal.recipe.name),
				};
			} catch {
				return null;
			}
		},
		resolveItemRefs: (meal) => {
			try {
				const recipeIngredients = resolveRecipeIngredients(
					meal.recipe.name
				);
				return {
					beverageName: meal.beverage,
					ingredientNames: [
						...recipeIngredients,
						...meal.recipe.extraIngredients,
					],
					recipeName: meal.recipe.name,
				};
			} catch {
				return null;
			}
		},
	});

	return visibleMeals.map(({ dataIndex, meal, visibleIndex }) => ({
		dataIndex,
		evaluation: evaluateRareSavedMeal({
			beverageName: meal.beverage,
			customerName,
			customerOrder: meal.order,
			hasMystiaCooker: meal.hasMystiaCooker,
			isFamousShop,
			popularTrend,
			recipeData: meal.recipe,
		}),
		meal,
		recommendedSetIndex: null,
		source: 'saved' as const,
		visibleIndex,
	}));
}

function getRecommendedCustomerRarePlanMealCombos({
	cookerInstance,
	customerInstance,
	customerName,
	hiddenDlcs,
}: {
	cookerInstance: Cooker;
	customerInstance: CustomerRare;
	customerName: TCustomerRareName;
	hiddenDlcs: ReadonlySet<TDlc>;
}) {
	const customer = customerInstance.getPropsByName(customerName);
	const recipeTags = [...customer.positiveTags].sort(
		pinyinSort
	) as TRecipeTag[];
	const beverageTags = [...customer.beverageTags].sort(
		pinyinSort
	) as TBeverageTag[];
	const cookers = cookerInstance.data
		.filter(
			({ category, dlc }) =>
				category === CUSTOMER_RARE_PLAN_RECOMMENDED_COOKER_CATEGORY &&
				!hiddenDlcs.has(dlc)
		)
		.map(({ name }) => name)
		.sort(pinyinSort);

	return recipeTags.flatMap<IRecommendedCustomerRarePlanMealCombo>(
		(recipeTag) =>
			beverageTags.flatMap((beverageTag) =>
				cookers.map((cooker) => ({ beverageTag, cooker, recipeTag }))
			)
	);
}

export function resolveRecommendedCustomerRarePlanMealBatch({
	batchSize,
	cookerInstance = instance_cooker,
	customerInstance = instance_customer,
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
	recipeInstance = instance_recipe,
	startIndex,
}: IResolveRecommendedCustomerRarePlanMealBatchParams) {
	const combos = getRecommendedCustomerRarePlanMealCombos({
		cookerInstance,
		customerInstance,
		customerName,
		hiddenDlcs,
	});
	const safeStartIndex = Math.max(0, startIndex);
	const safeBatchSize = Math.max(1, batchSize);
	const safeMaxResults = Math.max(1, maxResults);
	const batchCombos = combos.slice(
		safeStartIndex,
		safeStartIndex + safeBatchSize
	);
	const meals = batchCombos.flatMap(
		({ beverageTag, cooker, recipeTag }, index) =>
			suggestMeals({
				cooker,
				currentBeverage: null,
				currentRecipe: null,
				customerName,
				customerOrder: { beverageTag, recipeTag },
				hasMystiaCooker: false,
				hiddenBeverages,
				hiddenIngredients,
				hiddenRecipes,
				isFamousShop,
				maxExtraIngredients,
				maxRating,
				maxResults: safeMaxResults,
				popularTrend,
			}).map((meal, recommendedSetIndex) => ({
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
					(safeStartIndex + index) * safeMaxResults +
					recommendedSetIndex,
			}))
	);
	const nextIndex = safeStartIndex + batchCombos.length;

	return { isComplete: nextIndex >= combos.length, meals, nextIndex };
}

export function resolveCustomerRarePlan({
	beverageInstance = instance_beverage,
	customerInstance = instance_customer,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	ingredientInstance = instance_ingredient,
	isFamousShop,
	meals,
	plan,
	popularTrend,
	recipeInstance = instance_recipe,
}: IResolveCustomerRarePlanParams): IResolvedCustomerRarePlanGroup[] {
	if (plan === null) {
		return [];
	}

	const customerNames = sortCustomerRarePlanCustomerNames({
		customerInstance,
		customerNames:
			plan.mode === 'manual'
				? getManualPlanCustomerNames({
						customerInstance,
						hiddenDlcs,
						plan,
					})
				: getRegionPlanCustomerNames({
						customerInstance,
						hiddenDlcs,
						plan,
					}),
		customerSort: plan.customerSort,
	});

	const groups = customerNames.flatMap<IResolvedCustomerRarePlanGroup>(
		(customerName) => {
			try {
				const customer = customerInstance.getPropsByName(customerName);
				const resolvedMeals =
					plan.mealSource === 'recommended'
						? []
						: resolveSavedCustomerRarePlanMeals({
								beverageInstance,
								customerName,
								hiddenDlcs,
								...(hiddenBeverages === undefined
									? {}
									: { hiddenBeverages }),
								...(hiddenIngredients === undefined
									? {}
									: { hiddenIngredients }),
								...(hiddenRecipes === undefined
									? {}
									: { hiddenRecipes }),
								ingredientInstance,
								isFamousShop,
								meals,
								popularTrend,
								recipeInstance,
							});
				const preparedMeals = prepareResolvedCustomerRarePlanMeals({
					meals: resolvedMeals,
					recipeInstance,
				});

				return [
					{
						customerName,
						customerPlaces: [...customer.places],
						meals: preparedMeals,
						mealSource: plan.mealSource,
						visibleMealCount: preparedMeals.length,
					},
				];
			} catch {
				return [];
			}
		}
	);

	return groups;
}
