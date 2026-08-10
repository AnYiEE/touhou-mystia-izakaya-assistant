'use client';

import { type Selection } from '@heroui/table';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';

import type { TCookerName } from '@/domain/data/cookers/types';
import type { TCustomerRareName } from '@/domain/data/customers/rare/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import { getRestExtraIngredients } from '@/domain/meals/getRestExtraIngredients';
import type { ICustomerOrder } from '@/domain/orders/types';
import type { ISuggestParams } from '@/domain/recommendations/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { recommendationPreferencesFacade } from '@/features/preferences/client/recommendationPreferencesFacade';
import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';
import { RECOMMENDATION_CACHE_READ_GRACE_MS } from '@/features/recommendations/client/cache/constants';
import { recordRecommendationCacheResolution } from '@/features/recommendations/client/cache/debug';
import { resolvePersistentRecommendationRace } from '@/features/recommendations/client/cache/race';
import {
	readSuggestedMealCardResult,
	writeSuggestedMealCardResult,
} from '@/features/recommendations/client/cache/results';
import { checkSuggestMealsAbortError } from '@/features/recommendations/client/scheduler';
import { suggestedMealsUiStore } from '@/features/recommendations/client/state/suggestedMealsUiStore';
import {
	buildSuggestMealsCacheKey,
	getScoreBasedAlternatives,
	readSuggestedMealsMemoryCache,
	suggestMeals,
} from '@/features/recommendations/client/suggestMeals';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import { customerRareStore } from './state/store';

type TSuggestions = Awaited<ReturnType<typeof suggestMeals>> | null;
type TSuggestedMeal = NonNullable<TSuggestions>[number];
type TSuggestionStatus =
	| 'error'
	| 'idle'
	| 'pending'
	| 'refreshing'
	| 'success';
type TAlternativesStatus = 'error' | 'idle' | 'pending' | 'success';

const EMPTY_ALTERNATIVES: TIngredientName[] = [];
const EMPTY_ALTERNATIVES_MAP = new Map<string, IAlternativesEntry>();

interface IAlternativesState {
	generation: number;
	map: Map<string, IAlternativesEntry>;
}

interface IAlternativesEntry {
	map: Map<TIngredientName, TIngredientName[]>;
	status: Exclude<TAlternativesStatus, 'idle'>;
}

interface ISuggestionsState {
	activeRequestKey: string | null;
	generation: number;
	resultContext: ISuggestionResultContext | null;
	resultGeneration: number;
	status: TSuggestionStatus;
	suggestions: TSuggestions;
}

interface ISuggestionResultContext {
	readonly customerName: TCustomerRareName;
	readonly customerOrder: ICustomerOrder;
	readonly hasMystiaCooker: boolean;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenIngredients: ReadonlySet<TIngredientName>;
	readonly isFamousShop: boolean;
	readonly popularTrend: IPopularTrend;
}

interface ISuggestedMealRowViewModel {
	beverage: TSuggestedMeal['beverage'];
	alternativesStatus: TAlternativesStatus;
	cooker: TCookerName;
	ensureAlternatives: () => void;
	getAlternatives: (
		ingredientName: TIngredientName
	) => ReadonlyArray<TIngredientName>;
	hasAlternativesLoaded: boolean;
	key: string;
	price: TSuggestedMeal['price'];
	ratingKey: TSuggestedMeal['rating'];
	recipeData: TSuggestedMeal['recipe'];
	recipeDisplayName:
		| TSuggestedMeal['recipe']['name']
		| typeof DARK_MATTER_META_MAP.name;
	recipeIngredients: ReadonlyArray<TIngredientName>;
	visibleExtraIngredients: TIngredientName[];
}

export function useSuggestedMealsViewModel() {
	const { isHighAppearance } = useDesignPreferences();

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const currentCustomerOrder = customerRareStore.shared.customer.order.use();
	const currentCustomerPopularTrend =
		customerRareStore.shared.customer.popularTrend.use();

	const isFamousShop = customerRareStore.shared.customer.famousShop.use();

	const currentBeverageName = customerRareStore.shared.beverage.name.use();
	const currentRecipeData = customerRareStore.shared.recipe.data.use();

	const hasMystiaCooker =
		customerRareStore.shared.customer.hasMystiaCooker.use();
	const hiddenBeverages =
		customerRareStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenDlcs = customerRareStore.shared.hiddenItems.dlcs.use();
	const hiddenIngredients =
		customerRareStore.shared.recipe.table.hiddenIngredients.use();
	const hiddenRecipes =
		customerRareStore.shared.recipe.table.hiddenRecipes.use();

	const isSuggestEnabled = recommendationPreferencesFacade.enabled.use();
	const selectedSuggestMealsCooker = suggestedMealsUiStore.cooker.use();
	const suggestMaxExtraIngredients =
		recommendationPreferencesFacade.maxExtraIngredients.use();
	const suggestMaxRating = recommendationPreferencesFacade.maxRating.use();
	const suggestMaxResults = recommendationPreferencesFacade.maxResults.use();

	const availableRecipeCookers =
		customerRareStore.availableRecipeCookers.use();
	const selectableMaxExtraIngredients =
		globalStore.shared.suggestMeals.selectableMaxExtraIngredients.get();
	const selectableMaxRatings =
		globalStore.shared.suggestMeals.selectableMaxRatings.get();

	const instance_beverage = customerRareStore.instances.beverage.get();
	const instance_customer = customerRareStore.instances.customer.get();
	const instance_ingredient = customerRareStore.instances.ingredient.get();
	const instance_recipe = customerRareStore.instances.recipe.get();

	const suggestionGenerationRef = useRef(0);
	const alternativeControllersRef = useRef(
		new Map<string, AbortController>()
	);
	const [suggestionsState, setSuggestionsState] = useState<ISuggestionsState>(
		() => ({
			activeRequestKey: null,
			generation: 0,
			resultContext: null,
			resultGeneration: 0,
			status: 'idle',
			suggestions: null,
		})
	);
	const [alternativesState, setAlternativesState] =
		useState<IAlternativesState>(() => ({ generation: 0, map: new Map() }));

	const selectedCookerKeys = useMemo<SelectionSet>(
		() =>
			selectedSuggestMealsCooker === null
				? new Set()
				: new Set([selectedSuggestMealsCooker]),
		[selectedSuggestMealsCooker]
	);

	const selectedMaxExtraKeys = useMemo<SelectionSet>(
		() =>
			new Set([
				suggestMaxExtraIngredients === null
					? ''
					: suggestMaxExtraIngredients.toString(),
			]),
		[suggestMaxExtraIngredients]
	);

	const selectedMaxRatingKeys = useMemo<SelectionSet>(
		() => new Set([suggestMaxRating.toString()]),
		[suggestMaxRating]
	);

	const handleCookerChange = useCallback((keys: Selection) => {
		const selected = [...(keys === 'all' ? [keys] : keys)];
		const cooker = (selected[0] as TCookerName | undefined) ?? null;
		suggestedMealsUiStore.cooker.set(cooker);
	}, []);

	const handleMaxExtraChange = useCallback((keys: Selection) => {
		const selected = [...(keys === 'all' ? [keys] : keys)];
		const value = selected[0] as string | undefined;
		recommendationPreferencesFacade.maxExtraIngredients.set(
			value === undefined || value === '' ? null : Number.parseInt(value)
		);
	}, []);

	const handleMaxRatingChange = useCallback((keys: Selection) => {
		const selected = [...(keys === 'all' ? [keys] : keys)];
		const value = selected[0] as string | undefined;
		if (value !== undefined) {
			recommendationPreferencesFacade.maxRating.set(
				Number.parseInt(value)
			);
		}
	}, []);

	useEffect(() => {
		if (currentRecipeData === null) {
			suggestedMealsUiStore.cooker.set(null);
			return;
		}

		suggestedMealsUiStore.cooker.set(
			instance_recipe.resolveMealRecipe(currentRecipeData).cooker
		);
	}, [currentRecipeData, instance_recipe]);

	const hasSelection =
		currentBeverageName !== null || currentRecipeData !== null;
	const hasOrderTags =
		currentCustomerOrder.beverageTag !== null &&
		currentCustomerOrder.recipeTag !== null;
	const isActive =
		isSuggestEnabled &&
		currentCustomerName !== null &&
		(hasOrderTags || (hasMystiaCooker && hasSelection));

	const hasUnsetPopularOrderTag =
		(currentCustomerOrder.recipeTag === DYNAMIC_TAG_MAP.popularPositive ||
			currentCustomerOrder.recipeTag ===
				DYNAMIC_TAG_MAP.popularNegative) &&
		currentCustomerPopularTrend.tag === null;
	const suggestParams = useMemo<ISuggestParams | null>(
		() =>
			currentCustomerName === null
				? null
				: {
						cooker: selectedSuggestMealsCooker,
						currentBeverage: currentBeverageName,
						currentRecipe: currentRecipeData,
						customerName: currentCustomerName,
						customerOrder: currentCustomerOrder,
						hasMystiaCooker,
						hiddenBeverages,
						hiddenDlcs,
						hiddenIngredients,
						hiddenRecipes,
						isFamousShop,
						maxExtraIngredients: suggestMaxExtraIngredients,
						maxRating: suggestMaxRating,
						maxResults: suggestMaxResults,
						popularTrend: currentCustomerPopularTrend,
					},
		[
			currentBeverageName,
			currentCustomerName,
			currentCustomerOrder,
			currentCustomerPopularTrend,
			currentRecipeData,
			hasMystiaCooker,
			hiddenBeverages,
			hiddenDlcs,
			hiddenIngredients,
			hiddenRecipes,
			isFamousShop,
			selectedSuggestMealsCooker,
			suggestMaxExtraIngredients,
			suggestMaxRating,
			suggestMaxResults,
		]
	);
	const suggestionRequestKey = useMemo(
		() =>
			suggestParams === null
				? 'inactive'
				: buildSuggestMealsCacheKey(suggestParams),
		[suggestParams]
	);

	useEffect(() => {
		const generation = ++suggestionGenerationRef.current;
		const controller = new AbortController();

		if (!isActive || hasUnsetPopularOrderTag || suggestParams === null) {
			setSuggestionsState({
				activeRequestKey: suggestionRequestKey,
				generation,
				resultContext: null,
				resultGeneration: 0,
				status: 'idle',
				suggestions: null,
			});
			return () => {
				controller.abort();
			};
		}

		const resultContext: ISuggestionResultContext = {
			customerName: suggestParams.customerName,
			customerOrder: { ...suggestParams.customerOrder },
			hasMystiaCooker: suggestParams.hasMystiaCooker,
			hiddenDlcs: new Set(suggestParams.hiddenDlcs),
			hiddenIngredients: new Set(suggestParams.hiddenIngredients),
			isFamousShop: suggestParams.isFamousShop,
			popularTrend: { ...suggestParams.popularTrend },
		};
		const memorySuggestions = readSuggestedMealsMemoryCache(suggestParams);
		if (memorySuggestions !== undefined) {
			recordRecommendationCacheResolution('suggestedMealCard', 'memory');
			setSuggestionsState({
				activeRequestKey: suggestionRequestKey,
				generation,
				resultContext,
				resultGeneration: generation,
				status: 'success',
				suggestions: memorySuggestions,
			});
			return () => {
				controller.abort();
			};
		}

		setSuggestionsState((prev) => ({
			...prev,
			activeRequestKey: suggestionRequestKey,
			generation,
			status: prev.suggestions === null ? 'pending' : 'refreshing',
		}));

		const run = async () => {
			try {
				const { result: suggestions, source } =
					await resolvePersistentRecommendationRace({
						compute: (signal) =>
							suggestMeals(suggestParams, { signal }),
						graceMs: RECOMMENDATION_CACHE_READ_GRACE_MS,
						readPersistent: () =>
							readSuggestedMealCardResult(suggestionRequestKey),
						signal: controller.signal,
					});

				if (
					controller.signal.aborted ||
					suggestionGenerationRef.current !== generation
				) {
					return;
				}
				recordRecommendationCacheResolution(
					'suggestedMealCard',
					source
				);
				setSuggestionsState({
					activeRequestKey: suggestionRequestKey,
					generation,
					resultContext,
					resultGeneration: generation,
					status: 'success',
					suggestions,
				});
				if (source === 'compute') {
					void writeSuggestedMealCardResult(
						suggestionRequestKey,
						suggestions
					);
				}
			} catch (error) {
				if (
					controller.signal.aborted ||
					checkSuggestMealsAbortError(error) ||
					suggestionGenerationRef.current !== generation
				) {
					return;
				}

				console.warn('Suggested meal calculation failed.', {
					errorCode: getLogSafeErrorCode(error),
				});
				setSuggestionsState((prev) =>
					prev.generation === generation
						? { ...prev, status: 'error' }
						: prev
				);
			}
		};

		void run();

		return () => {
			controller.abort();
		};
	}, [
		hasUnsetPopularOrderTag,
		isActive,
		suggestParams,
		suggestionRequestKey,
	]);

	const {
		activeRequestKey,
		generation,
		resultContext,
		resultGeneration,
		status: storedSuggestionStatus,
		suggestions,
	} = suggestionsState;
	const suggestionStatus: TSuggestionStatus =
		!isActive || hasUnsetPopularOrderTag
			? 'idle'
			: activeRequestKey === suggestionRequestKey
				? storedSuggestionStatus
				: suggestions === null
					? 'pending'
					: 'refreshing';
	const isVisible = isActive;
	const displayCustomerOrder =
		resultContext?.customerOrder ?? currentCustomerOrder;
	const alternativesMap =
		alternativesState.generation === generation
			? alternativesState.map
			: EMPTY_ALTERNATIVES_MAP;

	useLayoutEffect(() => {
		suggestedMealsUiStore.visibility.set(isVisible);

		return () => {
			suggestedMealsUiStore.visibility.set(false);
		};
	}, [isVisible]);

	useEffect(() => {
		const controllers = alternativeControllersRef.current;
		for (const controller of controllers.values()) {
			controller.abort();
		}
		controllers.clear();
		setAlternativesState({ generation, map: new Map() });

		return () => {
			for (const controller of controllers.values()) {
				controller.abort();
			}
			controllers.clear();
		};
	}, [generation]);

	const loadAlternatives = useCallback(
		(
			mealKey: string,
			args: Omit<
				Parameters<typeof getScoreBasedAlternatives>[0],
				| 'hasMystiaCooker'
				| 'hiddenDlcs'
				| 'hiddenIngredients'
				| 'instance_ingredient'
				| 'instance_recipe'
				| 'isFamousShop'
				| 'popularTrend'
			>
		) => {
			if (
				suggestionStatus !== 'success' ||
				resultContext === null ||
				alternativeControllersRef.current.has(mealKey)
			) {
				return;
			}

			const controller = new AbortController();
			alternativeControllersRef.current.set(mealKey, controller);
			setAlternativesState((prev) => {
				const existing = prev.map.get(mealKey);
				if (
					prev.generation !== generation ||
					(existing !== undefined && existing.status !== 'error')
				) {
					return prev;
				}

				const next = new Map(prev.map);
				next.set(mealKey, { map: new Map(), status: 'pending' });
				return { generation, map: next };
			});

			const run = async () => {
				try {
					const map = await getScoreBasedAlternatives(
						{
							...args,
							hasMystiaCooker: resultContext.hasMystiaCooker,
							hiddenDlcs: resultContext.hiddenDlcs,
							hiddenIngredients: resultContext.hiddenIngredients,
							instance_ingredient,
							instance_recipe,
							isFamousShop: resultContext.isFamousShop,
							popularTrend: resultContext.popularTrend,
						},
						{
							signal: controller.signal,
							taskKey: `suggest-alternatives:${mealKey}`,
						}
					);
					if (
						controller.signal.aborted ||
						suggestionGenerationRef.current !== generation
					) {
						return;
					}
					setAlternativesState((prev) => {
						if (prev.generation !== generation) {
							return prev;
						}
						const next = new Map(prev.map);
						next.set(mealKey, { map, status: 'success' });
						return { generation, map: next };
					});
				} catch (error) {
					if (
						controller.signal.aborted ||
						checkSuggestMealsAbortError(error) ||
						suggestionGenerationRef.current !== generation
					) {
						return;
					}

					console.warn('Suggested meal alternatives failed.', {
						errorCode: getLogSafeErrorCode(error),
					});
					setAlternativesState((prev) => {
						if (prev.generation !== generation) {
							return prev;
						}
						const next = new Map(prev.map);
						next.set(mealKey, { map: new Map(), status: 'error' });
						return { generation, map: next };
					});
				} finally {
					if (
						alternativeControllersRef.current.get(mealKey) ===
						controller
					) {
						alternativeControllersRef.current.delete(mealKey);
					}
				}
			};

			void run();
		},
		[
			generation,
			instance_ingredient,
			instance_recipe,
			resultContext,
			suggestionStatus,
		]
	);

	const suggestedMealRows = useMemo<
		ISuggestedMealRowViewModel[] | null
	>(() => {
		if (suggestions === null || resultContext === null) {
			return null;
		}

		const {
			beverageTags: customerBeverageTags,
			negativeTags: customerNegativeTags,
			positiveTags: customerPositiveTags,
		} = instance_customer.getPropsByName(resultContext.customerName);

		return suggestions.map((meal) => {
			const {
				beverage,
				price,
				rating: ratingKey,
				recipe: recipeData,
			} = meal;
			const {
				negativeTags: recipeNegativeTags,
				positiveTags: recipePositiveTags,
			} = instance_recipe.getPropsByName(recipeData.name);
			const { baseIngredients: recipeIngredients, cooker } =
				instance_recipe.resolveMealRecipe(recipeData);
			const visibleExtraIngredients = getRestExtraIngredients(
				recipeData.extraIngredients,
				recipeIngredients.length
			);
			const isDarkMatter =
				!checkLengthEmpty(recipeData.extraIngredients) &&
				instance_recipe.checkDarkMatter(recipeData).isDarkMatter;
			const mealKey = `${resultGeneration}:${recipeData.name}|${recipeData.recipeId}|${beverage}|${recipeData.extraIngredients.join(',')}`;
			const currentAlternatives = alternativesMap.get(mealKey);
			const alternativesStatus = currentAlternatives?.status ?? 'idle';

			return {
				alternativesStatus,
				beverage,
				cooker,
				ensureAlternatives: () => {
					if (
						(currentAlternatives !== undefined &&
							currentAlternatives.status !== 'error') ||
						checkLengthEmpty(visibleExtraIngredients) ||
						suggestionStatus !== 'success'
					) {
						return;
					}

					loadAlternatives(mealKey, {
						baseRating: ratingKey,
						beverageTags: instance_beverage.getPropsByName(
							beverage,
							'tags'
						),
						customerBeverageTags,
						customerName: resultContext.customerName,
						customerNegativeTags,
						customerOrder: resultContext.customerOrder,
						customerPositiveTags,
						extraIngredients: visibleExtraIngredients,
						recipeId: recipeData.recipeId,
						recipeIngredients,
						recipeName: recipeData.name,
						recipeNegativeTags,
						recipePositiveTags,
					});
				},
				getAlternatives: (ingredientName) =>
					currentAlternatives?.map.get(ingredientName) ??
					EMPTY_ALTERNATIVES,
				hasAlternativesLoaded: alternativesStatus === 'success',
				key: mealKey,
				price,
				ratingKey,
				recipeData,
				recipeDisplayName: isDarkMatter
					? DARK_MATTER_META_MAP.name
					: recipeData.name,
				recipeIngredients,
				visibleExtraIngredients,
			};
		});
	}, [
		alternativesMap,
		instance_beverage,
		instance_customer,
		instance_recipe,
		loadAlternatives,
		resultContext,
		resultGeneration,
		suggestionStatus,
		suggestions,
	]);

	return {
		availableRecipeCookers,
		currentBeverageName,
		currentCustomerName,
		currentCustomerOrder: displayCustomerOrder,
		currentRecipeData,
		handleCookerChange,
		handleMaxExtraChange,
		handleMaxRatingChange,
		hasUnsetPopularOrderTag,
		isActive,
		isHighAppearance,
		isVisible,
		selectableMaxExtraIngredients,
		selectableMaxRatings,
		selectedCookerKeys,
		selectedMaxExtraKeys,
		selectedMaxRatingKeys,
		suggestedMealRows,
		suggestionStatus,
		suggestMaxRating,
	};
}
