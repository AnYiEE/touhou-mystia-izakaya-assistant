import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	DARK_MATTER_META_MAP,
	type TBeverageName,
	type TBeverageTag,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
	type TIngredientTag,
	type TPlace,
	type TRatingKey,
	type TRecipeName,
	type TRecipeTag,
} from '@/data';
import { type ICustomerOrder } from '@/stores';
import type { IMealRecipe, IPopularTrend } from '@/types';
import {
	checkArrayContainsOf,
	checkLengthEmpty,
	intersection,
	toArray,
	toSet,
	union,
} from '@/utilities';
import { Beverage, CustomerRare, Ingredient, Recipe } from '@/utils';
import type { TItemData } from '@/utils/types';

import { checkRecipeEasterEgg, evaluateMeal } from './evaluateMeal';

interface ISuggestedMeal {
	beverage: TBeverageName;
	price: number;
	rating: TRatingKey;
	recipe: IMealRecipe;
}

interface IScoredResult {
	meal: ISuggestedMeal;
	score: number;
	weight: number;
}

interface ISuggestParams {
	cooker: TCookerName | null;
	currentBeverage: TBeverageName | null;
	currentRecipe: IMealRecipe | null;
	customerName: TCustomerRareName;
	customerOrder: ICustomerOrder;
	hasMystiaCooker: boolean;
	hiddenBeverages: ReadonlySet<TBeverageName>;
	hiddenIngredients: ReadonlySet<TIngredientName>;
	hiddenRecipes: ReadonlySet<TRecipeName>;
	isFamousShop: boolean;
	maxExtraIngredients: number | null;
	maxRating: number;
	maxResults: number;
	popularTrend: IPopularTrend;
}

const SCORE_MAP: Record<TRatingKey, number> = {
	bad: 1,
	exbad: 0,
	exgood: 4,
	good: 3,
	norm: 2,
};

const BEAM_WIDTH = 3;
const BUDGET_OVER_PENALTY = 500;
const CACHE_MAX_SIZE = 200;
const GAME_DAY_HOURS = 8;

const MAP_NAME_REGEX = /^【(.+?)】/u;

/* eslint-disable sort-keys */
const MAP_DLC: Record<TPlace, TDlc> = {
	妖怪兽道: 0,
	人间之里: 0,
	博丽神社: 0,
	红魔馆: 0,
	迷途竹林: 0,
	魔法森林: 1,
	妖怪之山: 1,
	旧地狱: 2,
	地灵殿: 2,
	命莲寺: 3,
	神灵庙: 3,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};

const MAP_UNLOCK_TIER: Record<TPlace, number> = {
	妖怪兽道: 0,
	人间之里: 1,
	魔法森林: 1,
	妖怪之山: 1,
	博丽神社: 2,
	旧地狱: 2,
	地灵殿: 2,
	红魔馆: 3,
	命莲寺: 3,
	神灵庙: 3,
	迷途竹林: 4,
	太阳花田: 4,
	辉针城: 4,
	月之都: 5,
	魔界: 5,
};
/* eslint-enable sort-keys */

const CROSS_DLC_MAP_WEIGHT = 0.25;
const COLLECT_CHANNEL_BONUS = 1.2;
const CUSTOMER_BOND_RECIPE_BONUS = 1.2;
const CUSTOMER_HOME_MAP_WEIGHT = 1.5;
const FALLBACK_MAP_WEIGHT = 0.05;
const OWN_DLC_MAP_BONUS = 1.2;
const PROGRESSION_DECAY_PER_TIER = 0.9;
const RECIPE_INGREDIENT_COUNT_EXPONENT = 0.5;

interface IAcquisitionSource {
	readonly buy?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly collect?: ReadonlyArray<string | ReadonlyArray<unknown>>;
	readonly self?: boolean;
	readonly [key: string]: unknown;
}

function getMapWeight(name: string, customerDlc: TDlc, customerPlace: TPlace) {
	const match = MAP_NAME_REGEX.exec(name);
	if (!match?.[1]) {
		return FALLBACK_MAP_WEIGHT;
	}

	const place = match[1] as TPlace;
	if (!(place in MAP_DLC)) {
		return FALLBACK_MAP_WEIGHT;
	}

	const mapDlc = MAP_DLC[place];
	const dlcFactor =
		customerDlc !== 0 && mapDlc === customerDlc
			? OWN_DLC_MAP_BONUS
			: mapDlc === 0 || mapDlc === customerDlc
				? 1
				: CROSS_DLC_MAP_WEIGHT;
	const homeFactor = place === customerPlace ? CUSTOMER_HOME_MAP_WEIGHT : 1;
	const customerTier = MAP_UNLOCK_TIER[customerPlace];
	const mapTier = MAP_UNLOCK_TIER[place];
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

function getIngredientPenalty(
	name: TIngredientName,
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>,
	maxIngredientEase: number
) {
	return 30 * (1 - normalizeEase(name, ingredientEaseMap, maxIngredientEase));
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

	const { easeMap: ingredientEaseMap, maxEase: maxIngredientEase } =
		buildEaseMap(baseGameIngredients, customerDlc, customerPlace);
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
		instance_beverage,
		instance_recipe,
		maxBeverageEase,
		maxIngredientEase,
	};
}

type TSuggestContext = ReturnType<typeof createSuggestContext>;

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

function dedupeScoredResults(
	results: IScoredResult[],
	maxResults: number,
	keyFn: (meal: ISuggestedMeal) => string
) {
	results.sort((a, b) => b.weight - a.weight);

	const seen = new Set<string>();
	const out: ISuggestedMeal[] = [];

	for (const { meal } of results) {
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

function tryAddExtraIngredients({
	baseGameIngredients,
	beverageTags,
	customerBeverageTags,
	customerName,
	customerNegativeTags,
	customerOrder,
	customerPositiveTags,
	extraSlots,
	hasMystiaCooker,
	ingredientEaseMap,
	isFamousShop,
	maxIngredientEase,
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
	extraSlots: number;
	hasMystiaCooker: boolean;
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>;
	isFamousShop: boolean;
	maxIngredientEase: number;
	popularTrend: IPopularTrend;
	recipeIngredients: TIngredientName[];
	recipeName: TRecipeName;
	recipeNegativeTags: ReadonlyArray<TRecipeTag>;
	recipeTagsBase: ReadonlyArray<TRecipeTag>;
}): {
	extraIngredients: TIngredientName[];
	rating: TRatingKey;
	score: number;
	ingredientPenalty: number;
} | null {
	interface IBeamState {
		extras: TIngredientName[];
		extraTags: TIngredientTag[];
		penalty: number;
		rating: TRatingKey;
		score: number;
	}

	const initialState: IBeamState = {
		extras: [],
		extraTags: [],
		penalty: 0,
		rating: 'exbad',
		score: 0,
	};
	let beam: IBeamState[] = [initialState];
	let globalBest: IBeamState = initialState;

	const negativeTagSet = toSet(recipeNegativeTags) as Set<string>;

	for (let slot = 0; slot < extraSlots; slot++) {
		const nextBeam: IBeamState[] = [];

		for (const state of beam) {
			const stateTagBase = toSet(
				recipeTagsBase,
				state.extraTags as ReadonlyArray<TRecipeTag>
			);
			const baseIngredientSet = toSet(recipeIngredients, state.extras);

			for (const ingredientItem of baseGameIngredients) {
				const { name: ingredientName, tags: ingredientTags } =
					ingredientItem;

				if (state.extras.includes(ingredientName)) {
					continue;
				}
				if (checkArrayContainsOf(ingredientTags, negativeTagSet)) {
					continue;
				}

				const tagSet = new Set(stateTagBase);
				for (const tag of ingredientTags) {
					tagSet.add(tag as TRecipeTag);
				}

				Recipe.applyLargePartition(
					tagSet,
					recipeIngredients.length + state.extras.length + 1,
					popularTrend
				);
				Recipe.applyTagCovers(tagSet, popularTrend);
				Recipe.applyFamousShop(tagSet, isFamousShop);
				Recipe.applyPopularTrend(tagSet, popularTrend);

				const currentIngredients = baseIngredientSet.has(ingredientName)
					? toArray(baseIngredientSet)
					: toArray(baseIngredientSet, ingredientName);

				const rating = evaluateMeal({
					currentBeverageTags: beverageTags,
					currentCustomerBeverageTags: customerBeverageTags,
					currentCustomerName: customerName,
					currentCustomerNegativeTags:
						customerNegativeTags as TRecipeTag[],
					currentCustomerOrder: customerOrder,
					currentCustomerPositiveTags:
						customerPositiveTags as TRecipeTag[],
					currentIngredients,
					currentRecipeName: recipeName,
					currentRecipeTagsWithTrend: toArray(tagSet),
					hasMystiaCooker,
					isDarkMatter: false,
				});

				if (rating === null) {
					continue;
				}

				const score = SCORE_MAP[rating];
				const penalty =
					state.penalty +
					getIngredientPenalty(
						ingredientName,
						ingredientEaseMap,
						maxIngredientEase
					);

				nextBeam.push({
					extras: toArray(state.extras, ingredientName),
					extraTags: toArray(state.extraTags, ingredientTags),
					penalty,
					rating,
					score,
				});
			}
		}

		if (checkLengthEmpty(nextBeam)) {
			break;
		}

		nextBeam.sort((a, b) => b.score - a.score || a.penalty - b.penalty);
		beam = nextBeam.slice(0, BEAM_WIDTH);

		const [topCandidate] = beam;
		if (
			topCandidate !== undefined &&
			(topCandidate.score > globalBest.score ||
				(topCandidate.score === globalBest.score &&
					topCandidate.penalty < globalBest.penalty))
		) {
			globalBest = topCandidate;
		}

		if (globalBest.score >= 4) {
			break;
		}
	}

	if (checkLengthEmpty(globalBest.extras)) {
		return null;
	}

	return {
		extraIngredients: globalBest.extras,
		ingredientPenalty: globalBest.penalty,
		rating: globalBest.rating,
		score: globalBest.score,
	};
}

function computeSuggestions(
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
		instance_recipe,
		maxBeverageEase,
		maxIngredientEase,
	}: TSuggestContext
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

	let exgoodCount = 0;

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
		const extraSlots =
			maxExtraIngredients === null
				? 5 - recipeIngredients.length
				: Math.min(5 - recipeIngredients.length, maxExtraIngredients);

		for (const {
			members: beverageMembers,
			tags: beverageTags,
		} of beverageTagGroups.values()) {
			const rating = evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags: customerBeverageTags,
				currentCustomerName: customerName,
				currentCustomerNegativeTags:
					customerNegativeTags as TRecipeTag[],
				currentCustomerOrder: customerOrder,
				currentCustomerPositiveTags:
					customerPositiveTags as TRecipeTag[],
				currentIngredients: recipeIngredients as TIngredientName[],
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

			if (score < 4 && extraSlots > 0) {
				const bestExtra = tryAddExtraIngredients({
					baseGameIngredients: relevantIngredients,
					beverageTags,
					customerBeverageTags,
					customerName,
					customerNegativeTags,
					customerOrder,
					customerPositiveTags,
					extraSlots,
					hasMystiaCooker: false,
					ingredientEaseMap,
					isFamousShop,
					maxIngredientEase,
					popularTrend,
					recipeIngredients: recipeIngredients as TIngredientName[],
					recipeName,
					recipeNegativeTags,
					recipeTagsBase: recipePositiveTags,
				});

				if (
					bestExtra !== null &&
					bestExtra.score > score &&
					bestExtra.score <= maxRating
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
							recipeIngredients as TIngredientName[],
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
						score: finalScore,
						weight:
							finalScore * 10000 +
							acquisitionWeight -
							ingredientPenalty -
							budgetPenalty,
					});
				}
				if (finalScore >= 4) {
					exgoodCount += beverageMembers.length;
				}
			}
		}

		if (exgoodCount >= maxResults * 3) {
			break;
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) =>
			`${m.recipe.name}|${m.beverage}|${m.recipe.extraIngredients.join(',')}`
	);
}

function evaluateCandidate({
	beverageName,
	beveragePrice,
	beverageTags,
	customerBeverageTags,
	customerName,
	customerNegativeTags,
	customerOrder,
	customerPositiveTags,
	extraIngredients,
	hasMystiaCooker,
	instance_recipe,
	isFamousShop,
	popularTrend,
	recipeIngredients,
	recipeName,
	recipeNegativeTags,
	recipePositiveTags,
	recipePrice,
}: {
	beverageName: TBeverageName;
	beveragePrice: number;
	beverageTags: TBeverageTag[];
	customerBeverageTags: TBeverageTag[];
	customerName: TCustomerRareName;
	customerNegativeTags: ReadonlyArray<TRecipeTag>;
	customerOrder: ICustomerOrder;
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	extraIngredients: TIngredientName[];
	hasMystiaCooker: boolean;
	instance_recipe: Recipe;
	isFamousShop: boolean;
	popularTrend: IPopularTrend;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	recipeName: TRecipeName;
	recipeNegativeTags: ReadonlyArray<TRecipeTag>;
	recipePositiveTags: ReadonlyArray<TRecipeTag>;
	recipePrice: number;
}): ISuggestedMeal | null {
	const { extraTags, isDarkMatter } = instance_recipe.checkDarkMatter({
		extraIngredients,
		negativeTags: recipeNegativeTags,
	});

	const composedRecipeTags = instance_recipe.composeTagsWithPopularTrend(
		recipeIngredients,
		extraIngredients,
		recipePositiveTags,
		extraTags,
		popularTrend
	);
	const recipeTagsWithTrend = instance_recipe.calculateTagsWithTrend(
		composedRecipeTags,
		popularTrend,
		isFamousShop
	);

	const rating = evaluateMeal({
		currentBeverageTags: beverageTags,
		currentCustomerBeverageTags: customerBeverageTags,
		currentCustomerName: customerName,
		currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
		currentIngredients: union(
			recipeIngredients as TIngredientName[],
			extraIngredients
		),
		currentRecipeName: recipeName,
		currentRecipeTagsWithTrend: recipeTagsWithTrend,
		hasMystiaCooker,
		isDarkMatter,
	});

	if (rating === null) {
		return null;
	}

	const price =
		beveragePrice +
		(isDarkMatter ? DARK_MATTER_META_MAP.price : recipePrice);

	return {
		beverage: beverageName,
		price,
		rating,
		recipe: { extraIngredients, name: recipeName },
	};
}

function tryIngredientReplacements({
	baseGameIngredients,
	baseScore,
	currentExtras,
	evaluateBaseParams,
	ingredientEaseMap,
	isBaseDarkMatter,
	maxIngredientEase,
}: {
	baseGameIngredients: TItemData<Ingredient>;
	baseScore: number;
	currentExtras: TIngredientName[];
	evaluateBaseParams: Omit<
		Parameters<typeof evaluateCandidate>[0],
		'extraIngredients'
	>;
	ingredientEaseMap: ReadonlyMap<TIngredientName, number>;
	isBaseDarkMatter: boolean;
	maxIngredientEase: number;
}) {
	const { instance_recipe, recipeNegativeTags } = evaluateBaseParams;

	const negativeTagSet = toSet(recipeNegativeTags) as Set<string>;

	let bestReplacement: ISuggestedMeal | null = null;
	let bestReplacementScore = baseScore;
	let bestReplacementPenalty = Infinity;

	for (let i = 0; i < currentExtras.length; i++) {
		const remainingExtras = currentExtras.filter((_, index) => index !== i);

		for (const ingredientItem of baseGameIngredients) {
			const { name: candidateName, tags: candidateTags } = ingredientItem;
			if (candidateName === currentExtras[i]) {
				continue;
			}
			if (remainingExtras.includes(candidateName)) {
				continue;
			}

			if (
				!isBaseDarkMatter &&
				checkArrayContainsOf(candidateTags, negativeTagSet)
			) {
				continue;
			}

			const replacedExtras = toArray(remainingExtras, candidateName);
			const { isDarkMatter: isReplacementDarkMatter } =
				instance_recipe.checkDarkMatter({
					extraIngredients: replacedExtras,
					negativeTags: recipeNegativeTags,
				});

			if (isReplacementDarkMatter && !isBaseDarkMatter) {
				continue;
			}

			const candidate = evaluateCandidate({
				...evaluateBaseParams,
				extraIngredients: replacedExtras,
			});

			if (candidate === null) {
				continue;
			}

			const candidateScore = SCORE_MAP[candidate.rating];
			const candidatePenalty = getIngredientPenalty(
				candidateName,
				ingredientEaseMap,
				maxIngredientEase
			);
			if (
				candidateScore > bestReplacementScore ||
				(candidateScore === bestReplacementScore &&
					candidatePenalty < bestReplacementPenalty)
			) {
				bestReplacementScore = candidateScore;
				bestReplacementPenalty = candidatePenalty;
				bestReplacement = candidate;
			}
		}

		if (bestReplacementScore >= 4) {
			break;
		}
	}

	if (bestReplacementScore < 4 && currentExtras.length >= 2) {
		for (
			let i = 0;
			i < currentExtras.length && bestReplacementScore < 4;
			i++
		) {
			for (
				let j = i + 1;
				j < currentExtras.length && bestReplacementScore < 4;
				j++
			) {
				const remainingExtras = currentExtras.filter(
					(_, k) => k !== i && k !== j
				);

				for (const [idx1, ing1Item] of baseGameIngredients.entries()) {
					const name1 = ing1Item.name;
					if (
						name1 === currentExtras[i] ||
						name1 === currentExtras[j] ||
						remainingExtras.includes(name1)
					) {
						continue;
					}

					if (
						!isBaseDarkMatter &&
						checkArrayContainsOf(ing1Item.tags, negativeTagSet)
					) {
						continue;
					}

					for (const [
						idx2,
						ing2Item,
					] of baseGameIngredients.entries()) {
						if (idx2 <= idx1) {
							continue;
						}

						const name2 = ing2Item.name;
						if (
							name2 === currentExtras[i] ||
							name2 === currentExtras[j] ||
							remainingExtras.includes(name2)
						) {
							continue;
						}

						if (
							!isBaseDarkMatter &&
							checkArrayContainsOf(ing2Item.tags, negativeTagSet)
						) {
							continue;
						}

						const replacedExtras = toArray(
							remainingExtras,
							name1,
							name2
						);
						const { isDarkMatter: isReplacementDarkMatter } =
							instance_recipe.checkDarkMatter({
								extraIngredients: replacedExtras,
								negativeTags: recipeNegativeTags,
							});

						if (isReplacementDarkMatter && !isBaseDarkMatter) {
							continue;
						}

						const candidate = evaluateCandidate({
							...evaluateBaseParams,
							extraIngredients: replacedExtras,
						});

						if (candidate === null) {
							continue;
						}

						const candidateScore = SCORE_MAP[candidate.rating];
						const candidatePenalty =
							getIngredientPenalty(
								name1,
								ingredientEaseMap,
								maxIngredientEase
							) +
							getIngredientPenalty(
								name2,
								ingredientEaseMap,
								maxIngredientEase
							);

						if (
							candidateScore > bestReplacementScore ||
							(candidateScore === bestReplacementScore &&
								candidatePenalty < bestReplacementPenalty)
						) {
							bestReplacementScore = candidateScore;
							bestReplacementPenalty = candidatePenalty;
							bestReplacement = candidate;
						}
					}
				}
			}
		}
	}

	if (bestReplacement !== null && bestReplacementScore > baseScore) {
		return bestReplacement;
	}

	return null;
}

function suggestIngredients(
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
		ingredientEaseMap,
		instance_beverage,
		instance_recipe,
		maxIngredientEase,
	}: TSuggestContext,
	currentRecipe: IMealRecipe,
	currentBeverage: TBeverageName
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
		if (checkLengthEmpty(currentRecipe.extraIngredients)) {
			return [];
		}

		const { isDarkMatter: isBaseDarkMatter } =
			instance_recipe.checkDarkMatter({
				extraIngredients: currentRecipe.extraIngredients,
				negativeTags: recipeNegativeTags,
			});

		const baseMeal = evaluateCandidate({
			beverageName: currentBeverage,
			beveragePrice,
			beverageTags,
			customerBeverageTags,
			customerName,
			customerNegativeTags,
			customerOrder,
			customerPositiveTags,
			extraIngredients: currentRecipe.extraIngredients,
			hasMystiaCooker,
			instance_recipe,
			isFamousShop,
			popularTrend,
			recipeIngredients,
			recipeName: currentRecipe.name,
			recipeNegativeTags,
			recipePositiveTags,
			recipePrice,
		});

		const baseScore = baseMeal === null ? 0 : SCORE_MAP[baseMeal.rating];
		if (baseScore >= 4) {
			return [];
		}

		const replacement = tryIngredientReplacements({
			baseGameIngredients,
			baseScore,
			currentExtras: currentRecipe.extraIngredients,
			evaluateBaseParams: {
				beverageName: currentBeverage,
				beveragePrice,
				beverageTags,
				customerBeverageTags,
				customerName,
				customerNegativeTags,
				customerOrder,
				customerPositiveTags,
				hasMystiaCooker,
				instance_recipe,
				isFamousShop,
				popularTrend,
				recipeIngredients,
				recipeName: currentRecipe.name,
				recipeNegativeTags,
				recipePositiveTags,
				recipePrice,
			},
			ingredientEaseMap,
			isBaseDarkMatter,
			maxIngredientEase,
		});

		return replacement === null ||
			replacement.price > budgetMax ||
			SCORE_MAP[replacement.rating] > maxRating
			? []
			: [replacement];
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
		currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
		currentCustomerOrder: customerOrder,
		currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
		currentIngredients: allCurrentIngredients,
		currentRecipeName: currentRecipe.name,
		currentRecipeTagsWithTrend: baseRecipeTagsWithTrend,
		hasMystiaCooker,
		isDarkMatter: false,
	});

	const baseScore = baseRating === null ? 0 : SCORE_MAP[baseRating];

	if (baseScore >= 4) {
		return [];
	}

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);

	const bestExtra = tryAddExtraIngredients({
		baseGameIngredients: relevantIngredients,
		beverageTags,
		customerBeverageTags,
		customerName,
		customerNegativeTags,
		customerOrder,
		customerPositiveTags,
		extraSlots,
		hasMystiaCooker,
		ingredientEaseMap,
		isFamousShop,
		maxIngredientEase,
		popularTrend,
		recipeIngredients: allCurrentIngredients,
		recipeName: currentRecipe.name,
		recipeNegativeTags,
		recipeTagsBase: composedBaseRecipeTags as ReadonlyArray<TRecipeTag>,
	});

	if (
		bestExtra !== null &&
		bestExtra.score > baseScore &&
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

function suggestForBeverage(
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
		instance_beverage,
		instance_recipe,
		maxIngredientEase,
	}: TSuggestContext,
	currentBeverage: TBeverageName
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

	let exgoodCount = 0;

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
		const rating = evaluateMeal({
			currentBeverageTags: beverageTags,
			currentCustomerBeverageTags: customerBeverageTags,
			currentCustomerName: customerName,
			currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
			currentCustomerOrder: customerOrder,
			currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
			currentIngredients: recipeIngredients as TIngredientName[],
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
		if (score < 4 && extraSlots > 0) {
			const bestExtra = tryAddExtraIngredients({
				baseGameIngredients: relevantIngredients,
				beverageTags,
				customerBeverageTags,
				customerName,
				customerNegativeTags,
				customerOrder,
				customerPositiveTags,
				extraSlots,
				hasMystiaCooker,
				ingredientEaseMap,
				isFamousShop,
				maxIngredientEase,
				popularTrend,
				recipeIngredients: recipeIngredients as TIngredientName[],
				recipeName,
				recipeNegativeTags,
				recipeTagsBase: recipePositiveTags,
			});

			if (
				bestExtra !== null &&
				bestExtra.score > score &&
				bestExtra.score <= maxRating
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
					recipeIngredients as TIngredientName[],
					ingredientEaseMap,
					maxIngredientEase
				) * bondBonus;

			results.push({
				meal: bestMeal,
				score,
				weight:
					score * 10000 +
					acquisitionWeight -
					ingredientPenalty -
					budgetPenalty,
			});
			if (score >= 4) {
				exgoodCount++;
			}
		}

		if (exgoodCount >= maxResults * 3) {
			break;
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) => `${m.recipe.name}|${m.recipe.extraIngredients.join(',')}`
	);
}

function suggestForRecipe(
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
		ingredientEaseMap,
		instance_recipe,
		maxBeverageEase,
		maxIngredientEase,
	}: TSuggestContext,
	currentRecipe: IMealRecipe
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

	let exgoodCount = 0;

	for (const {
		members: beverageMembers,
		tags: beverageTags,
	} of beverageTagGroups.values()) {
		const rating = evaluateMeal({
			currentBeverageTags: beverageTags,
			currentCustomerBeverageTags: customerBeverageTags,
			currentCustomerName: customerName,
			currentCustomerNegativeTags: customerNegativeTags as TRecipeTag[],
			currentCustomerOrder: customerOrder,
			currentCustomerPositiveTags: customerPositiveTags as TRecipeTag[],
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

		if (baseScore < 4 && extraSlots > 0 && !isBaseDarkMatter) {
			const bestExtra = tryAddExtraIngredients({
				baseGameIngredients: relevantIngredients,
				beverageTags,
				customerBeverageTags,
				customerName,
				customerNegativeTags,
				customerOrder,
				customerPositiveTags,
				extraSlots,
				hasMystiaCooker,
				ingredientEaseMap,
				isFamousShop,
				maxIngredientEase,
				popularTrend,
				recipeIngredients: allCurrentIngredients,
				recipeName: currentRecipe.name,
				recipeNegativeTags,
				recipeTagsBase: composedRecipeTags as ReadonlyArray<TRecipeTag>,
			});

			if (
				bestExtra !== null &&
				bestExtra.score > baseScore &&
				bestExtra.score <= maxRating
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
					score: finalScore,
					weight:
						finalScore * 10000 +
						acquisitionWeight -
						ingredientPenalty -
						budgetPenalty,
				});
			}
			if (finalScore >= 4) {
				exgoodCount += beverageMembers.length;
			}
		}

		if (exgoodCount >= maxResults * 3) {
			break;
		}
	}

	return dedupeScoredResults(
		results,
		maxResults,
		(m) => `${m.beverage}|${m.recipe.extraIngredients.join(',')}`
	);
}

function suggestBySelection(params: ISuggestParams, context: TSuggestContext) {
	const { currentBeverage, currentRecipe } = params;

	if (currentRecipe !== null && currentBeverage !== null) {
		return suggestIngredients(
			params,
			context,
			currentRecipe,
			currentBeverage
		);
	}
	if (currentRecipe !== null) {
		return suggestForRecipe(params, context, currentRecipe);
	}
	if (currentBeverage !== null) {
		return suggestForBeverage(params, context, currentBeverage);
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

export function getScoreBasedAlternatives({
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
}: IScoreBasedAlternativesParams): Map<TIngredientName, TIngredientName[]> {
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

	for (const [pos, targetName] of extraIngredients.entries()) {
		const otherExtras = extraIngredients.filter((_, i) => i !== pos);
		const candidates: Array<{ name: TIngredientName; score: number }> = [];

		for (const item of filteredCandidates) {
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
				tagSet.add(tag as string);
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

			const rating = evaluateMeal({
				currentBeverageTags: beverageTags,
				currentCustomerBeverageTags:
					customerBeverageTags as TBeverageTag[],
				currentCustomerName: customerName,
				currentCustomerNegativeTags:
					customerNegativeTags as TRecipeTag[],
				currentCustomerOrder: customerOrder,
				currentCustomerPositiveTags:
					customerPositiveTags as TRecipeTag[],
				currentIngredients: union(
					recipeIngredients as TIngredientName[],
					replacedExtras
				),
				currentRecipeName: recipeName,
				currentRecipeTagsWithTrend: tagsWithTrend,
				hasMystiaCooker,
				isDarkMatter,
			});

			if (rating !== null && SCORE_MAP[rating] >= baseScore) {
				candidates.push({ name: item.name, score: SCORE_MAP[rating] });
			}
		}

		candidates.sort((a, b) => b.score - a.score);
		result.set(
			targetName,
			candidates.map((c) => c.name)
		);
	}

	return result;
}

const suggestCache = new Map<string, ISuggestedMeal[]>();

export function suggestMeals(params: ISuggestParams) {
	const cacheKey = buildCacheKey(params);

	const cached = suggestCache.get(cacheKey);
	if (cached !== undefined) {
		suggestCache.delete(cacheKey);
		suggestCache.set(cacheKey, cached);
		return cached;
	}

	const { currentBeverage, currentRecipe } = params;
	const context = createSuggestContext(params);
	const result =
		currentBeverage !== null || currentRecipe !== null
			? suggestBySelection(params, context)
			: computeSuggestions(params, context);

	suggestCache.set(cacheKey, result);

	if (suggestCache.size > CACHE_MAX_SIZE) {
		const oldestKey = suggestCache.keys().next().value;
		if (oldestKey !== undefined) {
			suggestCache.delete(oldestKey);
		}
	}

	return result;
}
