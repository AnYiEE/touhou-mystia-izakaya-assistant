import {
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
const EARLY_LOCATION_WEIGHTS: ReadonlyArray<TPlace> = [
	'妖怪兽道',
	'人间之里',
	'博丽神社',
	'红魔馆',
	'迷途竹林',
];

function getIngredientLocationPenalty(
	{ from }: TItemData<Ingredient>[number],
	maxIngredientIndex: number,
	ingredientIndex: number
) {
	if (typeof from === 'string') {
		return (ingredientIndex / maxIngredientIndex) * 30;
	}

	const sources = [
		...('collect' in from
			? from.collect.map((entry) =>
					typeof entry === 'string' ? entry : entry[0]
				)
			: []),
		...('buy' in from
			? from.buy.map((entry) =>
					typeof entry === 'string' ? entry : entry[0]
				)
			: []),
	];

	const bestLocationRank = sources.reduce((best, source) => {
		const match = /^【(.+?)】/u.exec(source);
		if (!match?.[1]) {
			return best;
		}
		const rank = EARLY_LOCATION_WEIGHTS.indexOf(match[1] as TPlace);
		return rank !== -1 && (best === -1 || rank < best) ? rank : best;
	}, -1);

	if (bestLocationRank !== -1) {
		return (bestLocationRank / EARLY_LOCATION_WEIGHTS.length) * 30;
	}

	return (ingredientIndex / maxIngredientIndex) * 30;
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
		positiveTags: customerPositiveTags,
		price: customerPrice,
	} = instance_customer.getPropsByName(customerName);

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

	return {
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		instance_beverage,
		instance_recipe,
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
	members: Array<{
		name: TBeverageName;
		originalIndex: number;
		price: number;
	}>;
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
	const list = baseGameRecipes.map((recipe, originalIndex) => {
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

		let suitability: number;

		if (easterEggScore > 0) {
			suitability = Infinity;
		} else if (easterEggScore < 0) {
			suitability = -Infinity;
		} else {
			({ suitability } = instance_recipe.getCustomerSuitability(
				recipeTagsWithTrend,
				customerPositiveTags,
				customerNegativeTags
			));
		}

		return { originalIndex, recipe, recipeTagsWithTrend, suitability };
	});

	list.sort((a, b) => b.suitability - a.suitability);

	return list;
}

function buildBeverageTagGroups(beverages: TItemData<Beverage>) {
	const groups = new Map<string, IBeverageTagGroup>();

	beverages.forEach(({ name, price, tags }, index) => {
		const tagKey = toArray(tags).sort().join(',');
		let group = groups.get(tagKey);
		if (group === undefined) {
			group = { members: [], tags };
			groups.set(tagKey, group);
		}
		group.members.push({ name, originalIndex: index, price });
	});

	return groups;
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
	isFamousShop,
	maxIngredientIndex,
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
	isFamousShop: boolean;
	maxIngredientIndex: number;
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

			for (const [
				index,
				ingredientItem,
			] of baseGameIngredients.entries()) {
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
					getIngredientLocationPenalty(
						ingredientItem,
						maxIngredientIndex,
						index
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
		maxResults,
		popularTrend,
	}: ISuggestParams,
	{
		baseGameBeverages,
		baseGameIngredients,
		baseGameRecipes,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		instance_recipe,
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

	const maxRecipeIndex = Math.max(baseGameRecipes.length - 1, 1);
	const maxBeverageIndex = Math.max(filteredBeverages.length - 1, 1);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);
	const maxIngredientIndex = Math.max(relevantIngredients.length - 1, 1);

	const recipesWithSuitability = buildRecipeSuitabilityList(
		instance_recipe,
		baseGameRecipes,
		customerName,
		customerPositiveTags,
		customerNegativeTags,
		popularTrend,
		isFamousShop
	);

	interface ICandidate {
		beverageName: TBeverageName;
		beveragePrice: number;
		extraIngredients: TIngredientName[];
		rating: TRatingKey;
		recipeName: TRecipeName;
		recipePrice: number;
		score: number;
		weight: number;
	}

	const candidates: ICandidate[] = [];

	const beverageTagGroups = buildBeverageTagGroups(filteredBeverages);

	let exgoodCandidateCount = 0;

	for (const {
		originalIndex: recipeIndex,
		recipe: {
			ingredients: recipeIngredients,
			name: recipeName,
			negativeTags: recipeNegativeTags,
			positiveTags: recipePositiveTags,
			price: recipePrice,
		},
		recipeTagsWithTrend,
	} of recipesWithSuitability) {
		const extraSlots = 5 - recipeIngredients.length;

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
					isFamousShop,
					maxIngredientIndex,
					popularTrend,
					recipeIngredients: recipeIngredients as TIngredientName[],
					recipeName,
					recipeNegativeTags,
					recipeTagsBase: recipePositiveTags,
				});

				if (bestExtra !== null && bestExtra.score > score) {
					finalScore = bestExtra.score;
					finalRating = bestExtra.rating;
					finalExtra = bestExtra.extraIngredients;
					ingredientPenalty = bestExtra.ingredientPenalty;
				}
			}

			if (finalScore >= 3) {
				for (const {
					name: beverageName,
					originalIndex: bevIndex,
					price: beveragePrice,
				} of beverageMembers) {
					const totalPrice = beveragePrice + recipePrice;
					if (totalPrice > budgetMax) {
						continue;
					}

					const budgetPenalty =
						totalPrice > budgetSoftMax ? BUDGET_OVER_PENALTY : 0;
					const acquisitionWeight =
						((maxRecipeIndex - recipeIndex) / maxRecipeIndex) *
							100 +
						((maxBeverageIndex - bevIndex) / maxBeverageIndex) *
							100;

					candidates.push({
						beverageName,
						beveragePrice,
						extraIngredients: finalExtra,
						rating: finalRating,
						recipeName,
						recipePrice,
						score: finalScore,
						weight:
							finalScore * 10000 +
							acquisitionWeight -
							ingredientPenalty -
							budgetPenalty,
					});
				}
				if (finalScore >= 4) {
					exgoodCandidateCount += beverageMembers.length;
				}
			}
		}

		if (exgoodCandidateCount >= maxResults * 3) {
			break;
		}
	}

	candidates.sort((a, b) => b.weight - a.weight);

	const seen = new Set<string>();
	const results: ISuggestedMeal[] = [];

	for (const candidate of candidates) {
		const key = `${candidate.recipeName}|${candidate.beverageName}|${candidate.extraIngredients.join(',')}`;
		if (seen.has(key)) {
			continue;
		}
		seen.add(key);

		const price = candidate.beveragePrice + candidate.recipePrice;

		results.push({
			beverage: candidate.beverageName,
			price,
			rating: candidate.rating,
			recipe: {
				extraIngredients: candidate.extraIngredients,
				name: candidate.recipeName,
			},
		});

		if (results.length >= maxResults) {
			break;
		}
	}

	return results;
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
	customerPositiveTags: ReadonlyArray<TRecipeTag>;
	extraIngredients: TIngredientName[];
	hasMystiaCooker: boolean;
	instance_recipe: Recipe;
	isFamousShop: boolean;
	customerOrder: ICustomerOrder;
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
	isBaseDarkMatter,
}: {
	baseGameIngredients: TItemData<Ingredient>;
	baseScore: number;
	currentExtras: TIngredientName[];
	evaluateBaseParams: Omit<
		Parameters<typeof evaluateCandidate>[0],
		'extraIngredients'
	>;
	isBaseDarkMatter: boolean;
}) {
	const { instance_recipe, recipeNegativeTags } = evaluateBaseParams;

	const maxIngredientIndex = Math.max(baseGameIngredients.length - 1, 1);
	const negativeTagSet = toSet(recipeNegativeTags) as Set<string>;

	let bestReplacement: ISuggestedMeal | null = null;
	let bestReplacementScore = baseScore;
	let bestReplacementPenalty = Infinity;

	for (let i = 0; i < currentExtras.length; i++) {
		const remainingExtras = currentExtras.filter((_, index) => index !== i);

		for (const [
			ingredientIndex,
			ingredientItem,
		] of baseGameIngredients.entries()) {
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
			const candidatePenalty = getIngredientLocationPenalty(
				ingredientItem,
				maxIngredientIndex,
				ingredientIndex
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
							getIngredientLocationPenalty(
								ing1Item,
								maxIngredientIndex,
								idx1
							) +
							getIngredientLocationPenalty(
								ing2Item,
								maxIngredientIndex,
								idx2
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
		popularTrend,
	}: ISuggestParams,
	{
		baseGameIngredients,
		budgetMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		instance_beverage,
		instance_recipe,
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
	const extraSlots = 5 - allCurrentIngredients.length;

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
			isBaseDarkMatter,
		});

		return replacement === null || replacement.price > budgetMax
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
	const maxIngredientIndex = Math.max(relevantIngredients.length - 1, 1);

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
		isFamousShop,
		maxIngredientIndex,
		popularTrend,
		recipeIngredients: allCurrentIngredients,
		recipeName: currentRecipe.name,
		recipeNegativeTags,
		recipeTagsBase: composedBaseRecipeTags as ReadonlyArray<TRecipeTag>,
	});

	if (bestExtra !== null && bestExtra.score > baseScore) {
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
		instance_beverage,
		instance_recipe,
	}: TSuggestContext,
	currentBeverage: TBeverageName
) {
	const { recipeTag: orderRecipeTag } = customerOrder;

	const { price: beveragePrice, tags: beverageTags } =
		instance_beverage.getPropsByName(currentBeverage);

	const maxRecipeIndex = Math.max(baseGameRecipes.length - 1, 1);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);
	const maxIngredientIndex = Math.max(relevantIngredients.length - 1, 1);

	interface IScoredResult {
		meal: ISuggestedMeal;
		score: number;
		weight: number;
	}

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
		originalIndex: recipeIndex,
		recipe: {
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
		const extraSlots = 5 - recipeIngredients.length;
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
				isFamousShop,
				maxIngredientIndex,
				popularTrend,
				recipeIngredients: recipeIngredients as TIngredientName[],
				recipeName,
				recipeNegativeTags,
				recipeTagsBase: recipePositiveTags,
			});

			if (bestExtra !== null && bestExtra.score > score) {
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

		if (score >= 3) {
			const totalPrice = bestMeal.price;
			if (totalPrice > budgetMax) {
				continue;
			}

			const budgetPenalty =
				totalPrice > budgetSoftMax ? BUDGET_OVER_PENALTY : 0;
			const acquisitionWeight =
				((maxRecipeIndex - recipeIndex) / maxRecipeIndex) * 100;

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

	results.sort((a, b) => b.weight - a.weight);

	const seen = new Set<string>();
	const out: ISuggestedMeal[] = [];
	for (const { meal } of results) {
		const key = `${meal.recipe.name}|${meal.recipe.extraIngredients.join(',')}`;
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

function suggestForRecipe(
	{
		customerName,
		customerOrder,
		hasMystiaCooker,
		isFamousShop,
		maxResults,
		popularTrend,
	}: ISuggestParams,
	{
		baseGameBeverages,
		baseGameIngredients,
		budgetMax,
		budgetSoftMax,
		customerBeverageTags,
		customerNegativeTags,
		customerPositiveTags,
		instance_recipe,
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
	const maxBeverageIndex = Math.max(filteredBeverages.length - 1, 1);

	const relevantIngredients = filterRelevantIngredients(
		baseGameIngredients,
		customerPositiveTags,
		customerNegativeTags,
		orderRecipeTag
	);
	const maxIngredientIndex = Math.max(relevantIngredients.length - 1, 1);

	const recipe = instance_recipe.getPropsByName(currentRecipe.name);
	const {
		ingredients: recipeIngredients,
		negativeTags: recipeNegativeTags,
		positiveTags: recipePositiveTags,
		price: recipePrice,
	} = recipe;

	interface IScoredResult {
		meal: ISuggestedMeal;
		score: number;
		weight: number;
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

	const allCurrentIngredients = toArray(
		recipeIngredients,
		currentRecipe.extraIngredients
	);

	const beverageTagGroups = buildBeverageTagGroups(filteredBeverages);

	const extraSlots = 5 - allCurrentIngredients.length;

	let exgoodCandidateCount = 0;

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
				isFamousShop,
				maxIngredientIndex,
				popularTrend,
				recipeIngredients: allCurrentIngredients,
				recipeName: currentRecipe.name,
				recipeNegativeTags,
				recipeTagsBase: composedRecipeTags as ReadonlyArray<TRecipeTag>,
			});

			if (bestExtra !== null && bestExtra.score > baseScore) {
				useExtra = true;
				finalScore = bestExtra.score;
				extraIngredients = bestExtra.extraIngredients;
				finalRating = bestExtra.rating;
				ingredientPenalty = bestExtra.ingredientPenalty;
			}
		}

		if (finalScore >= 3) {
			const baseRecipePrice = isBaseDarkMatter
				? DARK_MATTER_META_MAP.price
				: recipePrice;

			for (const {
				name: beverageName,
				originalIndex: bevIndex,
				price: beveragePrice,
			} of beverageMembers) {
				const bestMeal: ISuggestedMeal = useExtra
					? {
							beverage: beverageName,
							price: beveragePrice + recipePrice,
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
				const acquisitionWeight =
					((maxBeverageIndex - bevIndex) / maxBeverageIndex) * 100;

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
				exgoodCandidateCount += beverageMembers.length;
			}
		}

		if (exgoodCandidateCount >= maxResults * 3) {
			break;
		}
	}

	results.sort((a, b) => b.weight - a.weight);

	const seen = new Set<string>();
	const out: ISuggestedMeal[] = [];

	for (const { meal } of results) {
		const key = `${meal.beverage}|${meal.recipe.extraIngredients.join(',')}`;
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
		maxResults.toString(),
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

	const otherExtrasPerPos: TIngredientName[][] = [];
	const baseTagSets: Array<Set<string>> = [];
	for (let pos = 0; pos < extraIngredients.length; pos++) {
		const otherExtras = extraIngredients.filter((_, i) => i !== pos);
		otherExtrasPerPos[pos] = otherExtras;
		const otherTags = otherExtras.flatMap((e) =>
			instance_ingredient.getPropsByName(e, 'tags')
		);
		baseTagSets[pos] = toSet(recipePositiveTags, otherTags as TRecipeTag[]);
	}

	const totalIngredientCount =
		recipeIngredients.length + extraIngredients.length;

	for (const [pos, extraIngredient] of extraIngredients.entries()) {
		const targetName = extraIngredient;
		const otherExtras = otherExtrasPerPos[pos] as TIngredientName[];
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
