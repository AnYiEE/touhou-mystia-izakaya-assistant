'use client';

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
	type TIngredientName,
} from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';
import { checkLengthEmpty, toArray, toSet } from '@/utilities';
import {
	getScoreBasedAlternatives,
	suggestMeals,
} from '@/utils/customer/customer_rare/suggestMeals';

type TLoadSuggestedMealAlternativesArgs = Omit<
	Parameters<typeof getScoreBasedAlternatives>[0],
	| 'hasMystiaCooker'
	| 'hiddenIngredients'
	| 'instance_ingredient'
	| 'instance_recipe'
	| 'isFamousShop'
	| 'popularTrend'
>;

type TSuggestedMeal = ReturnType<typeof suggestMeals>[number];

const EMPTY_ALTERNATIVES: TIngredientName[] = [];

interface ISuggestedMealRowViewModel {
	beverage: TSuggestedMeal['beverage'];
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

	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const hiddenBeverages =
		customerStore.shared.beverage.table.hiddenBeverages.use();
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

	const [alternativesMap, setAlternativesMap] = useState(
		() => new Map<number, Map<TIngredientName, TIngredientName[]>>()
	);

	const selectedCookerKeys = useMemo(
		() =>
			(selectedSuggestMealsCooker === null
				? toSet()
				: toSet(selectedSuggestMealsCooker)) as SelectionSet,
		[selectedSuggestMealsCooker]
	);

	const selectedMaxExtraKeys = useMemo(
		() =>
			toSet(
				suggestMaxExtraIngredients === null
					? ''
					: suggestMaxExtraIngredients.toString()
			) as SelectionSet,
		[suggestMaxExtraIngredients]
	);

	const selectedMaxRatingKeys = useMemo(
		() => toSet(suggestMaxRating.toString()) as SelectionSet,
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
		if (currentRecipeData === null) {
			customerStore.shared.suggestMeals.cooker.set(null);
			return;
		}

		customerStore.shared.suggestMeals.cooker.set(
			instance_recipe.getPropsByName(currentRecipeData.name, 'cooker')
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

	const suggestions = useMemo(() => {
		if (!isActive) {
			return null;
		}

		const results = suggestMeals({
			cooker: selectedSuggestMealsCooker,
			currentBeverage: currentBeverageName,
			currentRecipe: currentRecipeData,
			customerName: currentCustomerName,
			customerOrder: currentCustomerOrder,
			hasMystiaCooker,
			hiddenBeverages,
			hiddenIngredients,
			hiddenRecipes,
			isFamousShop,
			maxExtraIngredients: suggestMaxExtraIngredients,
			maxRating: suggestMaxRating,
			maxResults: suggestMaxResults,
			popularTrend: currentCustomerPopularTrend,
		});

		return checkLengthEmpty(results) ? null : results;
	}, [
		currentBeverageName,
		currentCustomerName,
		currentCustomerOrder,
		currentCustomerPopularTrend,
		currentRecipeData,
		hasMystiaCooker,
		hiddenBeverages,
		hiddenIngredients,
		hiddenRecipes,
		isActive,
		isFamousShop,
		selectedSuggestMealsCooker,
		suggestMaxExtraIngredients,
		suggestMaxRating,
		suggestMaxResults,
	]);

	const isVisible =
		isActive &&
		!(
			suggestions === null &&
			currentRecipeData !== null &&
			currentBeverageName !== null
		);

	useLayoutEffect(() => {
		customerStore.shared.suggestMeals.visibility.set(isVisible);
	}, [isVisible]);

	const prevSuggestionsRef = useRef(suggestions);
	if (prevSuggestionsRef.current !== suggestions) {
		prevSuggestionsRef.current = suggestions;
		if (alternativesMap.size > 0) {
			setAlternativesMap(new Map());
		}
	}

	const hasUnsetPopularOrderTag =
		(currentCustomerOrder.recipeTag === DYNAMIC_TAG_MAP.popularPositive ||
			currentCustomerOrder.recipeTag ===
				DYNAMIC_TAG_MAP.popularNegative) &&
		currentCustomerPopularTrend.tag === null;

	const loadAlternatives = useCallback(
		(loopIndex: number, args: TLoadSuggestedMealAlternativesArgs) => {
			setAlternativesMap((prev) => {
				if (prev.has(loopIndex)) {
					return prev;
				}

				const next = new Map(prev);
				next.set(
					loopIndex,
					getScoreBasedAlternatives({
						...args,
						hasMystiaCooker,
						hiddenIngredients,
						instance_ingredient,
						instance_recipe,
						isFamousShop,
						popularTrend: currentCustomerPopularTrend,
					})
				);
				return next;
			});
		},
		[
			currentCustomerPopularTrend,
			hasMystiaCooker,
			hiddenIngredients,
			instance_ingredient,
			instance_recipe,
			isFamousShop,
		]
	);

	const suggestedMealRows = useMemo<
		ISuggestedMealRowViewModel[] | null
	>(() => {
		if (suggestions === null || currentCustomerName === null) {
			return null;
		}

		const {
			beverageTags: customerBeverageTags,
			dlc: customerDlc,
			negativeTags: customerNegativeTags,
			positiveTags: customerPositiveTags,
		} = instance_customer.getPropsByName(currentCustomerName);

		return suggestions.map((meal, loopIndex) => {
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
			const visibleExtraIngredients = recipeData.extraIngredients.slice(
				0,
				Math.max(5 - recipeIngredients.length, 0)
			);
			const isDarkMatter =
				!checkLengthEmpty(recipeData.extraIngredients) &&
				instance_recipe.checkDarkMatter(recipeData).isDarkMatter;
			const currentAlternatives = alternativesMap.get(loopIndex);

			return {
				beverage,
				cooker,
				ensureAlternatives: () => {
					if (
						currentAlternatives !== undefined ||
						checkLengthEmpty(visibleExtraIngredients)
					) {
						return;
					}

					loadAlternatives(loopIndex, {
						baseRating: ratingKey,
						beverageTags: instance_beverage.getPropsByName(
							beverage,
							'tags'
						),
						customerBeverageTags,
						customerDlc,
						customerName: currentCustomerName,
						customerNegativeTags,
						customerOrder: currentCustomerOrder,
						customerPositiveTags,
						extraIngredients: visibleExtraIngredients,
						recipeIngredients,
						recipeName: recipeData.name,
						recipeNegativeTags,
						recipePositiveTags,
					});
				},
				getAlternatives: (ingredientName) =>
					currentAlternatives?.get(ingredientName) ??
					EMPTY_ALTERNATIVES,
				hasAlternativesLoaded: currentAlternatives !== undefined,
				key: `${recipeData.name}-${beverage}-${loopIndex}`,
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
		currentCustomerName,
		currentCustomerOrder,
		instance_beverage,
		instance_customer,
		instance_recipe,
		loadAlternatives,
		suggestions,
	]);

	return {
		availableRecipeCookers,
		currentBeverageName,
		currentCustomerName,
		currentCustomerOrder,
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
		suggestMaxRating,
	};
}
