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
import {
	selectionToKnownValues,
	toSelectionKeySet,
} from '@/design/ui/components/selectionKeys';

import type { TBeverageId, TBeverageName } from '@/domain/data/beverages/types';
import type { TCookerId, TCookerName } from '@/domain/data/cookers/types';
import type { TFoodId, TFoodName } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type {
	TIngredientId,
	TIngredientName,
} from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import { getRestExtraIngredients } from '@/domain/meals/getRestExtraIngredients';
import type { IMealFood } from '@/domain/meals/types';
import type { IGuestOrder } from '@/domain/orders/types';
import { RECOMMENDATION_SORT_PROFILE_LABEL_MAP } from '@/domain/recommendations/labels';
import {
	RECOMMENDATION_SORT_PROFILES,
	type TRecommendationSortProfile,
} from '@/domain/recommendations/sortProfiles';
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

import { specialGuestStore } from './state/store';

type TSuggestions = Awaited<ReturnType<typeof suggestMeals>> | null;
type TSuggestedMeal = NonNullable<TSuggestions>[number];
type TSuggestionStatus =
	| 'error'
	| 'idle'
	| 'pending'
	| 'refreshing'
	| 'success';
type TAlternativesStatus = 'error' | 'idle' | 'pending' | 'success';

const EMPTY_ALTERNATIVES: IIngredientView[] = [];
const EMPTY_ALTERNATIVES_MAP = new Map<string, IAlternativesEntry>();
const EMPTY_BEVERAGE_ALTERNATIVES: IBeverageAlternativeView[] = [];
const EMPTY_BEVERAGE_ALTERNATIVES_MAP = new Map<
	string,
	IBeverageAlternativesEntry
>();
const FOLLOW_SETTINGS_SORT_PROFILE_KEY = 'follow-settings';
const SUGGESTED_MEAL_SORT_PROFILE_OPTIONS = [
	{ label: '跟随全局设置', value: FOLLOW_SETTINGS_SORT_PROFILE_KEY },
	...RECOMMENDATION_SORT_PROFILES.map((value) => ({
		label: RECOMMENDATION_SORT_PROFILE_LABEL_MAP[value],
		value,
	})),
];
const SUGGESTED_MEAL_SORT_PROFILE_OVERRIDE_BY_KEY: ReadonlyMap<
	string,
	TRecommendationSortProfile | null
> = new Map([
	[FOLLOW_SETTINGS_SORT_PROFILE_KEY, null],
	...RECOMMENDATION_SORT_PROFILES.map((value) => [value, value] as const),
]);

interface IAlternativesState {
	generation: number;
	map: Map<string, IAlternativesEntry>;
}

interface IAlternativesEntry {
	map: Map<TIngredientId, TIngredientId[]>;
	status: Exclude<TAlternativesStatus, 'idle'>;
}

interface IBeverageAlternativesEntry {
	meals: ReadonlyArray<TSuggestedMeal>;
	status: Exclude<TAlternativesStatus, 'idle'>;
}

interface IBeverageAlternativesState {
	generation: number;
	map: Map<string, IBeverageAlternativesEntry>;
}

interface ISuggestionsState {
	activeRequestKey: string | null;
	generation: number;
	resultContext: ISuggestionResultContext | null;
	status: TSuggestionStatus;
	suggestions: TSuggestions;
}

interface ISuggestionResultContext {
	readonly cooker: TCookerId | null;
	readonly guestOrder: IGuestOrder;
	readonly hasMystiaCooker: boolean;
	readonly hiddenBeverages: ReadonlySet<TBeverageId>;
	readonly hiddenDlcs: ReadonlySet<TDlc>;
	readonly hiddenFoods: ReadonlySet<TFoodId>;
	readonly hiddenIngredients: ReadonlySet<TIngredientId>;
	readonly isFamousShop: boolean;
	readonly maxRating: number;
	readonly popularTrend: IPopularTrend;
	readonly sortProfile: TRecommendationSortProfile;
	readonly specialGuest: TSpecialGuestId;
}

interface IRecordView<TId extends number, TName extends string> {
	id: TId;
	name: TName;
}

type IBeverageView = IRecordView<TBeverageId, TBeverageName>;
type IBeverageAlternativeView = IBeverageView & {
	price: TSuggestedMeal['price'];
};
type ICookerView = IRecordView<TCookerId, TCookerName>;
type IFoodView = IRecordView<TFoodId, TFoodName> & {
	displayName: TFoodName | typeof DARK_MATTER_META_MAP.name;
};
type IIngredientView = IRecordView<TIngredientId, TIngredientName>;

interface ISuggestedMealRowViewModel {
	alternativesStatus: TAlternativesStatus;
	beverage: IBeverageView;
	cooker: ICookerView;
	ensureAlternatives: () => void;
	extraIngredients: IIngredientView[];
	food: IFoodView;
	getAlternatives: (
		ingredient: TIngredientId
	) => ReadonlyArray<IIngredientView>;
	hasAlternativesLoaded: boolean;
	ingredients: ReadonlyArray<IIngredientView>;
	key: string;
	meal: IMealFood;
	price: TSuggestedMeal['price'];
	ratingKey: TSuggestedMeal['rating'];
	visibleExtraIngredients: IIngredientView[];
}

export function useSuggestedMealsViewModel() {
	const { isHighAppearance } = useDesignPreferences();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentGuestName = specialGuestStore.currentGuestName.use();
	const currentGuestOrder = specialGuestStore.shared.guest.order.use();
	const currentGuestPopularTrend =
		specialGuestStore.shared.guest.popularTrend.use();

	const isFamousShop = specialGuestStore.shared.guest.famousShop.use();

	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const currentFood = specialGuestStore.shared.recipe.data.use();

	const hasMystiaCooker =
		specialGuestStore.shared.guest.hasMystiaCooker.use();
	const hiddenBeverages =
		specialGuestStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenDlcs = specialGuestStore.shared.hiddenItems.dlcs.use();
	const hiddenIngredients =
		specialGuestStore.shared.recipe.table.hiddenIngredients.use();
	const hiddenFoods = specialGuestStore.shared.recipe.table.hiddenFoods.use();

	const isSuggestEnabled = recommendationPreferencesFacade.enabled.use();
	const selectedSuggestMealsCooker = suggestedMealsUiStore.cooker.use();
	const selectedSortProfileOverride =
		suggestedMealsUiStore.sortProfileOverride.use();
	const suggestMaxExtraIngredients =
		recommendationPreferencesFacade.maxExtraIngredients.use();
	const suggestMaxRating = recommendationPreferencesFacade.maxRating.use();
	const suggestMaxResults = recommendationPreferencesFacade.maxResults.use();
	const suggestSortProfile =
		recommendationPreferencesFacade.sortProfile.use();
	const effectiveSortProfile =
		selectedSortProfileOverride ?? suggestSortProfile;

	const availableFoodCookers = specialGuestStore.availableFoodCookers.use();
	const selectableMaxExtraIngredients =
		globalStore.shared.suggestMeals.selectableMaxExtraIngredients.get();
	const selectableMaxRatings =
		globalStore.shared.suggestMeals.selectableMaxRatings.get();
	const selectableMaxResults =
		globalStore.shared.suggestMeals.selectableMaxResults.get();

	const beverageCatalog = specialGuestStore.instances.beverage.get();
	const cookerCatalog = specialGuestStore.instances.cooker.get();
	const foodCatalog = specialGuestStore.instances.recipe.get();
	const ingredientCatalog = specialGuestStore.instances.ingredient.get();
	const specialGuestCatalog = specialGuestStore.instances.guest.get();

	const suggestionGenerationRef = useRef(0);
	const alternativeControllersRef = useRef(
		new Map<string, AbortController>()
	);
	const [suggestionsState, setSuggestionsState] = useState<ISuggestionsState>(
		() => ({
			activeRequestKey: null,
			generation: 0,
			resultContext: null,
			status: 'idle',
			suggestions: null,
		})
	);
	const [alternativesState, setAlternativesState] =
		useState<IAlternativesState>(() => ({ generation: 0, map: new Map() }));
	const availableFoodCookerByKey = useMemo<ReadonlyMap<string, TCookerId>>(
		() =>
			new Map(availableFoodCookers.map(({ id }) => [id.toString(), id])),
		[availableFoodCookers]
	);
	const selectableMaxExtraIngredientByKey = useMemo<
		ReadonlyMap<string, number | null>
	>(
		() =>
			new Map(
				selectableMaxExtraIngredients.map(({ value }) => [
					value === null ? '' : value.toString(),
					value,
				])
			),
		[selectableMaxExtraIngredients]
	);
	const selectableMaxRatingByKey = useMemo<ReadonlyMap<string, number>>(
		() =>
			new Map(
				selectableMaxRatings.map(({ value }) => [
					value.toString(),
					value,
				])
			),
		[selectableMaxRatings]
	);

	const selectableMaxResultByKey = useMemo<ReadonlyMap<string, number>>(
		() =>
			new Map(
				selectableMaxResults.map(({ value }) => [
					value.toString(),
					value,
				])
			),
		[selectableMaxResults]
	);

	const selectedCookerKeys = useMemo<Set<string>>(
		() =>
			selectedSuggestMealsCooker === null
				? new Set()
				: toSelectionKeySet([selectedSuggestMealsCooker]),
		[selectedSuggestMealsCooker]
	);

	const selectedMaxExtraKeys = useMemo<Set<string>>(
		() =>
			new Set([
				suggestMaxExtraIngredients === null
					? ''
					: suggestMaxExtraIngredients.toString(),
			]),
		[suggestMaxExtraIngredients]
	);

	const selectedMaxRatingKeys = useMemo<Set<string>>(
		() => new Set([suggestMaxRating.toString()]),
		[suggestMaxRating]
	);

	const selectedMaxResultKeys = useMemo<Set<string>>(
		() => new Set([suggestMaxResults.toString()]),
		[suggestMaxResults]
	);

	const selectedSortProfileKeys = useMemo<Set<string>>(
		() =>
			new Set([
				selectedSortProfileOverride ?? FOLLOW_SETTINGS_SORT_PROFILE_KEY,
			]),
		[selectedSortProfileOverride]
	);

	const handleCookerChange = useCallback(
		(keys: Selection) => {
			const values = selectionToKnownValues(
				keys,
				availableFoodCookerByKey
			);
			if (values !== null) {
				suggestedMealsUiStore.cooker.set(values[0] ?? null);
			}
		},
		[availableFoodCookerByKey]
	);

	const handleMaxExtraChange = useCallback(
		(keys: Selection) => {
			const values = selectionToKnownValues(
				keys,
				selectableMaxExtraIngredientByKey
			);
			if (values !== null) {
				recommendationPreferencesFacade.maxExtraIngredients.set(
					values[0] ?? null
				);
			}
		},
		[selectableMaxExtraIngredientByKey]
	);

	const handleMaxRatingChange = useCallback(
		(keys: Selection) => {
			const [value] =
				selectionToKnownValues(keys, selectableMaxRatingByKey) ?? [];
			if (value !== undefined) {
				recommendationPreferencesFacade.maxRating.set(value);
			}
		},
		[selectableMaxRatingByKey]
	);

	const handleMaxResultsChange = useCallback(
		(keys: Selection) => {
			const [value] =
				selectionToKnownValues(keys, selectableMaxResultByKey) ?? [];
			if (value !== undefined) {
				recommendationPreferencesFacade.maxResults.set(value);
			}
		},
		[selectableMaxResultByKey]
	);

	const handleSortProfileChange = useCallback((keys: Selection) => {
		const values = selectionToKnownValues(
			keys,
			SUGGESTED_MEAL_SORT_PROFILE_OVERRIDE_BY_KEY
		);
		if (values !== null) {
			suggestedMealsUiStore.sortProfileOverride.set(values[0] ?? null);
		}
	}, []);

	useEffect(() => {
		if (currentFood === null) {
			suggestedMealsUiStore.cooker.set(null);
			return;
		}

		const { cookerType } = foodCatalog.getRecipeOwnerById(
			currentFood.recipeId
		).recipe;
		suggestedMealsUiStore.cooker.set(
			cookerCatalog.getIdByTypeAndSeries(cookerType, 0)
		);
	}, [cookerCatalog, currentFood, foodCatalog]);

	const hasSelection = currentBeverage !== null || currentFood !== null;
	const hasOrderTags =
		currentGuestOrder.beverageTag !== null &&
		currentGuestOrder.foodTag !== null;
	const isActive =
		isSuggestEnabled &&
		currentSpecialGuest !== null &&
		(hasOrderTags || (hasMystiaCooker && hasSelection));

	const suggestParams = useMemo<ISuggestParams | null>(
		() =>
			currentSpecialGuest === null
				? null
				: {
						cooker: selectedSuggestMealsCooker,
						currentBeverage,
						currentFood,
						guestOrder: currentGuestOrder,
						hasMystiaCooker,
						hiddenBeverages,
						hiddenDlcs,
						hiddenFoods,
						hiddenIngredients,
						isFamousShop,
						maxExtraIngredients: suggestMaxExtraIngredients,
						maxRating: suggestMaxRating,
						maxResults: suggestMaxResults,
						popularTrend: currentGuestPopularTrend,
						sortProfile: effectiveSortProfile,
						specialGuest: currentSpecialGuest,
					},
		[
			currentBeverage,
			currentSpecialGuest,
			currentGuestOrder,
			currentGuestPopularTrend,
			currentFood,
			effectiveSortProfile,
			hasMystiaCooker,
			hiddenBeverages,
			hiddenDlcs,
			hiddenFoods,
			hiddenIngredients,
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

		if (!isActive || suggestParams === null) {
			setSuggestionsState({
				activeRequestKey: suggestionRequestKey,
				generation,
				resultContext: null,
				status: 'idle',
				suggestions: null,
			});
			return () => {
				controller.abort();
			};
		}

		const resultContext: ISuggestionResultContext = {
			cooker: suggestParams.cooker,
			guestOrder: { ...suggestParams.guestOrder },
			hasMystiaCooker: suggestParams.hasMystiaCooker,
			hiddenBeverages: new Set(suggestParams.hiddenBeverages),
			hiddenDlcs: new Set(suggestParams.hiddenDlcs),
			hiddenFoods: new Set(suggestParams.hiddenFoods),
			hiddenIngredients: new Set(suggestParams.hiddenIngredients),
			isFamousShop: suggestParams.isFamousShop,
			maxRating: suggestParams.maxRating,
			popularTrend: { ...suggestParams.popularTrend },
			sortProfile: suggestParams.sortProfile,
			specialGuest: suggestParams.specialGuest,
		};
		const memorySuggestions = readSuggestedMealsMemoryCache(suggestParams);
		if (memorySuggestions !== undefined) {
			recordRecommendationCacheResolution('suggestedMealCard', 'memory');
			setSuggestionsState({
				activeRequestKey: suggestionRequestKey,
				generation,
				resultContext,
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
	}, [isActive, suggestParams, suggestionRequestKey]);

	const {
		activeRequestKey,
		generation,
		resultContext,
		status: storedSuggestionStatus,
		suggestions,
	} = suggestionsState;
	const suggestionStatus: TSuggestionStatus = isActive
		? activeRequestKey === suggestionRequestKey
			? storedSuggestionStatus
			: suggestions === null
				? 'pending'
				: 'refreshing'
		: 'idle';
	const isVisible = isActive;
	const displayGuestOrder = resultContext?.guestOrder ?? currentGuestOrder;
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
				| 'ingredientCatalog'
				| 'foodCatalog'
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
							foodCatalog,
							hasMystiaCooker: resultContext.hasMystiaCooker,
							hiddenDlcs: resultContext.hiddenDlcs,
							hiddenIngredients: resultContext.hiddenIngredients,
							ingredientCatalog,
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
			foodCatalog,
			generation,
			ingredientCatalog,
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

		const guest = specialGuestCatalog.getPropsById(
			resultContext.specialGuest
		);

		return suggestions.map((meal) => {
			const { beverage, food: mealFood, price, rating: ratingKey } = meal;
			const { food, recipe } = foodCatalog.getRecipeOwnerById(
				mealFood.recipeId
			);
			const { baseIngredients, cookerType } =
				foodCatalog.resolveMealFood(mealFood);
			const visibleExtraIngredients = getRestExtraIngredients(
				mealFood.extraIngredients,
				baseIngredients.length
			);
			const visibleExtraIngredientViews = visibleExtraIngredients.map(
				(id) => ({
					id,
					name: ingredientCatalog.getPropsById(id, 'name'),
				})
			);
			const extraIngredients = mealFood.extraIngredients.map((id) => ({
				id,
				name: ingredientCatalog.getPropsById(id, 'name'),
			}));
			const ingredients = baseIngredients.map((id) => ({
				id,
				name: ingredientCatalog.getPropsById(id, 'name'),
			}));
			const beverageView = {
				id: beverage,
				name: beverageCatalog.getPropsById(beverage, 'name'),
			};
			const currentMeal: IMealFood = {
				extraIngredients: [...mealFood.extraIngredients],
				recipeId: mealFood.recipeId,
			};
			const isDarkMatter =
				!checkLengthEmpty(mealFood.extraIngredients) &&
				foodCatalog.checkDarkMatter(mealFood).isDarkMatter;
			const cooker = cookerCatalog.getIdByTypeAndSeries(cookerType, 0);
			const cookerView = {
				id: cooker,
				name: cookerCatalog.getPropsById(cooker, 'name'),
			};
			const mealKey = `${food.id}|${mealFood.recipeId}|${beverage}|${mealFood.extraIngredients.join(',')}`;
			const currentAlternatives = alternativesMap.get(mealKey);
			const alternativesStatus = currentAlternatives?.status ?? 'idle';

			return {
				alternativesStatus,
				beverage: beverageView,
				cooker: cookerView,
				ensureAlternatives: () => {
					if (
						(currentAlternatives !== undefined &&
							currentAlternatives.status !== 'error') ||
						checkLengthEmpty(visibleExtraIngredientViews) ||
						suggestionStatus !== 'success'
					) {
						return;
					}

					loadAlternatives(mealKey, {
						baseRating: ratingKey,
						beverageTags: beverageCatalog.getPropsById(
							beverage,
							'tags'
						),
						extraIngredients: visibleExtraIngredients,
						food: food.id,
						foodNegativeTags: food.negativeTags,
						foodPositiveTags: food.positiveTags,
						guestOrder: resultContext.guestOrder,
						recipeId: mealFood.recipeId,
						recipeIngredients: recipe.ingredients,
						specialGuest: guest.id,
						specialGuestBeverageTags: guest.beverageTags,
						specialGuestNegativeTags: guest.negativeTags,
						specialGuestPositiveTags: guest.positiveTags,
					});
				},
				extraIngredients,
				food: {
					displayName: isDarkMatter
						? DARK_MATTER_META_MAP.name
						: food.name,
					id: food.id,
					name: food.name,
				},
				getAlternatives: (ingredient) =>
					currentAlternatives?.map
						.get(ingredient)
						?.map((id) => ({
							id,
							name: ingredientCatalog.getPropsById(id, 'name'),
						})) ?? EMPTY_ALTERNATIVES,
				hasAlternativesLoaded: alternativesStatus === 'success',
				ingredients,
				key: mealKey,
				meal: currentMeal,
				price,
				ratingKey,
				visibleExtraIngredients: visibleExtraIngredientViews,
			};
		});
	}, [
		alternativesMap,
		beverageCatalog,
		cookerCatalog,
		foodCatalog,
		ingredientCatalog,
		loadAlternatives,
		resultContext,
		specialGuestCatalog,
		suggestionStatus,
		suggestions,
	]);

	return {
		availableFoodCookers,
		currentBeverage,
		currentFood,
		currentGuestName,
		currentGuestOrder: displayGuestOrder,
		effectiveSortProfileLabel:
			RECOMMENDATION_SORT_PROFILE_LABEL_MAP[effectiveSortProfile],
		handleCookerChange,
		handleMaxExtraChange,
		handleMaxRatingChange,
		handleMaxResultsChange,
		handleSortProfileChange,
		isActive,
		isHighAppearance,
		isVisible,
		selectableMaxExtraIngredients,
		selectableMaxRatings,
		selectableMaxResults,
		selectedCookerKeys,
		selectedMaxExtraKeys,
		selectedMaxRatingKeys,
		selectedMaxResultKeys,
		selectedSortProfileKeys,
		sortProfileOptions: SUGGESTED_MEAL_SORT_PROFILE_OPTIONS,
		suggestedMealRows,
		suggestionStatus,
		suggestMaxRating,
	};
}
