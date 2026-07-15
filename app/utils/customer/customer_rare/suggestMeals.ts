import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	DARK_MATTER_META_MAP,
	PLACE_DLC_MAP,
	PLACE_UNLOCK_TIER_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TPlace,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import type { ICustomerOrder, IMealRecipe, IPopularTrend } from '@/types';
import {
	checkArrayContainsOf,
	createBoundedRuntimeCache,
	intersection,
	toArray,
	toSet,
	union,
} from '@/utilities';
import { Beverage, CustomerRare, Ingredient, Recipe } from '@/utils';
import { extractPrimaryMapPlaceFromSourceText } from '@/utils/sourcePlaces';
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

export interface ISuggestedMeal {
	beverage: TBeverageName;
	price: number;
	rating: TRatingKey;
	recipe: IMealRecipe;
}

interface IPlanWeightMetrics {
	readonly acquisitionWeight: number;
	readonly budgetPenalty: number;
	readonly ingredientPenalty: number;
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

const BUDGET_OVER_PENALTY = 500;
const GAME_DAY_HOURS = 8;

const CROSS_DLC_MAP_WEIGHT = 0.25;
const COLLECT_CHANNEL_BONUS = 1.2;
const CUSTOMER_BOND_RECIPE_BONUS = 1.2;
const CUSTOMER_HOME_MAP_WEIGHT = 1.5;
const FALLBACK_MAP_WEIGHT = 0.05;
const OWN_DLC_MAP_BONUS = 1.2;
const PROGRESSION_DECAY_PER_TIER = 0.9;
const RECIPE_INGREDIENT_COUNT_EXPONENT = 0.5;
const SUGGEST_INGREDIENT_RESOURCE_WEIGHTS = {
	acquisition: 0.45,
	level: 0.2,
	price: 0.35,
} as const;
const COOPERATIVE_SORT_RUN_SIZE = 128;

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
		await execution.checkpoint();
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
				await execution.checkpoint();
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
				await execution.checkpoint();
				const value = left[leftIndex++];
				if (value !== undefined) {
					merged.push(value);
				}
			}
			while (rightIndex < right.length) {
				await execution.checkpoint();
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

interface IAcquisitionSource {
	readonly buy?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly collect?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly self?: boolean;
	readonly [key: string]: unknown;
}

function getMapWeight(name: string, customerDlc: TDlc, customerPlace: TPlace) {
	const place = extractPrimaryMapPlaceFromSourceText(name);

	if (place === null) {
		return FALLBACK_MAP_WEIGHT;
	}

	const mapDlc = PLACE_DLC_MAP[place];
	const dlcFactor =
		customerDlc !== 0 && mapDlc === customerDlc
			? OWN_DLC_MAP_BONUS
			: mapDlc === 0 || mapDlc === customerDlc
				? 1
				: CROSS_DLC_MAP_WEIGHT;
	const homeFactor = place === customerPlace ? CUSTOMER_HOME_MAP_WEIGHT : 1;
	const customerTier = PLACE_UNLOCK_TIER_MAP[customerPlace];
	const mapTier = PLACE_UNLOCK_TIER_MAP[place];
	const progressionFactor =
		mapTier > customerTier
			? PROGRESSION_DECAY_PER_TIER ** (mapTier - customerTier)
			: 1;

	return dlcFactor * homeFactor * progressionFactor;
}

function parseSourceEntry(entry: string | ReadonlyArray<unknown>): {
	name: string;
	probability: number;
} {
	if (typeof entry === 'string') {
		return { name: entry, probability: 100 };
	}

	const [name, prob] = entry as [string, (number | boolean)?];

	return { name, probability: typeof prob === 'number' ? prob : 100 };
}

function computeCollectEntryScore(
	entry: string | ReadonlyArray<unknown>,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	const { name, probability } = parseSourceEntry(entry);

	const refreshTime = COLLECTION_LOCATION_REFRESH_TIME_MAP[
		name as keyof typeof COLLECTION_LOCATION_REFRESH_TIME_MAP
	] as number | null | undefined;

	if (refreshTime === null || refreshTime === undefined) {
		return 0;
	}

	const timeWindowFrac =
		typeof entry !== 'string' && entry.length >= 4
			? Math.max(
					0,
					(Math.min(entry[3] as number, 18) -
						Math.max(entry[2] as number, 10)) /
						GAME_DAY_HOURS
				)
			: 1;

	return (
		(probability / 100) *
		timeWindowFrac *
		(1 / refreshTime) *
		getMapWeight(name, customerDlc, customerPlace) *
		COLLECT_CHANNEL_BONUS
	);
}

function computeBuyEntryScore(
	entry: string | ReadonlyArray<unknown>,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	const { name, probability } = parseSourceEntry(entry);

	return (
		(probability / 100) *
		(1 / GAME_DAY_HOURS) *
		getMapWeight(name, customerDlc, customerPlace)
	);
}

function getAcquisitionEase(
	from: IAcquisitionSource,
	customerDlc: TDlc,
	customerPlace: TPlace
) {
	if (from.self === true) {
		return Infinity;
	}

	const totalCollectScore =
		from.collect?.reduce(
			(sum, entry) =>
				sum +
				computeCollectEntryScore(entry, customerDlc, customerPlace),
			0
		) ?? 0;
	const totalBuyScore =
		from.buy?.reduce(
			(sum, entry) =>
				sum + computeBuyEntryScore(entry, customerDlc, customerPlace),
			0
		) ?? 0;
	const totalScore = totalCollectScore + totalBuyScore;

	return totalScore === 0 ? Infinity : totalScore;
}

function computeMaxEase(easeMap: ReadonlyMap<string, number>) {
	return [...easeMap.values()].reduce(
		(max, ease) => (ease !== Infinity && ease > max ? ease : max),
		0
	);
}

function buildEaseMap<T extends string>(
	items: ReadonlyArray<{ name: T; from: IAcquisitionSource }>,
	customerDlc: TDlc,
	customerPlace: TPlace
): { easeMap: Map<T, number>; maxEase: number } {
	const easeMap = new Map<T, number>(
		items.map((item): [T, number] => [
			item.name,
			getAcquisitionEase(item.from, customerDlc, customerPlace),
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

	if (ease === Infinity || maxEase <= 0) {
		return 1;
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
	customerDlc: TDlc,
	customerPlace: TPlace
): ISuggestIngredientPenaltyContext {
	const { easeMap, maxEase } = buildEaseMap<TIngredientName>(
		ingredients,
		customerDlc,
		customerPlace
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
	hiddenIngredients,
}: {
	customerName: TCustomerRareName;
	hiddenIngredients: ReadonlySet<TIngredientName>;
}) {
	const instance_customer = CustomerRare.getInstance();
	const instance_ingredient = Ingredient.getInstance();
	const { dlc: customerDlc, places: customerPlaces } =
		instance_customer.getPropsByName(customerName);
	const [customerPlace] = customerPlaces;
	const ingredients = instance_ingredient.data.filter(
		({ dlc, level, name, tags }) =>
			(dlc === 0 || dlc === customerDlc) &&
			!instance_ingredient.blockedIngredients.has(name) &&
			!instance_ingredient.blockedLevels.has(level) &&
			!hiddenIngredients.has(name) &&
			!tags.some((tag) => instance_ingredient.blockedTags.has(tag))
	);

	return buildSuggestIngredientPenaltyContext(
		ingredients,
		customerDlc,
		customerPlace
	);
}

function getBeverageAcquisitionWeight(
	beverageName: TBeverageName,
	beverageEaseMap: ReadonlyMap<TBeverageName, number>,
	maxBeverageEase: number
) {
	return normalizeEase(beverageName, beverageEaseMap, maxBeverageEase) * 100;
}

function getRecipeAcquisitionWeight(
	ingredients: ReadonlyArray<TIngredientName>,
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>,
	maxIngredientEase: number
) {
	if (ingredients.length === 0 || maxIngredientEase <= 0) {
		return 100;
	}

	const n = ingredients.length;
	const totalInverseNormalized = ingredients.reduce((sum, name) => {
		const normalized = normalizeEase(
			name,
			ingredientEaseMap,
			maxIngredientEase
		);

		return sum + (normalized > 0 ? 1 / normalized : Infinity);
	}, 0);

	if (
		!Number.isFinite(totalInverseNormalized) ||
		totalInverseNormalized <= 0
	) {
		return 0;
	}

	return (
		(n ** RECIPE_INGREDIENT_COUNT_EXPONENT / totalInverseNormalized) * 100
	);
}

function createSuggestContext({
	cooker: selectedCooker,
	customerName,
	hiddenBeverages,
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

	const [customerPlace] = customerPlaces;

	const [, budgetSoftMax] = customerPrice;
	const budgetMax = Math.ceil(budgetSoftMax * customerEnduranceLimit);

	const isDlcAllowed = (dlc: TDlc) => dlc === 0 || dlc === customerDlc;

	const baseGameBeverages = instance_beverage.data.filter(
		({ dlc, name }) => isDlcAllowed(dlc) && !hiddenBeverages.has(name)
	);

	const baseGameRecipes = instance_recipe.data.filter(
		({ cooker, dlc, ingredients, name }) =>
			isDlcAllowed(dlc) &&
			!instance_recipe.blockedRecipes.has(name) &&
			!hiddenRecipes.has(name) &&
			!checkArrayContainsOf(ingredients, hiddenIngredients) &&
			(selectedCooker === null || cooker === selectedCooker)
	);

	const baseGameIngredients = instance_ingredient.data.filter(
		({ dlc, level, name, tags }) =>
			isDlcAllowed(dlc) &&
			!instance_ingredient.blockedIngredients.has(name) &&
			!instance_ingredient.blockedLevels.has(level) &&
			!hiddenIngredients.has(name) &&
			!tags.some((tag) => instance_ingredient.blockedTags.has(tag))
	);

	const ingredientPenaltyContext = buildSuggestIngredientPenaltyContext(
		baseGameIngredients,
		customerDlc,
		customerPlace
	);
	const { ingredientEaseMap, maxIngredientEase } = ingredientPenaltyContext;
	const { easeMap: beverageEaseMap, maxEase: maxBeverageEase } = buildEaseMap(
		baseGameBeverages,
		customerDlc,
		customerPlace
	);

	return {
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		beverageEaseMap,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientEaseMap,
		ingredientPenaltyContext,
		instance_beverage,
		instance_recipe,
		maxBeverageEase,
		maxIngredientEase,
	};
}

type TSuggestContext = ReturnType<typeof createSuggestContext>;

const suggestContextCache = createBoundedRuntimeCache<string, TSuggestContext>(
	64
);

function buildSuggestContextCacheKey({
	cooker,
	customerName,
	hiddenBeverages,
	hiddenIngredients,
	hiddenRecipes,
}: ISuggestParams) {
	return [
		cooker ?? '',
		customerName,
		toArray(hiddenBeverages).sort().join(','),
		toArray(hiddenIngredients).sort().join(','),
		toArray(hiddenRecipes).sort().join(','),
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
	const keepTags = toSet(customerPositiveTags) as Set<string>;

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
		checkArrayContainsOf(tags, keepTags)
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
		const tagKey = toArray(tags).sort().join(',');
		let group = groups.get(tagKey);
		if (group === undefined) {
			group = { members: [], tags };
			groups.set(tagKey, group);
		}
		group.members.push({ name, price });
	});

	return groups;
}

type TMetricDirection = 'asc' | 'desc';

interface IMetricRange {
	readonly max: number;
	readonly min: number;
}

interface ISoftSortRanges {
	readonly acquisition: IMetricRange;
	readonly ingredient: IMetricRange;
}

const SOFT_SORT_WEIGHTS = {
	acquisition: 50,
	budget: 1000,
	ingredient: 50,
} as const;

function normalizeMetric(
	value: number,
	{ max, min }: IMetricRange,
	direction: TMetricDirection
) {
	if (max <= min) {
		return 0;
	}

	const ratio = (value - min) / (max - min);

	return direction === 'desc' ? ratio : 1 - ratio;
}

async function buildSoftSortRanges(
	metricsList: ReadonlyArray<IPlanWeightMetrics>,
	execution: ISuggestMealsExecution
): Promise<ISoftSortRanges> {
	let acquisitionMax = -Infinity;
	let acquisitionMin = Infinity;
	let ingredientMax = -Infinity;
	let ingredientMin = Infinity;

	for (const metrics of metricsList) {
		await execution.checkpoint();
		acquisitionMax = Math.max(acquisitionMax, metrics.acquisitionWeight);
		acquisitionMin = Math.min(acquisitionMin, metrics.acquisitionWeight);
		ingredientMax = Math.max(ingredientMax, metrics.ingredientPenalty);
		ingredientMin = Math.min(ingredientMin, metrics.ingredientPenalty);
	}

	return {
		acquisition: { max: acquisitionMax, min: acquisitionMin },
		ingredient: { max: ingredientMax, min: ingredientMin },
	};
}

function computeSoftSortScore(
	metrics: IPlanWeightMetrics,
	ranges: ISoftSortRanges
) {
	return (
		normalizeMetric(metrics.acquisitionWeight, ranges.acquisition, 'desc') *
			SOFT_SORT_WEIGHTS.acquisition +
		normalizeMetric(metrics.ingredientPenalty, ranges.ingredient, 'asc') *
			SOFT_SORT_WEIGHTS.ingredient -
		(metrics.budgetPenalty > 0 ? SOFT_SORT_WEIGHTS.budget : 0)
	);
}

function compareByNormalizedWeight(
	a: IPlanWeightMetrics,
	b: IPlanWeightMetrics,
	ranges: ISoftSortRanges
) {
	return (
		b.score - a.score ||
		computeSoftSortScore(b, ranges) - computeSoftSortScore(a, ranges)
	);
}

async function dedupeScoredResults(
	results: IScoredResult[],
	maxResults: number,
	keyFn: (meal: ISuggestedMeal) => string,
	execution: ISuggestMealsExecution
) {
	const ranges = await buildSoftSortRanges(
		results.map((result) => result.metrics),
		execution
	);
	const sortedResults = await stableSortWithExecution(
		results,
		(a, b) => compareByNormalizedWeight(a.metrics, b.metrics, ranges),
		execution
	);

	const seen = new Set<string>();
	const out: ISuggestedMeal[] = [];

	for (const { meal } of sortedResults) {
		await execution.checkpoint();
		const key = keyFn(meal);

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		out.push(meal);

		if (out.length >= maxResults) {
			break;
		}
	}

	return out;
}

interface IRecipeIngredientSummary {
	readonly currentIngredients: ReadonlyArray<TIngredientName>;
	readonly extraIngredients: ReadonlyArray<TIngredientName>;
	readonly ingredientPenalty: number;
	readonly recipeTagsWithTrend: ReadonlyArray<TRecipeTag>;
}

const exactIngredientStateCache = createBoundedRuntimeCache<
	string,
	IExactIngredientStateTable
>(64, { getWeight: (table) => table.stateCount, maxWeight: 100_000 });
const recipeIngredientSummaryCache = createBoundedRuntimeCache<
	string,
	ReadonlyArray<ReadonlyArray<IRecipeIngredientSummary>>
>(128, {
	getWeight: (layers) =>
		layers.reduce((total, layer) => total + layer.length, 0),
	maxWeight: 100_000,
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
		tags: ReadonlyArray<string>;
	}>;
	maxCount: number;
	orderSensitiveTags?: ReadonlySet<TRecipeTag>;
}) {
	return [
		maxCount.toString(),
		toArray(orderSensitiveTags).join(','),
		candidates
			.map(
				({ effectKeys, name, penalty, tags }) =>
					`${name}:${penalty}:${tags.join(',')}:${effectKeys.join(',')}`
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
			await execution.checkpoint();
			const tagSet = toSet(
				recipeTagsBase,
				getExactIngredientStateTags(
					stateTable,
					state
				) as ReadonlyArray<TRecipeTag>
			);

			Recipe.applyLargePartition(
				tagSet,
				recipeIngredients.length + state.count,
				popularTrend
			);
			Recipe.applyTagCovers(tagSet, popularTrend);
			Recipe.applyFamousShop(tagSet, isFamousShop);
			Recipe.applyPopularTrend(tagSet, popularTrend);

			summaries.push({
				currentIngredients: toArray(
					recipeIngredients,
					state.extraIngredients
				),
				extraIngredients: state.extraIngredients,
				ingredientPenalty: state.ingredientPenalty,
				recipeTagsWithTrend: toArray(tagSet),
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
} | null> {
	const negativeTagSet = toSet(recipeNegativeTags) as Set<string>;
	const fixedIngredientSet = toSet(excludedExtraIngredients);
	const effectIngredient = getIngredientEasterEggTarget(customerName);
	const candidates = baseGameIngredients.flatMap((ingredient) => {
		if (
			fixedIngredientSet.has(ingredient.name) ||
			checkArrayContainsOf(ingredient.tags, negativeTagSet)
		) {
			return [];
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
		rating: TRatingKey;
		score: number;
	} | null = null;

	for (let count = 1; count <= extraSlots; count++) {
		for (const summary of summaryLayers[count] ?? []) {
			await execution.checkpoint();
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
							summary.ingredientPenalty >=
								bestResult.ingredientPenalty)))
			) {
				continue;
			}

			bestResult = {
				extraIngredients: [...summary.extraIngredients],
				ingredientPenalty: summary.ingredientPenalty,
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
	{
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		beverageEaseMap,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientEaseMap,
		ingredientPenaltyContext,
		instance_recipe,
		maxBeverageEase,
		maxIngredientEase,
	}: TSuggestContext,
	execution: ISuggestMealsExecution
) {
	const { beverageTag: orderBeverageTag, recipeTag: orderRecipeTag } =
		customerOrder;
	if (
		orderBeverageTag === null ||
		orderRecipeTag === null ||
		hasMystiaCooker
	) {
		return [];
	}

	const filteredBeverages = baseGameBeverages.filter(({ tags }) =>
		intersection(tags, customerBeverageTags).includes(orderBeverageTag)
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
			from: recipeFrom,
			ingredients: recipeIngredients,
			name: recipeName,
			negativeTags: recipeNegativeTags,
			positiveTags: recipePositiveTags,
			price: recipePrice,
		},
		recipeTagsWithTrend,
	} of recipesWithSuitability) {
		await execution.checkpoint();
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);

		for (const {
			members: beverageMembers,
			tags: beverageTags,
		} of beverageTagGroups.values()) {
			await execution.checkpoint();
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

					const budgetPenalty =
						totalPrice > budgetSoftMax ? BUDGET_OVER_PENALTY : 0;
					const bondBonus =
						typeof recipeFrom !== 'string' &&
						'bond' in recipeFrom &&
						recipeFrom.bond.name === customerName
							? CUSTOMER_BOND_RECIPE_BONUS
							: 1;
					const acquisitionWeight =
						getRecipeAcquisitionWeight(
							recipeIngredients,
							ingredientEaseMap,
							maxIngredientEase
						) *
							bondBonus +
						getBeverageAcquisitionWeight(
							beverageName,
							beverageEaseMap,
							maxBeverageEase
						);

					results.push({
						meal: {
							beverage: beverageName,
							price: beveragePrice + recipePrice,
							rating: finalRating,
							recipe: {
								extraIngredients: finalExtra,
								name: recipeName,
							},
						},
						metrics: {
							acquisitionWeight,
							budgetPenalty,
							ingredientPenalty,
							score: finalScore,
						},
						score: finalScore,
					});
				}
			}
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) =>
			`${m.recipe.name}|${m.beverage}|${m.recipe.extraIngredients.join(',')}`,
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
	{
		baseGameIngredients,
		budgetMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		instance_beverage,
		instance_recipe,
	}: TSuggestContext,
	currentRecipe: IMealRecipe,
	currentBeverage: TBeverageName,
	execution: ISuggestMealsExecution
) {
	const { recipeTag: orderRecipeTag } = customerOrder;

	const { price: beveragePrice, tags: beverageTags } =
		instance_beverage.getPropsByName(currentBeverage);

	const {
		ingredients: recipeIngredients,
		negativeTags: recipeNegativeTags,
		positiveTags: recipePositiveTags,
		price: recipePrice,
	} = instance_recipe.getPropsByName(currentRecipe.name);

	const allCurrentIngredients = toArray(
		recipeIngredients,
		currentRecipe.extraIngredients
	);
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

		const allExtra = toArray(
			currentRecipe.extraIngredients,
			bestExtra.extraIngredients
		);

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
	{
		baseGameIngredients,
		baseGameRecipes,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientEaseMap,
		ingredientPenaltyContext,
		instance_beverage,
		instance_recipe,
		maxIngredientEase,
	}: TSuggestContext,
	currentBeverage: TBeverageName,
	execution: ISuggestMealsExecution
) {
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
			from: recipeFrom,
			ingredients: recipeIngredients,
			name: recipeName,
			negativeTags: recipeNegativeTags,
			positiveTags: recipePositiveTags,
			price: recipePrice,
		},
		recipeTagsWithTrend,
	} of recipesWithSuitability) {
		await execution.checkpoint();
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

			const budgetPenalty =
				totalPrice > budgetSoftMax ? BUDGET_OVER_PENALTY : 0;
			const bondBonus =
				typeof recipeFrom !== 'string' &&
				'bond' in recipeFrom &&
				recipeFrom.bond.name === customerName
					? CUSTOMER_BOND_RECIPE_BONUS
					: 1;
			const acquisitionWeight =
				getRecipeAcquisitionWeight(
					recipeIngredients,
					ingredientEaseMap,
					maxIngredientEase
				) * bondBonus;

			results.push({
				meal: bestMeal,
				metrics: {
					acquisitionWeight,
					budgetPenalty,
					ingredientPenalty,
					score,
				},
				score,
			});
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) => `${m.recipe.name}|${m.recipe.extraIngredients.join(',')}`,
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
	{
		baseGameBeverages,
		baseGameIngredients,
		beverageEaseMap,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		ingredientPenaltyContext,
		instance_recipe,
		maxBeverageEase,
	}: TSuggestContext,
	currentRecipe: IMealRecipe,
	execution: ISuggestMealsExecution
) {
	const { beverageTag: orderBeverageTag, recipeTag: orderRecipeTag } =
		customerOrder;

	const filteredBeverages =
		orderBeverageTag === null
			? baseGameBeverages
			: baseGameBeverages.filter(({ tags }) =>
					intersection(tags, customerBeverageTags).includes(
						orderBeverageTag
					)
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

	const allCurrentIngredients = toArray(
		recipeIngredients,
		currentRecipe.extraIngredients
	);

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
		await execution.checkpoint();
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
								extraIngredients: toArray(
									currentRecipe.extraIngredients,
									extraIngredients
								),
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

				const budgetPenalty =
					totalPrice > budgetSoftMax ? BUDGET_OVER_PENALTY : 0;
				const acquisitionWeight = getBeverageAcquisitionWeight(
					beverageName,
					beverageEaseMap,
					maxBeverageEase
				);

				results.push({
					meal: bestMeal,
					metrics: {
						acquisitionWeight,
						budgetPenalty,
						ingredientPenalty,
						score: finalScore,
					},
					score: finalScore,
				});
			}
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) => `${m.beverage}|${m.recipe.extraIngredients.join(',')}`,
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
		toArray(hiddenBeverages).sort().join(','),
		toArray(hiddenIngredients).sort().join(','),
		toArray(hiddenRecipes).sort().join(','),
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
	customerDlc: TDlc;
	customerName: TCustomerRareName;
	customerNegativeTags: ReadonlyArray<TRecipeTag>;
	customerOrder: ICustomerOrder;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	extraIngredients: TIngredientName[];
	hasMystiaCooker: boolean;
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

export async function getScoreBasedAlternatives(
	{
		baseRating,
		beverageTags,
		customerBeverageTags,
		customerDlc,
		customerName,
		customerNegativeTags,
		customerOrder,
		customerPositiveTags,
		extraIngredients,
		hasMystiaCooker,
		hiddenIngredients,
		instance_ingredient,
		instance_recipe,
		isFamousShop,
		popularTrend,
		recipeIngredients,
		recipeName,
		recipeNegativeTags,
		recipePositiveTags,
	}: IScoreBasedAlternativesParams,
	options: ISuggestMealsOptions = {}
): Promise<Map<TIngredientName, TIngredientName[]>> {
	const execution = createSuggestMealsExecution(options);
	await execution.checkpoint(true);
	const baseScore = SCORE_MAP[baseRating];
	const result = new Map<TIngredientName, TIngredientName[]>();

	const keepTags = buildRelevantTagSet(
		customerPositiveTags,
		customerNegativeTags,
		customerOrder.recipeTag
	);

	const filteredCandidates = instance_ingredient.data.filter(
		(item) =>
			(item.dlc === 0 || item.dlc === customerDlc) &&
			!instance_ingredient.blockedIngredients.has(item.name) &&
			!instance_ingredient.blockedLevels.has(item.level) &&
			!hiddenIngredients.has(item.name) &&
			!item.tags.some((tag) =>
				instance_ingredient.blockedTags.has(tag)
			) &&
			item.tags.some((tag) => keepTags.has(tag))
	);
	const ingredientPenaltyContext = createSuggestIngredientPenaltyContext({
		customerName,
		hiddenIngredients,
	});

	const allExtraTags = extraIngredients.map((e) =>
		instance_ingredient.getPropsByName(e, 'tags')
	);

	const baseTagSets: Array<Set<string>> = extraIngredients.map(
		(_name, pos) => {
			const otherTags = allExtraTags.filter((_, i) => i !== pos).flat();
			return toSet(recipePositiveTags, otherTags as TRecipeTag[]);
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
		await execution.checkpoint();
		const otherExtras = extraIngredients.filter((_, i) => i !== pos);
		const candidates: Array<{
			name: TIngredientName;
			penalty: number;
			score: number;
		}> = [];

		for (const item of filteredCandidates) {
			await execution.checkpoint();
			if (
				item.name === targetName ||
				otherExtras.includes(item.name) ||
				(recipeIngredients as ReadonlyArray<string>).includes(item.name)
			) {
				continue;
			}

			const replacedExtras = toArray(otherExtras, item.name);
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
				toArray(tagSet) as TRecipeTag[],
				popularTrend,
				isFamousShop
			);

			const rating = evaluateRecipe({
				currentIngredients: union(
					recipeIngredients as TIngredientName[],
					replacedExtras
				),
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: tagsWithTrend,
				isDarkMatter,
			});

			if (rating !== null && SCORE_MAP[rating] >= baseScore) {
				candidates.push({
					name: item.name,
					penalty: getSuggestIngredientResourcePenalty(
						item.name,
						ingredientPenaltyContext
					).total,
					score: SCORE_MAP[rating],
				});
			}
		}

		candidates.sort((a, b) => b.score - a.score || a.penalty - b.penalty);
		result.set(
			targetName,
			candidates.map((c) => c.name)
		);
	}

	execution.throwIfAborted();
	return result;
}

const suggestCache = createBoundedRuntimeCache<string, ISuggestedMeal[]>(256, {
	getWeight: (meals) => Math.max(1, meals.length),
	maxWeight: 1024,
});

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
	const result =
		currentBeverage !== null || currentRecipe !== null
			? await suggestBySelection(paramsSnapshot, context, execution)
			: await computeSuggestions(paramsSnapshot, context, execution);

	execution.throwIfAborted();
	const cachedResult = cloneSuggestedMeals(result);
	suggestCache.set(cacheKey, cachedResult);

	return cloneSuggestedMeals(cachedResult);
}
