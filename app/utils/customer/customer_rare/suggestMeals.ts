import {
	DARK_MATTER_META_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { ICustomerOrder, IMealRecipe, IPopularTrend } from '@/types';
import {
	type IBoundedRuntimeCacheStats,
	createBoundedRuntimeCache,
} from '@/utilities';
import { Beverage, CustomerRare, Ingredient, Recipe } from '@/utils';
import type { TItemData } from '@/utils/types';

import {
	checkRecipeEasterEgg,
	createMealEvaluator,
	evaluateMeal,
	getIngredientEasterEggTarget,
} from './evaluateMeal';
import {
	type IExactIngredientStateTable,
	type ISuggestMealsExecution,
	type ISuggestMealsYieldScheduler,
	buildExactIngredientStateTable,
	createSuggestMealsExecution,
	getExactIngredientStateTags,
} from './suggestMealsEngine';
import {
	EMPTY_RECOMMENDATION_PRIORITY_METRICS,
	type IRecommendationPriorityMetrics,
	addRecommendationPriorityMetrics,
	compareRecommendationStrictMetrics,
	getRecommendationItemPriority,
} from './suggestMealPriority';

export interface ISuggestedMeal {
	beverage: TBeverageName;
	price: number;
	rating: TRatingKey;
	recipe: IMealRecipe;
}

interface IPlanWeightMetrics {
	readonly ingredientPenalty: number;
	readonly isOverSoftBudget: boolean;
	readonly priority: IRecommendationPriorityMetrics;
	readonly score: number;
}

interface IScoredResult {
	meal: ISuggestedMeal;
	metrics: IPlanWeightMetrics;
	score: number;
}

export interface ISuggestParams {
	readonly cooker: TCookerName | null;
	readonly currentBeverage: TBeverageName | null;
	readonly currentRecipe: IMealRecipe | null;
	readonly customerName: TCustomerRareName;
	readonly customerOrder: ICustomerOrder;
	readonly hasMystiaCooker: boolean;
	readonly hiddenBeverages: ReadonlySet<TBeverageName>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenIngredients: ReadonlySet<TIngredientName>;
	readonly hiddenRecipes: ReadonlySet<TRecipeName>;
	readonly isFamousShop: boolean;
	readonly maxExtraIngredients: number | null;
	readonly maxRating: number;
	readonly maxResults: number;
	readonly popularTrend: IPopularTrend;
}

const SCORE_MAP: Record<TRatingKey, number> = {
	bad: 1,
	exbad: 0,
	exgood: 4,
	good: 3,
	norm: 2,
};

const SUGGEST_INGREDIENT_RESOURCE_WEIGHTS = {
	acquisition: 0.45,
	level: 0.2,
	price: 0.35,
} as const;
const COOPERATIVE_SORT_RUN_SIZE = 128;
const EMPTY_INGREDIENT_NAME_SET: ReadonlySet<TIngredientName> = new Set();

async function stableSortWithExecution<T>(
	values: ReadonlyArray<T>,
	compare: (a: T, b: T) => number,
	execution: ISuggestMealsExecution
) {
	let runs: T[][] = [];

	for (
		let startIndex = 0;
		startIndex < values.length;
		startIndex += COOPERATIVE_SORT_RUN_SIZE
	) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		runs.push(
			values
				.slice(startIndex, startIndex + COOPERATIVE_SORT_RUN_SIZE)
				.sort(compare)
		);
	}

	while (runs.length > 1) {
		const mergedRuns: T[][] = [];
		for (let runIndex = 0; runIndex < runs.length; runIndex += 2) {
			const left = runs[runIndex] ?? [];
			const right = runs[runIndex + 1];
			if (right === undefined) {
				mergedRuns.push(left);
				continue;
			}

			const merged: T[] = [];
			let leftIndex = 0;
			let rightIndex = 0;
			while (leftIndex < left.length && rightIndex < right.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const leftValue = left[leftIndex];
				const rightValue = right[rightIndex];
				if (leftValue === undefined || rightValue === undefined) {
					break;
				}
				if (compare(leftValue, rightValue) <= 0) {
					merged.push(leftValue);
					leftIndex++;
				} else {
					merged.push(rightValue);
					rightIndex++;
				}
			}
			while (leftIndex < left.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const value = left[leftIndex++];
				if (value !== undefined) {
					merged.push(value);
				}
			}
			while (rightIndex < right.length) {
				const checkpointPromise = execution.checkpoint();
				if (checkpointPromise !== undefined) {
					await checkpointPromise;
				}
				const value = right[rightIndex++];
				if (value !== undefined) {
					merged.push(value);
				}
			}
			mergedRuns.push(merged);
		}
		runs = mergedRuns;
	}

	return runs[0] ?? [];
}

function computeMaxEase(easeMap: ReadonlyMap<string, number>) {
	return [...easeMap.values()].reduce(
		(max, ease) => (ease !== Infinity && ease > max ? ease : max),
		0
	);
}

function buildEaseMap<T extends string>(
	items: ReadonlyArray<{ name: T }>,
	priorityMap: ReadonlyMap<T, IRecommendationPriorityMetrics>
): { easeMap: Map<T, number>; maxEase: number } {
	const easeMap = new Map<T, number>(
		items.map((item): [T, number] => [
			item.name,
			priorityMap.get(item.name)?.acquisitionEase ?? 0,
		])
	);

	return { easeMap, maxEase: computeMaxEase(easeMap) };
}

function normalizeEase(
	name: string,
	easeMap: ReadonlyMap<string, number>,
	maxEase: number
) {
	const ease = easeMap.get(name) ?? 0;

	if (ease === Infinity) {
		return 1;
	}
	if (ease <= 0 || maxEase <= 0) {
		return 0.5;
	}

	return ease / maxEase;
}

function normalizeAcquisitionEase(ease: number, maxEase: number) {
	if (ease === Infinity) {
		return 1;
	}
	if (ease <= 0 || maxEase <= 0) {
		return 0.5;
	}

	return ease / maxEase;
}

export interface ISuggestIngredientPenaltyContext {
	readonly ingredientEaseMap: ReadonlyMap<TIngredientName, number>;
	readonly maxIngredientEase: number;
	readonly maxIngredientLevel: number;
	readonly maxIngredientPrice: number;
	readonly minIngredientLevel: number;
	readonly minIngredientPrice: number;
}

export interface ISuggestIngredientResourcePenalty {
	readonly acquisition: number;
	readonly level: number;
	readonly price: number;
	readonly total: number;
}

export function getSuggestIngredientAcquisitionPenalty(
	name: TIngredientName,
	{ ingredientEaseMap, maxIngredientEase }: ISuggestIngredientPenaltyContext
) {
	return 30 * (1 - normalizeEase(name, ingredientEaseMap, maxIngredientEase));
}

function normalizeResourceMetric(value: number, min: number, max: number) {
	return max <= min ? 0 : (value - min) / (max - min);
}

export function getSuggestIngredientResourcePenalty(
	name: TIngredientName,
	context: ISuggestIngredientPenaltyContext
): ISuggestIngredientResourcePenalty {
	const { level: ingredientLevel, price: ingredientPrice } =
		Ingredient.getInstance().getPropsByName(name);
	const acquisition =
		getSuggestIngredientAcquisitionPenalty(name, context) / 30;
	const level = normalizeResourceMetric(
		ingredientLevel,
		context.minIngredientLevel,
		context.maxIngredientLevel
	);
	const price = normalizeResourceMetric(
		ingredientPrice,
		context.minIngredientPrice,
		context.maxIngredientPrice
	);

	return {
		acquisition,
		level,
		price,
		total:
			acquisition * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.acquisition +
			price * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.price +
			level * SUGGEST_INGREDIENT_RESOURCE_WEIGHTS.level,
	};
}

function buildSuggestIngredientPenaltyContext(
	ingredients: TItemData<Ingredient>,
	priorityMap: ReadonlyMap<TIngredientName, IRecommendationPriorityMetrics>
): ISuggestIngredientPenaltyContext {
	const { easeMap, maxEase } = buildEaseMap<TIngredientName>(
		ingredients,
		priorityMap
	);
	let maxIngredientLevel = -Infinity;
	let maxIngredientPrice = -Infinity;
	let minIngredientLevel = Infinity;
	let minIngredientPrice = Infinity;

	for (const { level, price } of ingredients) {
		maxIngredientLevel = Math.max(maxIngredientLevel, level);
		maxIngredientPrice = Math.max(maxIngredientPrice, price);
		minIngredientLevel = Math.min(minIngredientLevel, level);
		minIngredientPrice = Math.min(minIngredientPrice, price);
	}

	if (ingredients.length === 0) {
		maxIngredientLevel = 0;
		maxIngredientPrice = 0;
		minIngredientLevel = 0;
		minIngredientPrice = 0;
	}

	return {
		ingredientEaseMap: easeMap,
		maxIngredientEase: maxEase,
		maxIngredientLevel,
		maxIngredientPrice,
		minIngredientLevel,
		minIngredientPrice,
	};
}

export function createSuggestIngredientPenaltyContext({
	customerName,
	hiddenDlcs,
	hiddenIngredients,
}: {
	customerName: TCustomerRareName;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
}) {
	const instance_customer = CustomerRare.getInstance();
	const instance_ingredient = Ingredient.getInstance();
	const { dlc: customerDlc, places: customerPlaces } =
		instance_customer.getPropsByName(customerName);
	const ingredientPriorityMap = new Map<
		TIngredientName,
		IRecommendationPriorityMetrics
	>();
	const ingredients = instance_ingredient.data.filter((item) => {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			customerDlc,
			customerPlaces,
			hiddenDlcs,
		});
		if (priority !== null) {
			ingredientPriorityMap.set(item.name, priority);
		}

		return (
			priority !== null &&
			!instance_ingredient.blockedIngredients.has(item.name) &&
			!instance_ingredient.blockedLevels.has(item.level) &&
			!hiddenIngredients.has(item.name) &&
			!item.tags.some((tag) => instance_ingredient.blockedTags.has(tag))
		);
	});

	return buildSuggestIngredientPenaltyContext(
		ingredients,
		ingredientPriorityMap
	);
}

function createSuggestContext({
	cooker: selectedCooker,
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
}: ISuggestParams) {
	const instance_beverage = Beverage.getInstance();
	const instance_customer = CustomerRare.getInstance();
	const instance_ingredient = Ingredient.getInstance();
	const instance_recipe = Recipe.getInstance();

	const {
		beverageTags: customerBeverageTags,
		dlc: customerDlc,
		enduranceLimit: customerEnduranceLimit,
		negativeTags: customerNegativeTags,
		places: customerPlaces,
		positiveTags: customerPositiveTags,
		price: customerPrice,
	} = instance_customer.getPropsByName(customerName);

	const [, budgetSoftMax] = customerPrice;
	const budgetMax = Math.ceil(budgetSoftMax * customerEnduranceLimit);

	const beveragePriorityMap = new Map<
		TBeverageName,
		IRecommendationPriorityMetrics
	>();
	const ingredientPriorityMap = new Map<
		TIngredientName,
		IRecommendationPriorityMetrics
	>();
	const recipePriorityMap = new Map<
		TRecipeName,
		IRecommendationPriorityMetrics
	>();

	for (const item of instance_beverage.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			customerDlc,
			customerPlaces,
			hiddenDlcs,
		});
		if (priority !== null) {
			beveragePriorityMap.set(item.name, priority);
		}
	}
	for (const item of instance_ingredient.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			customerDlc,
			customerPlaces,
			hiddenDlcs,
		});
		if (priority !== null) {
			ingredientPriorityMap.set(item.name, priority);
		}
	}
	for (const item of instance_recipe.data) {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			customerDlc,
			customerPlaces,
			hiddenDlcs,
		});
		if (priority !== null) {
			recipePriorityMap.set(item.name, priority);
		}
	}

	const baseGameBeverages = instance_beverage.data.filter(
		({ name }) =>
			beveragePriorityMap.has(name) && !hiddenBeverages.has(name)
	);

	const unavailableRecipeIngredientNames = new Set(
		instance_ingredient.data
			.filter(
				({ name }) =>
					!ingredientPriorityMap.has(name) ||
					hiddenIngredients.has(name)
			)
			.map(({ name }) => name)
	);

	const baseGameRecipes = instance_recipe.data.filter(
		({ cooker, ingredients, name }) =>
			recipePriorityMap.has(name) &&
			!instance_recipe.blockedRecipes.has(name) &&
			!hiddenRecipes.has(name) &&
			!ingredients.some((ingredient) =>
				unavailableRecipeIngredientNames.has(ingredient)
			) &&
			(selectedCooker === null || cooker === selectedCooker)
	);

	const baseGameIngredients = instance_ingredient.data.filter(
		({ level, name, tags }) =>
			ingredientPriorityMap.has(name) &&
			!instance_ingredient.blockedIngredients.has(name) &&
			!instance_ingredient.blockedLevels.has(level) &&
			!hiddenIngredients.has(name) &&
			!tags.some((tag) => instance_ingredient.blockedTags.has(tag))
	);

	const ingredientPenaltyContext = buildSuggestIngredientPenaltyContext(
		baseGameIngredients,
		ingredientPriorityMap
	);
	const { maxEase: maxBeverageEase } = buildEaseMap(
		baseGameBeverages,
		beveragePriorityMap
	);
	const recipeAggregatePriorityMap = new Map<
		TRecipeName,
		IRecommendationPriorityMetrics
	>();
	for (const recipe of baseGameRecipes) {
		let aggregate = recipePriorityMap.get(recipe.name);
		if (aggregate === undefined) {
			continue;
		}

		const ingredientEase: number[] = [];
		for (const ingredientName of recipe.ingredients) {
			const ingredientPriority =
				ingredientPriorityMap.get(ingredientName);
			if (ingredientPriority === undefined) {
				aggregate = undefined;
				break;
			}
			aggregate = addRecommendationPriorityMetrics(
				aggregate,
				ingredientPriority
			);
			ingredientEase.push(
				normalizeAcquisitionEase(
					ingredientPriority.acquisitionEase,
					ingredientPenaltyContext.maxIngredientEase
				)
			);
		}
		if (aggregate !== undefined) {
			recipeAggregatePriorityMap.set(recipe.name, {
				...aggregate,
				acquisitionEase:
					ingredientEase.length === 0
						? 0.5
						: Math.min(...ingredientEase),
			});
		}
	}

	return {
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		beveragePriorityMap,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerDlc,
		customerNegativeTags,
		customerPlaces,
		customerPositiveTags,
		fixedItemPriorityMap: new WeakMap<
			object,
			IRecommendationPriorityMetrics
		>(),
		fixedRecipeAggregatePriorityMap: new Map<
			TRecipeName,
			IRecommendationPriorityMetrics
		>(),
		hiddenDlcs,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		instance_beverage,
		instance_ingredient,
		instance_recipe,
		maxBeverageEase,
		recipeAggregatePriorityMap,
		recipePriorityMap,
	};
}

type TSuggestContext = ReturnType<typeof createSuggestContext>;

function getSuggestContextLogicalWeight(context: TSuggestContext) {
	return (
		context.baseGameBeverages.length +
		context.baseGameIngredients.length +
		context.baseGameRecipes.length +
		context.beveragePriorityMap.size +
		context.ingredientPriorityMap.size +
		context.recipeAggregatePriorityMap.size +
		context.recipePriorityMap.size
	);
}

interface IMealPriorityOptions {
	readonly fixedExtraIngredients: ReadonlySet<TIngredientName>;
	readonly isBeverageFixed: boolean;
	readonly isRecipeFixed: boolean;
}

function getFixedItemPriority(
	item: {
		readonly availabilityPaths: TItemData<Ingredient>[number]['availabilityPaths'];
		readonly dlc: TDlc;
	},
	context: TSuggestContext
) {
	const cached = context.fixedItemPriorityMap.get(item);
	if (cached !== undefined) {
		return cached;
	}

	const priority = getRecommendationItemPriority({
		allowFishingFallback: true,
		availabilityPaths: item.availabilityPaths,
		contentDlc: item.dlc,
		customerDlc: context.customerDlc,
		customerPlaces: context.customerPlaces,
		hiddenDlcs: context.hiddenDlcs,
	});
	if (priority !== null) {
		context.fixedItemPriorityMap.set(item, priority);
	}

	return priority;
}

function requireItemPriority(
	item: {
		readonly availabilityPaths: TItemData<Ingredient>[number]['availabilityPaths'];
		readonly dlc: TDlc;
	},
	context: TSuggestContext,
	isFixed: boolean,
	autoPriority?: IRecommendationPriorityMetrics
) {
	if (!isFixed && autoPriority !== undefined) {
		return autoPriority;
	}
	const priority = isFixed
		? getFixedItemPriority(item, context)
		: getRecommendationItemPriority({
				allowFishingFallback: false,
				availabilityPaths: item.availabilityPaths,
				contentDlc: item.dlc,
				customerDlc: context.customerDlc,
				customerPlaces: context.customerPlaces,
				hiddenDlcs: context.hiddenDlcs,
			});
	if (priority === null) {
		throw new Error('推荐候选缺少合法的可获取路径');
	}

	return priority;
}

function checkFixedSelectionsAvailable(
	{ currentBeverage, currentRecipe }: ISuggestParams,
	context: TSuggestContext
) {
	if (currentBeverage !== null) {
		const beverage =
			context.instance_beverage.getPropsByName(currentBeverage);
		if (getFixedItemPriority(beverage, context) === null) {
			return false;
		}
	}
	if (currentRecipe === null) {
		return true;
	}

	const recipe = context.instance_recipe.getPropsByName(currentRecipe.name);
	if (getFixedItemPriority(recipe, context) === null) {
		return false;
	}
	for (const ingredientName of [
		...recipe.ingredients,
		...currentRecipe.extraIngredients,
	]) {
		const ingredient =
			context.instance_ingredient.getPropsByName(ingredientName);
		if (getFixedItemPriority(ingredient, context) === null) {
			return false;
		}
	}

	return true;
}

function getRecipeAggregatePriority(
	recipe: TItemData<Recipe>[number],
	context: TSuggestContext,
	isFixed: boolean
) {
	if (!isFixed) {
		const automatic = context.recipeAggregatePriorityMap.get(recipe.name);
		if (automatic !== undefined) {
			return automatic;
		}
	}

	const cached = context.fixedRecipeAggregatePriorityMap.get(recipe.name);
	if (cached !== undefined) {
		return cached;
	}

	let aggregate = requireItemPriority(
		recipe,
		context,
		isFixed,
		context.recipePriorityMap.get(recipe.name)
	);
	const ingredientEase: number[] = [];
	for (const ingredientName of recipe.ingredients) {
		const ingredient =
			context.instance_ingredient.getPropsByName(ingredientName);
		const ingredientPriority = requireItemPriority(
			ingredient,
			context,
			isFixed,
			context.ingredientPriorityMap.get(ingredientName)
		);
		aggregate = addRecommendationPriorityMetrics(
			aggregate,
			ingredientPriority
		);
		ingredientEase.push(
			normalizeAcquisitionEase(
				ingredientPriority.acquisitionEase,
				context.ingredientPenaltyContext.maxIngredientEase
			)
		);
	}

	const result = {
		...aggregate,
		acquisitionEase:
			ingredientEase.length === 0 ? 0.5 : Math.min(...ingredientEase),
	};
	if (isFixed) {
		context.fixedRecipeAggregatePriorityMap.set(recipe.name, result);
	}

	return result;
}

function getMealPriority(
	meal: ISuggestedMeal,
	context: TSuggestContext,
	{
		fixedExtraIngredients,
		isBeverageFixed,
		isRecipeFixed,
	}: IMealPriorityOptions
) {
	const recipe = context.instance_recipe.getPropsByName(meal.recipe.name);
	const beverage = context.instance_beverage.getPropsByName(meal.beverage);
	const recipePriority = getRecipeAggregatePriority(
		recipe,
		context,
		isRecipeFixed
	);
	const beveragePriority = requireItemPriority(
		beverage,
		context,
		isBeverageFixed,
		context.beveragePriorityMap.get(beverage.name)
	);
	let priority = addRecommendationPriorityMetrics(
		EMPTY_RECOMMENDATION_PRIORITY_METRICS,
		recipePriority
	);
	priority = addRecommendationPriorityMetrics(priority, beveragePriority);

	for (const ingredientName of meal.recipe.extraIngredients) {
		const ingredient =
			context.instance_ingredient.getPropsByName(ingredientName);
		priority = addRecommendationPriorityMetrics(
			priority,
			requireItemPriority(
				ingredient,
				context,
				fixedExtraIngredients.has(ingredientName),
				context.ingredientPriorityMap.get(ingredient.name)
			)
		);
	}

	const beverageEase = normalizeAcquisitionEase(
		beveragePriority.acquisitionEase,
		context.maxBeverageEase
	);

	return {
		...priority,
		acquisitionEase: recipePriority.acquisitionEase + beverageEase,
	};
}

const SUGGEST_CONTEXT_CACHE_MAX_ENTRIES = 1000;
const SUGGEST_CONTEXT_CACHE_MAX_WEIGHT = 500_000;
const suggestContextCache = createBoundedRuntimeCache<string, TSuggestContext>(
	SUGGEST_CONTEXT_CACHE_MAX_ENTRIES,
	{
		getWeight: getSuggestContextLogicalWeight,
		maxWeight: SUGGEST_CONTEXT_CACHE_MAX_WEIGHT,
	}
);

function buildSuggestContextCacheKey({
	cooker,
	customerName,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
}: ISuggestParams) {
	return [
		cooker ?? '',
		customerName,
		[...hiddenBeverages].sort().join(','),
		[...hiddenDlcs].sort().join(','),
		[...hiddenIngredients].sort().join(','),
		[...hiddenRecipes].sort().join(','),
	].join('|');
}

function getSuggestContext(params: ISuggestParams) {
	const cacheKey = buildSuggestContextCacheKey(params);
	const cached = suggestContextCache.get(cacheKey);

	if (cached !== undefined) {
		return cached;
	}

	const context = createSuggestContext(params);
	suggestContextCache.set(cacheKey, context);

	return context;
}

function buildRelevantTagSet(
	customerPositiveTags: ReadonlyArray<TRecipeTag>,
	customerNegativeTags: ReadonlyArray<TRecipeTag>,
	orderRecipeTag: TRecipeTag | null
) {
	const keepTags = new Set<string>(customerPositiveTags);

	if (orderRecipeTag !== null) {
		keepTags.add(orderRecipeTag);
	}

	Object.entries(Recipe.tagCoverMap).forEach(([coverTag, coveredTag]) => {
		if (
			(customerNegativeTags as ReadonlyArray<string>).includes(coverTag)
		) {
			keepTags.add(coveredTag);
		}
		if (
			(customerNegativeTags as ReadonlyArray<string>).includes(coveredTag)
		) {
			keepTags.add(coverTag);
		}
	});

	return keepTags;
}

function filterRelevantIngredients(
	baseGameIngredients: TItemData<Ingredient>,
	customerPositiveTags: ReadonlyArray<TRecipeTag>,
	customerNegativeTags: ReadonlyArray<TRecipeTag>,
	orderRecipeTag: TRecipeTag | null
): TItemData<Ingredient> {
	const keepTags = buildRelevantTagSet(
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	return baseGameIngredients.filter(({ tags }) =>
		tags.some((tag) => keepTags.has(tag))
	);
}

interface IBeverageTagGroup {
	members: Array<{ name: TBeverageName; price: number }>;
	tags: TBeverageTag[];
}

function buildRecipeSuitabilityList(
	instance_recipe: Recipe,
	baseGameRecipes: TItemData<Recipe>,
	customerName: TCustomerRareName,
	customerPositiveTags: ReadonlyArray<TRecipeTag>,
	customerNegativeTags: ReadonlyArray<TRecipeTag>,
	popularTrend: IPopularTrend,
	isFamousShop: boolean
) {
	const list = baseGameRecipes.map((recipe) => {
		const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
			recipe.ingredients,
			[],
			recipe.positiveTags,
			[],
			popularTrend
		);
		const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
			composedRecipeTags,
			popularTrend,
			isFamousShop
		);

		const { score: easterEggScore } = checkRecipeEasterEgg({
			currentCustomerName: customerName,
			currentRecipeName: recipe.name,
		});

		const suitability =
			easterEggScore > 0
				? Infinity
				: easterEggScore < 0
					? -Infinity
					: instance_recipe.getCustomerSuitability(
							recipeTagsWithTrend,
							customerPositiveTags,
							customerNegativeTags
						).suitability;

		return { recipe, recipeTagsWithTrend, suitability };
	});

	list.sort((a, b) => b.suitability - a.suitability);

	return list;
}

function buildBeverageTagGroups(beverages: TItemData<Beverage>) {
	const groups = new Map<string, IBeverageTagGroup>();

	beverages.forEach(({ name, price, tags }) => {
		const tagKey = [...tags].sort().join(',');
		let group = groups.get(tagKey);
		if (group === undefined) {
			group = { members: [], tags };
			groups.set(tagKey, group);
		}
		group.members.push({ name, price });
	});

	return groups;
}

function comparePlanWeightMetrics(
	a: IPlanWeightMetrics,
	b: IPlanWeightMetrics
) {
	return (
		b.score - a.score ||
		compareRecommendationStrictMetrics(a.priority, b.priority) ||
		Number(a.isOverSoftBudget) - Number(b.isOverSoftBudget) ||
		b.priority.acquisitionEase - a.priority.acquisitionEase ||
		a.ingredientPenalty - b.ingredientPenalty
	);
}

function checkSameDiversityLayer(
	left: IPlanWeightMetrics,
	right: IPlanWeightMetrics
) {
	return (
		left.score === right.score &&
		left.priority.contentMismatchCount ===
			right.priority.contentMismatchCount &&
		left.priority.pathMismatchCount === right.priority.pathMismatchCount
	);
}

interface IResultDiversityOptions {
	readonly isBeverageFixed: boolean;
	readonly isRecipeFixed: boolean;
}

function findDiverseResultIndex(
	results: ReadonlyArray<IScoredResult>,
	seenBeverages: ReadonlySet<TBeverageName>,
	seenRecipes: ReadonlySet<TRecipeName>,
	{ isBeverageFixed, isRecipeFixed }: IResultDiversityOptions
) {
	const highestLayer = results[0]?.metrics;
	let newBeverageIndex = -1;
	let newRecipeIndex = -1;

	for (const [index, { meal, metrics }] of results.entries()) {
		if (
			highestLayer === undefined ||
			!checkSameDiversityLayer(metrics, highestLayer)
		) {
			break;
		}

		const isNewBeverage = !seenBeverages.has(meal.beverage);
		const isNewRecipe = !seenRecipes.has(meal.recipe.name);

		if (isRecipeFixed) {
			if (isNewBeverage) {
				return index;
			}
			continue;
		}
		if (isBeverageFixed) {
			if (isNewRecipe) {
				return index;
			}
			continue;
		}
		if (isNewRecipe && isNewBeverage) {
			return index;
		}
		if (isNewRecipe && newRecipeIndex === -1) {
			newRecipeIndex = index;
		}
		if (isNewBeverage && newBeverageIndex === -1) {
			newBeverageIndex = index;
		}
	}

	return newRecipeIndex === -1
		? newBeverageIndex === -1
			? 0
			: newBeverageIndex
		: newRecipeIndex;
}

async function selectScoredResults(
	results: IScoredResult[],
	maxResults: number,
	keyFn: (meal: ISuggestedMeal) => string,
	diversityOptions: IResultDiversityOptions,
	execution: ISuggestMealsExecution
) {
	const sortedResults = await stableSortWithExecution(
		results,
		(a, b) => comparePlanWeightMetrics(a.metrics, b.metrics),
		execution
	);

	const seen = new Set<string>();
	const dedupedResults: IScoredResult[] = [];

	for (const result of sortedResults) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const { meal } = result;
		const key = keyFn(meal);

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		dedupedResults.push(result);
	}

	const remainingResults = [...dedupedResults];
	const seenBeverages = new Set<TBeverageName>();
	const seenRecipes = new Set<TRecipeName>();
	const out: ISuggestedMeal[] = [];

	while (out.length < maxResults && remainingResults.length > 0) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const resultIndex =
			out.length === 0
				? 0
				: findDiverseResultIndex(
						remainingResults,
						seenBeverages,
						seenRecipes,
						diversityOptions
					);
		const [result] = remainingResults.splice(resultIndex, 1);
		if (result === undefined) {
			break;
		}

		out.push(result.meal);
		seenBeverages.add(result.meal.beverage);
		seenRecipes.add(result.meal.recipe.name);
	}

	return out;
}

interface IRecipeIngredientSummary {
	readonly currentIngredients: ReadonlyArray<TIngredientName>;
	readonly extraIngredients: ReadonlyArray<TIngredientName>;
	readonly ingredientPenalty: number;
	readonly priority: IRecommendationPriorityMetrics;
	readonly recipeTagsWithTrend: ReadonlyArray<TRecipeTag>;
}

const EXACT_INGREDIENT_STATE_CACHE_MAX_ENTRIES = 4000;
const EXACT_INGREDIENT_STATE_CACHE_MAX_STATES = 2_000_000;
const RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_ENTRIES = 20_000;
const RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_SUMMARIES = 300_000;
const exactIngredientStateCache = createBoundedRuntimeCache<
	string,
	IExactIngredientStateTable
>(EXACT_INGREDIENT_STATE_CACHE_MAX_ENTRIES, {
	getWeight: (table) => table.stateCount,
	maxWeight: EXACT_INGREDIENT_STATE_CACHE_MAX_STATES,
});
const recipeIngredientSummaryCache = createBoundedRuntimeCache<
	string,
	ReadonlyArray<ReadonlyArray<IRecipeIngredientSummary>>
>(RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_ENTRIES, {
	getWeight: (layers) =>
		layers.reduce((total, layer) => total + layer.length, 0),
	maxWeight: RECIPE_INGREDIENT_SUMMARY_CACHE_MAX_SUMMARIES,
});
const exactIngredientStateTableIds = new WeakMap<
	IExactIngredientStateTable,
	number
>();
let nextExactIngredientStateTableId = 1;

function getExactIngredientStateTableId(table: IExactIngredientStateTable) {
	const cached = exactIngredientStateTableIds.get(table);
	if (cached !== undefined) {
		return cached;
	}

	const id = nextExactIngredientStateTableId++;
	exactIngredientStateTableIds.set(table, id);

	return id;
}

function buildExactIngredientStateCacheKey({
	candidates,
	maxCount,
	orderSensitiveTags = new Set<TRecipeTag>(),
}: {
	candidates: ReadonlyArray<{
		effectKeys: ReadonlyArray<string>;
		name: TIngredientName;
		penalty: number;
		priority: IRecommendationPriorityMetrics;
		tags: ReadonlyArray<string>;
	}>;
	maxCount: number;
	orderSensitiveTags?: ReadonlySet<TRecipeTag>;
}) {
	return [
		maxCount.toString(),
		[...orderSensitiveTags].join(','),
		candidates
			.map(
				({ effectKeys, name, penalty, priority, tags }) =>
					`${name}:${penalty}:${priority.contentMismatchCount}:${priority.pathMismatchCount}:${priority.primaryPlaceMismatchCount}:${priority.customerPlacesMismatchCount}:${priority.unknownSourceCount}:${priority.lateSourceCount}:${priority.maxLateTierDistance}:${priority.totalLateTierDistance}:${priority.acquisitionEase}:${tags.join(',')}:${effectKeys.join(',')}`
			)
			.join('|'),
	].join('::');
}

async function getExactIngredientStateTable(
	params: Parameters<typeof buildExactIngredientStateTable>[0],
	execution: ISuggestMealsExecution
) {
	const cacheKey = buildExactIngredientStateCacheKey(params);
	const cached = exactIngredientStateCache.get(cacheKey);

	if (cached !== undefined) {
		return cached;
	}

	const table = await buildExactIngredientStateTable(params, execution);
	execution.throwIfAborted();
	exactIngredientStateCache.set(cacheKey, table);

	return table;
}

async function getRecipeIngredientSummaries({
	execution,
	extraSlots,
	isFamousShop,
	popularTrend,
	recipeIngredients,
	recipeName,
	recipeTagsBase,
	stateTable,
}: {
	execution: ISuggestMealsExecution;
	extraSlots: number;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	recipeName: TRecipeName;
	recipeTagsBase: ReadonlyArray<TRecipeTag>;
	stateTable: IExactIngredientStateTable;
}) {
	const cacheKey = [
		getExactIngredientStateTableId(stateTable).toString(),
		extraSlots.toString(),
		recipeName,
		recipeIngredients.join(','),
		recipeTagsBase.join(','),
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
		isFamousShop ? '1' : '0',
	].join('|');
	const cached = recipeIngredientSummaryCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	const layers: IRecipeIngredientSummary[][] = Array.from(
		{ length: extraSlots + 1 },
		() => []
	);
	for (let count = 1; count <= extraSlots; count++) {
		const summaries = layers[count];
		if (summaries === undefined) {
			continue;
		}

		for (const state of stateTable.layers[count] ?? []) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const tagSet = new Set<TRecipeTag>(recipeTagsBase);
			for (const tag of getExactIngredientStateTags(
				stateTable,
				state
			) as ReadonlyArray<TRecipeTag>) {
				tagSet.add(tag);
			}

			Recipe.applyLargePartition(
				tagSet,
				recipeIngredients.length + state.count,
				popularTrend
			);
			Recipe.applyTagCovers(tagSet, popularTrend);
			Recipe.applyFamousShop(tagSet, isFamousShop);
			Recipe.applyPopularTrend(tagSet, popularTrend);

			summaries.push({
				currentIngredients: [
					...recipeIngredients,
					...state.extraIngredients,
				],
				extraIngredients: state.extraIngredients,
				ingredientPenalty: state.ingredientPenalty,
				priority: state.priority,
				recipeTagsWithTrend: [...tagSet],
			});
		}
	}

	execution.throwIfAborted();
	recipeIngredientSummaryCache.set(cacheKey, layers);

	return layers;
}

async function findBestExtraIngredients({
	baseGameIngredients,
	beverageTags,
	customerBeverageTags,
	customerName,
	customerNegativeTags,
	customerOrder,
	customerPositiveTags,
	excludedExtraIngredients,
	execution,
	extraSlots,
	hasMystiaCooker,
	ingredientPenaltyContext,
	ingredientPriorityMap,
	isFamousShop,
	maxRating,
	popularTrend,
	recipeIngredients,
	recipeName,
	recipeNegativeTags,
	recipeTagsBase,
}: {
	baseGameIngredients: TItemData<Ingredient>;
	beverageTags: TBeverageTag[];
	customerBeverageTags: TBeverageTag[];
	customerName: TCustomerRareName;
	customerNegativeTags: ReadonlyArray<TRecipeTag>;
	customerOrder: ICustomerOrder;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	excludedExtraIngredients: ReadonlyArray<TIngredientName>;
	execution: ISuggestMealsExecution;
	extraSlots: number;
	hasMystiaCooker: boolean;
	ingredientPenaltyContext: ISuggestIngredientPenaltyContext;
	ingredientPriorityMap: ReadonlyMap<
		TIngredientName,
		IRecommendationPriorityMetrics
	>;
	isFamousShop: boolean;
	maxRating: number;
	popularTrend: IPopularTrend;
	recipeIngredients: TIngredientName[];
	recipeName: TRecipeName;
	recipeNegativeTags: ReadonlyArray<TRecipeTag>;
	recipeTagsBase: ReadonlyArray<TRecipeTag>;
}): Promise<{
	extraIngredients: TIngredientName[];
	rating: TRatingKey;
	score: number;
	ingredientPenalty: number;
	priority: IRecommendationPriorityMetrics;
} | null> {
	const negativeTagSet = new Set<string>(recipeNegativeTags);
	const fixedIngredientSet = new Set(excludedExtraIngredients);
	const effectIngredient = getIngredientEasterEggTarget(customerName);
	const candidates = baseGameIngredients.flatMap((ingredient) => {
		if (
			fixedIngredientSet.has(ingredient.name) ||
			ingredient.tags.some((tag) => negativeTagSet.has(tag))
		) {
			return [];
		}
		const priority = ingredientPriorityMap.get(ingredient.name);
		if (priority === undefined) {
			throw new Error(
				`推荐食材“${ingredient.name}”缺少已选择的可获取路径`
			);
		}

		return [
			{
				effectKeys:
					ingredient.name === effectIngredient
						? ['ingredient-easter-egg']
						: [],
				name: ingredient.name,
				penalty: getSuggestIngredientResourcePenalty(
					ingredient.name,
					ingredientPenaltyContext
				).total,
				priority: { ...priority, acquisitionEase: 0 },
				tags: ingredient.tags,
			},
		];
	});
	const stateTable = await getExactIngredientStateTable(
		{
			candidates,
			maxCount: Math.max(0, 5 - recipeIngredients.length),
			orderSensitiveTags: hasMystiaCooker
				? new Set(customerPositiveTags)
				: new Set<TRecipeTag>(),
		},
		execution
	);
	const summaryLayers = await getRecipeIngredientSummaries({
		execution,
		extraSlots,
		isFamousShop,
		popularTrend,
		recipeIngredients,
		recipeName,
		recipeTagsBase,
		stateTable,
	});
	const evaluateRecipe = createMealEvaluator({
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags,
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
		hasMystiaCooker,
	});

	let bestResult: {
		extraIngredients: TIngredientName[];
		ingredientPenalty: number;
		priority: IRecommendationPriorityMetrics;
		rating: TRatingKey;
		score: number;
	} | null = null;

	for (let count = 1; count <= extraSlots; count++) {
		for (const summary of summaryLayers[count] ?? []) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const rating = evaluateRecipe({
				currentIngredients: [...summary.currentIngredients],
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: [...summary.recipeTagsWithTrend],
				isDarkMatter: false,
			});
			if (rating === null) {
				continue;
			}

			const score = SCORE_MAP[rating];
			if (
				score > maxRating ||
				(bestResult !== null &&
					(score < bestResult.score ||
						(score === bestResult.score &&
							(compareRecommendationStrictMetrics(
								summary.priority,
								bestResult.priority
							) > 0 ||
								(compareRecommendationStrictMetrics(
									summary.priority,
									bestResult.priority
								) === 0 &&
									summary.ingredientPenalty >=
										bestResult.ingredientPenalty)))))
			) {
				continue;
			}

			bestResult = {
				extraIngredients: [...summary.extraIngredients],
				ingredientPenalty: summary.ingredientPenalty,
				priority: summary.priority,
				rating,
				score,
			};
		}
	}

	return bestResult;
}

async function computeSuggestions(
	{
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
	}: ISuggestParams,
	context: TSuggestContext,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		instance_recipe,
	} = context;
	const { beverageTag: orderBeverageTag, recipeTag: orderRecipeTag } =
		customerOrder;
	if (
		orderBeverageTag === null ||
		orderRecipeTag === null ||
		hasMystiaCooker
	) {
		return [];
	}

	const filteredBeverages = baseGameBeverages.filter(
		({ tags }) =>
			(tags as ReadonlyArray<TBeverageTag>).includes(orderBeverageTag) &&
			(customerBeverageTags as ReadonlyArray<TBeverageTag>).includes(
				orderBeverageTag
			)
	);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	const recipesWithSuitability = buildRecipeSuitabilityList(
		instance_recipe,
		baseGameRecipes,
		customerName,
		customerPositiveTags,
		customerNegativeTags,
		popularTrend,
		isFamousShop
	);

	const results: IScoredResult[] = [];

	const beverageTagGroups = buildBeverageTagGroups(filteredBeverages);

	for (const {
		recipe: {
			ingredients: recipeIngredients,
			name: recipeName,
			negativeTags: recipeNegativeTags,
			positiveTags: recipePositiveTags,
			price: recipePrice,
		},
		recipeTagsWithTrend,
	} of recipesWithSuitability) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);

		for (const {
			members: beverageMembers,
			tags: beverageTags,
		} of beverageTagGroups.values()) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			const rating = evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags: customerNegativeTags,
				currentCustomerOrder: customerOrder,
				currentCustomerPositiveTags: customerPositiveTags,
				currentIngredients: recipeIngredients,
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: recipeTagsWithTrend,
				hasMystiaCooker: false,
				isDarkMatter: false,
			});

			if (rating === null) {
				continue;
			}

			const score = SCORE_MAP[rating];

			let finalScore = score;
			let finalRating: TRatingKey = rating;
			let finalExtra: TIngredientName[] = [];
			let ingredientPenalty = 0;

			if (extraSlots > 0 && (score < 4 || score > maxRating)) {
				const bestExtra = await findBestExtraIngredients({
					baseGameIngredients: relevantIngredients,
					beverageTags,
					customerBeverageTags,
					customerName,
					customerNegativeTags,
					customerOrder,
					customerPositiveTags,
					excludedExtraIngredients: [],
					execution,
					extraSlots,
					hasMystiaCooker: false,
					ingredientPenaltyContext,
					ingredientPriorityMap,
					isFamousShop,
					maxRating,
					popularTrend,
					recipeIngredients,
					recipeName,
					recipeNegativeTags,
					recipeTagsBase: recipePositiveTags,
				});

				if (
					bestExtra !== null &&
					(bestExtra.score > score || score > maxRating)
				) {
					finalScore = bestExtra.score;
					finalRating = bestExtra.rating;
					finalExtra = bestExtra.extraIngredients;
					ingredientPenalty = bestExtra.ingredientPenalty;
				}
			}

			if (finalScore <= maxRating) {
				for (const {
					name: beverageName,
					price: beveragePrice,
				} of beverageMembers) {
					const totalPrice = beveragePrice + recipePrice;
					if (totalPrice > budgetMax) {
						continue;
					}

					const meal: ISuggestedMeal = {
						beverage: beverageName,
						price: totalPrice,
						rating: finalRating,
						recipe: {
							extraIngredients: finalExtra,
							name: recipeName,
						},
					};

					results.push({
						meal,
						metrics: {
							ingredientPenalty,
							isOverSoftBudget: totalPrice > budgetSoftMax,
							priority: getMealPriority(meal, context, {
								fixedExtraIngredients:
									EMPTY_INGREDIENT_NAME_SET,
								isBeverageFixed: false,
								isRecipeFixed: false,
							}),
							score: finalScore,
						},
						score: finalScore,
					});
				}
			}
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) =>
			`${m.recipe.name}|${m.beverage}|${m.recipe.extraIngredients.join(',')}`,
		{ isBeverageFixed: false, isRecipeFixed: false },
		execution
	);
}

async function suggestIngredients(
	{
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		popularTrend,
	}: ISuggestParams,
	context: TSuggestContext,
	currentRecipe: IMealRecipe,
	currentBeverage: TBeverageName,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameIngredients,
		budgetMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		instance_beverage,
		instance_recipe,
	} = context;
	const { recipeTag: orderRecipeTag } = customerOrder;

	const { price: beveragePrice, tags: beverageTags } =
		instance_beverage.getPropsByName(currentBeverage);

	const {
		ingredients: recipeIngredients,
		negativeTags: recipeNegativeTags,
		positiveTags: recipePositiveTags,
		price: recipePrice,
	} = instance_recipe.getPropsByName(currentRecipe.name);

	const allCurrentIngredients = [
		...recipeIngredients,
		...currentRecipe.extraIngredients,
	];
	const extraSlots =
		maxExtraIngredients === null
			? 5 - allCurrentIngredients.length
			: Math.min(
					5 - allCurrentIngredients.length,
					maxExtraIngredients - currentRecipe.extraIngredients.length
				);

	if (extraSlots <= 0) {
		return [];
	}

	const { extraTags: existingExtraTags, isDarkMatter: isBaseDarkMatter } =
		instance_recipe.checkDarkMatter({
			extraIngredients: currentRecipe.extraIngredients,
			negativeTags: recipeNegativeTags,
		});

	if (isBaseDarkMatter) {
		return [];
	}

	const composedBaseRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		recipeIngredients,
		currentRecipe.extraIngredients,
		recipePositiveTags,
		existingExtraTags,
		popularTrend
	);
	const baseRecipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
		composedBaseRecipeTags,
		popularTrend,
		isFamousShop
	);

	const baseRating = evaluateMeal({
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags,
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags,
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags,
		currentIngredients: allCurrentIngredients,
		currentRecipeName: currentRecipe.name,
		currentRecipeTagsWithTrend: baseRecipeTagsWithTrend,
		hasMystiaCooker,
		isDarkMatter: false,
	});

	const baseScore = baseRating === null ? 0 : SCORE_MAP[baseRating];

	if (baseScore >= 4 && baseScore <= maxRating) {
		return [];
	}

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	const bestExtra = await findBestExtraIngredients({
		baseGameIngredients: relevantIngredients,
		beverageTags,
		customerBeverageTags,
		customerName,
		customerNegativeTags,
		customerOrder,
		customerPositiveTags,
		excludedExtraIngredients: currentRecipe.extraIngredients,
		execution,
		extraSlots,
		hasMystiaCooker,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		isFamousShop,
		maxRating,
		popularTrend,
		recipeIngredients: allCurrentIngredients,
		recipeName: currentRecipe.name,
		recipeNegativeTags,
		recipeTagsBase: composedBaseRecipeTags,
	});

	if (
		bestExtra !== null &&
		(bestExtra.score > baseScore || baseScore > maxRating) &&
		bestExtra.score <= maxRating
	) {
		const totalPrice = beveragePrice + recipePrice;
		if (totalPrice > budgetMax) {
			return [];
		}

		const allExtra = [
			...currentRecipe.extraIngredients,
			...bestExtra.extraIngredients,
		];

		return [
			{
				beverage: currentBeverage,
				price: totalPrice,
				rating: bestExtra.rating,
				recipe: {
					extraIngredients: allExtra,
					name: currentRecipe.name,
				},
			},
		];
	}

	return [];
}

async function suggestForBeverage(
	{
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
	}: ISuggestParams,
	context: TSuggestContext,
	currentBeverage: TBeverageName,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameIngredients,
		baseGameRecipes,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		instance_beverage,
		instance_recipe,
	} = context;
	const { recipeTag: orderRecipeTag } = customerOrder;

	const { price: beveragePrice, tags: beverageTags } =
		instance_beverage.getPropsByName(currentBeverage);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	const recipesWithSuitability = buildRecipeSuitabilityList(
		instance_recipe,
		baseGameRecipes,
		customerName,
		customerPositiveTags,
		customerNegativeTags,
		popularTrend,
		isFamousShop
	);

	const results: IScoredResult[] = [];

	for (const {
		recipe: {
			ingredients: recipeIngredients,
			name: recipeName,
			negativeTags: recipeNegativeTags,
			positiveTags: recipePositiveTags,
			price: recipePrice,
		},
		recipeTagsWithTrend,
	} of recipesWithSuitability) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const rating = evaluateMeal({
			currentBeverageTags: beverageTags,
			currentCustomerBeverageTags: customerBeverageTags,
			currentCustomerName: customerName,
			currentCustomerNegativeTags: customerNegativeTags,
			currentCustomerOrder: customerOrder,
			currentCustomerPositiveTags: customerPositiveTags,
			currentIngredients: recipeIngredients,
			currentRecipeName: recipeName,
			currentRecipeTagsWithTrend: recipeTagsWithTrend,
			hasMystiaCooker,
			isDarkMatter: false,
		});

		if (rating === null) {
			continue;
		}

		let score = SCORE_MAP[rating];
		let bestMeal: ISuggestedMeal = {
			beverage: currentBeverage,
			price: beveragePrice + recipePrice,
			rating,
			recipe: { extraIngredients: [], name: recipeName },
		};

		let ingredientPenalty = 0;
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);
		if (extraSlots > 0 && (score < 4 || score > maxRating)) {
			const bestExtra = await findBestExtraIngredients({
				baseGameIngredients: relevantIngredients,
				beverageTags,
				customerBeverageTags,
				customerName,
				customerNegativeTags,
				customerOrder,
				customerPositiveTags,
				excludedExtraIngredients: [],
				execution,
				extraSlots,
				hasMystiaCooker,
				ingredientPenaltyContext,
				ingredientPriorityMap,
				isFamousShop,
				maxRating,
				popularTrend,
				recipeIngredients,
				recipeName,
				recipeNegativeTags,
				recipeTagsBase: recipePositiveTags,
			});

			if (
				bestExtra !== null &&
				(bestExtra.score > score || score > maxRating)
			) {
				score = bestExtra.score;
				ingredientPenalty = bestExtra.ingredientPenalty;
				bestMeal = {
					beverage: currentBeverage,
					price: beveragePrice + recipePrice,
					rating: bestExtra.rating,
					recipe: {
						extraIngredients: bestExtra.extraIngredients,
						name: recipeName,
					},
				};
			}
		}

		if (score <= maxRating) {
			const totalPrice = bestMeal.price;
			if (totalPrice > budgetMax) {
				continue;
			}

			results.push({
				meal: bestMeal,
				metrics: {
					ingredientPenalty,
					isOverSoftBudget: totalPrice > budgetSoftMax,
					priority: getMealPriority(bestMeal, context, {
						fixedExtraIngredients: EMPTY_INGREDIENT_NAME_SET,
						isBeverageFixed: true,
						isRecipeFixed: false,
					}),
					score,
				},
				score,
			});
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) => `${m.recipe.name}|${m.recipe.extraIngredients.join(',')}`,
		{ isBeverageFixed: true, isRecipeFixed: false },
		execution
	);
}

async function suggestForRecipe(
	{
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		maxExtraIngredients,
		maxRating,
		maxResults,
		popularTrend,
	}: ISuggestParams,
	context: TSuggestContext,
	currentRecipe: IMealRecipe,
	execution: ISuggestMealsExecution
) {
	const {
		baseGameBeverages,
		baseGameIngredients,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		ingredientPriorityMap,
		instance_recipe,
	} = context;
	const { beverageTag: orderBeverageTag, recipeTag: orderRecipeTag } =
		customerOrder;

	const filteredBeverages =
		orderBeverageTag === null
			? baseGameBeverages
			: baseGameBeverages.filter(
					({ tags }) =>
						(tags as ReadonlyArray<TBeverageTag>).includes(
							orderBeverageTag
						) &&
						(
							customerBeverageTags as ReadonlyArray<TBeverageTag>
						).includes(orderBeverageTag)
				);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	const recipe = instance_recipe.getPropsByName(currentRecipe.name);
	const {
		ingredients: recipeIngredients,
		negativeTags: recipeNegativeTags,
		positiveTags: recipePositiveTags,
		price: recipePrice,
	} = recipe;

	if (
		recipeIngredients.length + currentRecipe.extraIngredients.length > 5 ||
		(maxExtraIngredients !== null &&
			currentRecipe.extraIngredients.length > maxExtraIngredients)
	) {
		return [];
	}

	const results: IScoredResult[] = [];

	const { extraTags: baseExtraTags, isDarkMatter: isBaseDarkMatter } =
		instance_recipe.checkDarkMatter({
			extraIngredients: currentRecipe.extraIngredients,
			negativeTags: recipeNegativeTags,
		});

	const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		recipeIngredients,
		currentRecipe.extraIngredients,
		recipePositiveTags,
		baseExtraTags,
		popularTrend
	);
	const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
		composedRecipeTags,
		popularTrend,
		isFamousShop
	);

	const allCurrentIngredients = [
		...recipeIngredients,
		...currentRecipe.extraIngredients,
	];
	const fixedExtraIngredients = new Set(currentRecipe.extraIngredients);

	const beverageTagGroups = buildBeverageTagGroups(filteredBeverages);

	const extraSlots =
		maxExtraIngredients === null
			? 5 - allCurrentIngredients.length
			: Math.min(
					5 - allCurrentIngredients.length,
					maxExtraIngredients - currentRecipe.extraIngredients.length
				);

	for (const {
		members: beverageMembers,
		tags: beverageTags,
	} of beverageTagGroups.values()) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const rating = evaluateMeal({
			currentBeverageTags: beverageTags,
			currentCustomerBeverageTags: customerBeverageTags,
			currentCustomerName: customerName,
			currentCustomerNegativeTags: customerNegativeTags,
			currentCustomerOrder: customerOrder,
			currentCustomerPositiveTags: customerPositiveTags,
			currentIngredients: allCurrentIngredients,
			currentRecipeName: currentRecipe.name,
			currentRecipeTagsWithTrend: recipeTagsWithTrend,
			hasMystiaCooker,
			isDarkMatter: isBaseDarkMatter,
		});

		if (rating === null) {
			continue;
		}

		const baseScore = SCORE_MAP[rating];
		let useExtra = false;
		let finalScore = baseScore;
		let extraIngredients: TIngredientName[] = [];
		let finalRating: TRatingKey = rating;
		let ingredientPenalty = 0;

		if (
			extraSlots > 0 &&
			!isBaseDarkMatter &&
			(baseScore < 4 || baseScore > maxRating)
		) {
			const bestExtra = await findBestExtraIngredients({
				baseGameIngredients: relevantIngredients,
				beverageTags,
				customerBeverageTags,
				customerName,
				customerNegativeTags,
				customerOrder,
				customerPositiveTags,
				excludedExtraIngredients: currentRecipe.extraIngredients,
				execution,
				extraSlots,
				hasMystiaCooker,
				ingredientPenaltyContext,
				ingredientPriorityMap,
				isFamousShop,
				maxRating,
				popularTrend,
				recipeIngredients: allCurrentIngredients,
				recipeName: currentRecipe.name,
				recipeNegativeTags,
				recipeTagsBase: composedRecipeTags,
			});

			if (
				bestExtra !== null &&
				(bestExtra.score > baseScore || baseScore > maxRating)
			) {
				useExtra = true;
				finalScore = bestExtra.score;
				extraIngredients = bestExtra.extraIngredients;
				finalRating = bestExtra.rating;
				ingredientPenalty = bestExtra.ingredientPenalty;
			}
		}

		if (finalScore <= maxRating) {
			const baseRecipePrice = isBaseDarkMatter
				? DARK_MATTER_META_MAP.price
				: recipePrice;

			for (const {
				name: beverageName,
				price: beveragePrice,
			} of beverageMembers) {
				const bestMeal: ISuggestedMeal = useExtra
					? {
							beverage: beverageName,
							price: beveragePrice + baseRecipePrice,
							rating: finalRating,
							recipe: {
								extraIngredients: [
									...currentRecipe.extraIngredients,
									...extraIngredients,
								],
								name: currentRecipe.name,
							},
						}
					: {
							beverage: beverageName,
							price: beveragePrice + baseRecipePrice,
							rating,
							recipe: currentRecipe,
						};

				const totalPrice = bestMeal.price;
				if (totalPrice > budgetMax) {
					continue;
				}

				results.push({
					meal: bestMeal,
					metrics: {
						ingredientPenalty,
						isOverSoftBudget: totalPrice > budgetSoftMax,
						priority: getMealPriority(bestMeal, context, {
							fixedExtraIngredients,
							isBeverageFixed: false,
							isRecipeFixed: true,
						}),
						score: finalScore,
					},
					score: finalScore,
				});
			}
		}
	}

	return selectScoredResults(
		results,
		maxResults,
		(m) => `${m.beverage}|${m.recipe.extraIngredients.join(',')}`,
		{ isBeverageFixed: false, isRecipeFixed: true },
		execution
	);
}

async function suggestBySelection(
	params: ISuggestParams,
	context: TSuggestContext,
	execution: ISuggestMealsExecution
) {
	const { currentBeverage, currentRecipe } = params;

	if (currentRecipe !== null && currentBeverage !== null) {
		return suggestIngredients(
			params,
			context,
			currentRecipe,
			currentBeverage,
			execution
		);
	}
	if (currentRecipe !== null) {
		return suggestForRecipe(params, context, currentRecipe, execution);
	}
	if (currentBeverage !== null) {
		return suggestForBeverage(params, context, currentBeverage, execution);
	}

	return [];
}

function buildCacheKey({
	cooker,
	currentBeverage,
	currentRecipe,
	customerName,
	customerOrder,
	hasMystiaCooker,
	hiddenBeverages,
	hiddenDlcs,
	hiddenIngredients,
	hiddenRecipes,
	isFamousShop,
	maxExtraIngredients,
	maxRating,
	maxResults,
	popularTrend,
}: ISuggestParams) {
	return [
		cooker ?? '',
		currentBeverage ?? '',
		currentRecipe
			? `${currentRecipe.name}:${currentRecipe.extraIngredients.join(',')}`
			: '',
		customerName,
		customerOrder.beverageTag ?? '',
		customerOrder.recipeTag ?? '',
		hasMystiaCooker ? '1' : '0',
		[...hiddenBeverages].sort().join(','),
		[...hiddenDlcs].sort().join(','),
		[...hiddenIngredients].sort().join(','),
		[...hiddenRecipes].sort().join(','),
		isFamousShop ? '1' : '0',
		maxExtraIngredients?.toString() ?? '',
		maxResults.toString(),
		maxRating.toString(),
		popularTrend.tag ?? '',
		popularTrend.isNegative ? '1' : '0',
	].join('|');
}

interface IScoreBasedAlternativesParams {
	baseRating: TRatingKey;
	beverageTags: TBeverageTag[];
	customerBeverageTags: ReadonlyArray<TBeverageTag>;
	customerName: TCustomerRareName;
	customerNegativeTags: ReadonlyArray<TRecipeTag>;
	customerOrder: ICustomerOrder;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	extraIngredients: TIngredientName[];
	hasMystiaCooker: boolean;
	hiddenDlcs: ReadonlySet<TDlc>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	instance_ingredient: Ingredient;
	instance_recipe: Recipe;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	recipeName: TRecipeName;
	recipeNegativeTags: ReadonlyArray<TRecipeTag>;
	recipePositiveTags: ReadonlyArray<TRecipeTag>;
}

function cloneScoreBasedAlternatives(
	alternatives: ReadonlyMap<TIngredientName, ReadonlyArray<TIngredientName>>
) {
	const cloned = new Map<TIngredientName, TIngredientName[]>();
	for (const [ingredientName, candidates] of alternatives) {
		cloned.set(ingredientName, [...candidates]);
	}

	return cloned;
}

function getScoreBasedAlternativesLogicalWeight(
	alternatives: ReadonlyMap<TIngredientName, ReadonlyArray<TIngredientName>>
) {
	let weight = 0;
	for (const candidates of alternatives.values()) {
		weight += candidates.length;
	}

	return weight;
}

const SCORE_BASED_ALTERNATIVES_CACHE_MAX_ENTRIES = 4000;
const SCORE_BASED_ALTERNATIVES_CACHE_MAX_ITEMS = 20_000;
const scoreBasedAlternativesCache = createBoundedRuntimeCache<
	string,
	Map<TIngredientName, TIngredientName[]>
>(SCORE_BASED_ALTERNATIVES_CACHE_MAX_ENTRIES, {
	getWeight: getScoreBasedAlternativesLogicalWeight,
	maxWeight: SCORE_BASED_ALTERNATIVES_CACHE_MAX_ITEMS,
});

function buildScoreBasedAlternativesCacheKey({
	baseRating,
	beverageTags,
	customerBeverageTags,
	customerName,
	customerNegativeTags,
	customerOrder,
	customerPositiveTags,
	extraIngredients,
	hasMystiaCooker,
	hiddenDlcs,
	hiddenIngredients,
	isFamousShop,
	popularTrend,
	recipeIngredients,
	recipeName,
	recipeNegativeTags,
	recipePositiveTags,
}: IScoreBasedAlternativesParams) {
	return JSON.stringify({
		baseRating,
		beverageTags,
		customerBeverageTags,
		customerName,
		customerNegativeTags,
		customerOrder,
		customerPositiveTags,
		extraIngredients,
		hasMystiaCooker,
		hiddenDlcs: [...hiddenDlcs].sort(),
		hiddenIngredients: [...hiddenIngredients].sort(),
		isFamousShop,
		popularTrend,
		recipeIngredients,
		recipeName,
		recipeNegativeTags,
		recipePositiveTags,
	});
}

export async function getScoreBasedAlternatives(
	params: IScoreBasedAlternativesParams,
	options: ISuggestMealsOptions = {}
): Promise<Map<TIngredientName, TIngredientName[]>> {
	const {
		baseRating,
		beverageTags,
		customerBeverageTags,
		customerName,
		customerNegativeTags,
		customerOrder,
		customerPositiveTags,
		extraIngredients,
		hasMystiaCooker,
		hiddenDlcs,
		hiddenIngredients,
		instance_ingredient,
		instance_recipe,
		isFamousShop,
		popularTrend,
		recipeIngredients,
		recipeName,
		recipeNegativeTags,
		recipePositiveTags,
	} = params;
	const execution = createSuggestMealsExecution(options);
	execution.throwIfAborted();
	const canUseCache =
		instance_ingredient === Ingredient.getInstance() &&
		instance_recipe === Recipe.getInstance();
	const cacheKey = canUseCache
		? buildScoreBasedAlternativesCacheKey(params)
		: null;
	if (cacheKey !== null) {
		const cached = scoreBasedAlternativesCache.get(cacheKey);
		if (cached !== undefined) {
			return cloneScoreBasedAlternatives(cached);
		}
	}
	await execution.checkpoint(true);
	const baseScore = SCORE_MAP[baseRating];
	const result = new Map<TIngredientName, TIngredientName[]>();

	const keepTags = buildRelevantTagSet(
		customerPositiveTags,
		customerNegativeTags,
		customerOrder.recipeTag
	);
	const { dlc: customerDlc, places: customerPlaces } =
		CustomerRare.getInstance().getPropsByName(customerName);
	const candidatePriorityMap = new Map<
		TIngredientName,
		IRecommendationPriorityMetrics
	>();

	const filteredCandidates = instance_ingredient.data.filter((item) => {
		const priority = getRecommendationItemPriority({
			allowFishingFallback: false,
			availabilityPaths: item.availabilityPaths,
			contentDlc: item.dlc,
			customerDlc,
			customerPlaces,
			hiddenDlcs,
		});
		if (priority !== null) {
			candidatePriorityMap.set(item.name, priority);
		}

		return (
			priority !== null &&
			!instance_ingredient.blockedIngredients.has(item.name) &&
			!instance_ingredient.blockedLevels.has(item.level) &&
			!hiddenIngredients.has(item.name) &&
			!item.tags.some((tag) =>
				instance_ingredient.blockedTags.has(tag)
			) &&
			item.tags.some((tag) => keepTags.has(tag))
		);
	});
	const ingredientPenaltyContext = createSuggestIngredientPenaltyContext({
		customerName,
		hiddenDlcs,
		hiddenIngredients,
	});

	const allExtraTags = extraIngredients.map((e) =>
		instance_ingredient.getPropsByName(e, 'tags')
	);

	const baseTagSets: Array<Set<string>> = extraIngredients.map(
		(_name, pos) => {
			const otherTags = allExtraTags.filter((_, i) => i !== pos).flat();
			return new Set<string>([
				...recipePositiveTags,
				...(otherTags as TRecipeTag[]),
			]);
		}
	);

	const totalIngredientCount =
		recipeIngredients.length + extraIngredients.length;
	const evaluateRecipe = createMealEvaluator({
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags as TBeverageTag[],
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
		hasMystiaCooker,
	});

	for (const [pos, targetName] of extraIngredients.entries()) {
		const checkpointPromise = execution.checkpoint();
		if (checkpointPromise !== undefined) {
			await checkpointPromise;
		}
		const otherExtras = extraIngredients.filter((_, i) => i !== pos);
		const candidates: Array<{
			name: TIngredientName;
			penalty: number;
			priority: IRecommendationPriorityMetrics;
			score: number;
		}> = [];

		for (const item of filteredCandidates) {
			const checkpointPromise = execution.checkpoint();
			if (checkpointPromise !== undefined) {
				await checkpointPromise;
			}
			if (
				item.name === targetName ||
				otherExtras.includes(item.name) ||
				(recipeIngredients as ReadonlyArray<string>).includes(item.name)
			) {
				continue;
			}

			const replacedExtras = [...otherExtras, item.name];
			const { isDarkMatter } = instance_recipe.checkDarkMatter({
				extraIngredients: replacedExtras,
				negativeTags: recipeNegativeTags,
			});
			if (isDarkMatter) {
				continue;
			}

			const tagSet = new Set(baseTagSets[pos]);
			for (const tag of item.tags) {
				tagSet.add(tag);
			}
			Recipe.applyLargePartition(
				tagSet,
				totalIngredientCount,
				popularTrend
			);
			Recipe.applyTagCovers(tagSet as Set<TRecipeTag>, popularTrend);

			const tagsWithTrend = instance_recipe.calculateTagsWithTrend(
				[...tagSet] as TRecipeTag[],
				popularTrend,
				isFamousShop
			);

			const rating = evaluateRecipe({
				currentIngredients: [
					...new Set([
						...(recipeIngredients as TIngredientName[]),
						...replacedExtras,
					]),
				],
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: tagsWithTrend,
				isDarkMatter,
			});

			if (rating !== null && SCORE_MAP[rating] >= baseScore) {
				const priority = candidatePriorityMap.get(item.name);
				if (priority === undefined) {
					throw new Error(
						`替代食材“${item.name}”缺少已选择的可获取路径`
					);
				}
				candidates.push({
					name: item.name,
					penalty: getSuggestIngredientResourcePenalty(
						item.name,
						ingredientPenaltyContext
					).total,
					priority,
					score: SCORE_MAP[rating],
				});
			}
		}

		candidates.sort(
			(a, b) =>
				b.score - a.score ||
				compareRecommendationStrictMetrics(a.priority, b.priority) ||
				a.penalty - b.penalty
		);
		result.set(
			targetName,
			candidates.map((c) => c.name)
		);
	}

	execution.throwIfAborted();
	if (cacheKey !== null) {
		scoreBasedAlternativesCache.set(
			cacheKey,
			cloneScoreBasedAlternatives(result)
		);
	}
	return result;
}

const SUGGEST_CACHE_MAX_ENTRIES = 15_000;
const SUGGEST_CACHE_MAX_MEALS = 150_000;
const suggestCache = createBoundedRuntimeCache<string, ISuggestedMeal[]>(
	SUGGEST_CACHE_MAX_ENTRIES,
	{
		getWeight: (meals) => Math.max(1, meals.length),
		maxWeight: SUGGEST_CACHE_MAX_MEALS,
	}
);

export interface IRecommendationMemoryCacheStats {
	readonly alternatives: IBoundedRuntimeCacheStats;
	readonly exactIngredientState: IBoundedRuntimeCacheStats;
	readonly finalResult: IBoundedRuntimeCacheStats;
	readonly recipeIngredientSummary: IBoundedRuntimeCacheStats;
	readonly searchContext: IBoundedRuntimeCacheStats;
}

export function getRecommendationMemoryCacheStats(): IRecommendationMemoryCacheStats {
	return {
		alternatives: scoreBasedAlternativesCache.getStats(),
		exactIngredientState: exactIngredientStateCache.getStats(),
		finalResult: suggestCache.getStats(),
		recipeIngredientSummary: recipeIngredientSummaryCache.getStats(),
		searchContext: suggestContextCache.getStats(),
	};
}

function cloneSuggestedMeals(meals: ReadonlyArray<ISuggestedMeal>) {
	return meals.map(({ beverage, price, rating, recipe }) => ({
		beverage,
		price,
		rating,
		recipe: {
			extraIngredients: [...recipe.extraIngredients],
			name: recipe.name,
		},
	}));
}

function createSuggestParamsSnapshot(params: ISuggestParams): ISuggestParams {
	return {
		...params,
		currentRecipe:
			params.currentRecipe === null
				? null
				: {
						extraIngredients: [
							...params.currentRecipe.extraIngredients,
						],
						name: params.currentRecipe.name,
					},
		customerOrder: { ...params.customerOrder },
		hiddenBeverages: new Set(params.hiddenBeverages),
		hiddenDlcs: new Set(params.hiddenDlcs),
		hiddenIngredients: new Set(params.hiddenIngredients),
		hiddenRecipes: new Set(params.hiddenRecipes),
		popularTrend: { ...params.popularTrend },
	};
}

export interface ISuggestMealsOptions {
	readonly scheduler?: ISuggestMealsYieldScheduler;
	readonly signal?: AbortSignal;
	readonly sliceBudgetMs?: number;
	readonly taskKey?: string;
}

export async function suggestMeals(
	params: ISuggestParams,
	options: ISuggestMealsOptions = {}
) {
	const paramsSnapshot = createSuggestParamsSnapshot(params);
	const execution = createSuggestMealsExecution(options);
	execution.throwIfAborted();
	const cacheKey = buildCacheKey(paramsSnapshot);

	const cached = suggestCache.get(cacheKey);
	if (cached !== undefined) {
		return cloneSuggestedMeals(cached);
	}

	await execution.checkpoint(true);
	const { currentBeverage, currentRecipe } = paramsSnapshot;
	const context = getSuggestContext(paramsSnapshot);
	const result = checkFixedSelectionsAvailable(paramsSnapshot, context)
		? currentBeverage !== null || currentRecipe !== null
			? await suggestBySelection(paramsSnapshot, context, execution)
			: await computeSuggestions(paramsSnapshot, context, execution)
		: [];

	execution.throwIfAborted();
	const cachedResult = cloneSuggestedMeals(result);
	suggestCache.set(cacheKey, cachedResult);

	return cloneSuggestedMeals(cachedResult);
}
