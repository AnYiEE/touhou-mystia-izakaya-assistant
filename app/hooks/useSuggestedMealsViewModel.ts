import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import { type Selection } from '@heroui/table';

import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	type TCookerName,
	type TCustomerRareName,
	type TDlc,
	type TIngredientName,
} from '@/data';
import { getLogSafeErrorCode } from '@/lib/logging';
import { customerRareStore as customerStore, globalStore } from '@/stores';
import type { ICustomerOrder, IPopularTrend } from '@/types';
import { checkLengthEmpty, toArray, toSet } from '@/utilities';
import {
	getScoreBasedAlternatives,
	suggestMeals,
} from '@/utils/customer/customer_rare/suggestMeals';
import { checkSuggestMealsAbortError } from '@/utils/customer/customer_rare/suggestMealsEngine';
import { getRestExtraIngredients } from '@/utils/customer/shared';

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
	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentCustomerPopularTrend =
		customerStore.shared.customer.popularTrend.use();

	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRecipeName = currentRecipeData?.name ?? null;

	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const hiddenBeverages =
		customerStore.shared.beverage.table.hiddenBeverages.use();
	const hiddenDlcs = customerStore.shared.hiddenItems.dlcs.use();
	const hiddenIngredients =
		customerStore.shared.recipe.table.hiddenIngredients.use();
	const hiddenRecipes = customerStore.shared.recipe.table.hiddenRecipes.use();

	const isSuggestEnabled = customerStore.shared.suggestMeals.enabled.use();
	const selectedSuggestMealsCooker =
		customerStore.shared.suggestMeals.cooker.use();
	const suggestMaxExtraIngredients =
		customerStore.shared.suggestMeals.maxExtraIngredients.use();
	const suggestMaxRating = customerStore.shared.suggestMeals.maxRating.use();
	const suggestMaxResults =
		customerStore.shared.suggestMeals.maxResults.use();

	const availableRecipeCookers = customerStore.availableRecipeCookers.use();
	const selectableMaxExtraIngredients =
		globalStore.shared.suggestMeals.selectableMaxExtraIngredients.get();
	const selectableMaxRatings =
		globalStore.shared.suggestMeals.selectableMaxRatings.get();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_customer = customerStore.instances.customer.get();
	const instance_ingredient = customerStore.instances.ingredient.get();
	const instance_recipe = customerStore.instances.recipe.get();

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
				? toSet()
				: toSet(selectedSuggestMealsCooker),
		[selectedSuggestMealsCooker]
	);

	const selectedMaxExtraKeys = useMemo<SelectionSet>(
		() =>
			toSet(
				suggestMaxExtraIngredients === null
					? ''
					: suggestMaxExtraIngredients.toString()
			),
		[suggestMaxExtraIngredients]
	);

	const selectedMaxRatingKeys = useMemo<SelectionSet>(
		() => toSet(suggestMaxRating.toString()),
		[suggestMaxRating]
	);

	const handleCookerChange = useCallback((keys: Selection) => {
		const selected = toArray(keys as SelectionSet);
		const cooker = (selected[0] as TCookerName | undefined) ?? null;
		customerStore.shared.suggestMeals.cooker.set(cooker);
	}, []);

	const handleMaxExtraChange = useCallback((keys: Selection) => {
		const selected = toArray(keys as SelectionSet);
		const value = selected[0] as string | undefined;
		customerStore.shared.suggestMeals.maxExtraIngredients.set(
			value === undefined || value === '' ? null : Number.parseInt(value)
		);
	}, []);

	const handleMaxRatingChange = useCallback((keys: Selection) => {
		const selected = toArray(keys as SelectionSet);
		const value = selected[0] as string | undefined;
		if (value !== undefined) {
			customerStore.shared.suggestMeals.maxRating.set(
				Number.parseInt(value)
			);
		}
	}, []);

	useEffect(() => {
		if (currentRecipeName === null) {
			customerStore.shared.suggestMeals.cooker.set(null);
			return;
		}

		customerStore.shared.suggestMeals.cooker.set(
			instance_recipe.getPropsByName(currentRecipeName, 'cooker')
		);
	}, [currentRecipeName, instance_recipe]);

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
	const suggestionRequestKey = useMemo(
		() =>
			JSON.stringify({
				currentBeverageName,
				currentCustomerName,
				currentCustomerOrder,
				currentCustomerPopularTrend,
				currentRecipeData,
				hasMystiaCooker,
				hiddenBeverages: [...hiddenBeverages].sort(),
				hiddenDlcs: [...hiddenDlcs].sort(),
				hiddenIngredients: [...hiddenIngredients].sort(),
				hiddenRecipes: [...hiddenRecipes].sort(),
				isFamousShop,
				selectedSuggestMealsCooker,
				suggestMaxExtraIngredients,
				suggestMaxRating,
				suggestMaxResults,
			}),
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

	useEffect(() => {
		const generation = ++suggestionGenerationRef.current;
		const controller = new AbortController();

		if (!isActive || hasUnsetPopularOrderTag) {
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

		setSuggestionsState((prev) => ({
			...prev,
			activeRequestKey: suggestionRequestKey,
			generation,
			status: prev.suggestions === null ? 'pending' : 'refreshing',
		}));
		const resultContext: ISuggestionResultContext = {
			customerName: currentCustomerName,
			customerOrder: { ...currentCustomerOrder },
			hasMystiaCooker,
			hiddenDlcs: new Set(hiddenDlcs),
			hiddenIngredients: new Set(hiddenIngredients),
			isFamousShop,
			popularTrend: { ...currentCustomerPopularTrend },
		};

		const run = async () => {
			try {
				const suggestions = await suggestMeals(
					{
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
					{ signal: controller.signal }
				);

				if (
					controller.signal.aborted ||
					suggestionGenerationRef.current !== generation
				) {
					return;
				}
				setSuggestionsState({
					activeRequestKey: suggestionRequestKey,
					generation,
					resultContext,
					resultGeneration: generation,
					status: 'success',
					suggestions,
				});
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
		hasUnsetPopularOrderTag,
		isActive,
		isFamousShop,
		selectedSuggestMealsCooker,
		suggestMaxExtraIngredients,
		suggestMaxRating,
		suggestMaxResults,
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
		customerStore.shared.suggestMeals.visibility.set(isVisible);

		return () => {
			customerStore.shared.suggestMeals.visibility.set(false);
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
				cooker,
				ingredients: recipeIngredients,
				negativeTags: recipeNegativeTags,
				positiveTags: recipePositiveTags,
			} = instance_recipe.getPropsByName(recipeData.name);
			const visibleExtraIngredients = getRestExtraIngredients(
				recipeData.extraIngredients,
				recipeIngredients.length
			);
			const isDarkMatter =
				!checkLengthEmpty(recipeData.extraIngredients) &&
				instance_recipe.checkDarkMatter(recipeData).isDarkMatter;
			const mealKey = `${resultGeneration}:${recipeData.name}|${beverage}|${recipeData.extraIngredients.join(',')}`;
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
