import { type ComputedMethods, type StoreApi } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { selectionToStringValues } from '@/design/ui/components/selectionKeys';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import type { TBeverage, TFood } from '@/domain/catalog/food/types';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import {
	BEVERAGE_TAG_MAP,
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { evaluateNormalGuestSavedMeal } from '@/domain/evaluation/evaluateSavedMeal';
import { getIngredientScoreChanges } from '@/domain/evaluation/getIngredientScoreChanges';
import { checkNormalGuestFoodEasterEgg } from '@/domain/evaluation/normalGuestMeal';

import { getVisibleSavedMeals } from '@/features/catalog/guests/shared/mealPlanning/getVisibleSavedMeals';
import { buildBeverageSuitabilityRows } from '@/features/catalog/guests/shared/queries/buildBeverageSuitabilityRows';
import { buildFoodSuitabilityRows } from '@/features/catalog/guests/shared/queries/buildFoodSuitabilityRows';
import { cookerTypeSelectionAdapter } from '@/features/catalog/guests/shared/state/cookerTypeSelectionAdapter';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { matchPinyinName } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';
import { createComputedAccessor } from '@/shared/utilities/state/createComputedAccessor';

import {
	normalGuestBeverageCatalog as beverageCatalog,
	normalGuestFoodCatalog as foodCatalog,
	normalGuestIngredientCatalog as ingredientCatalog,
	normalGuestCatalog,
	type normalGuestInitialState,
} from './initialState';

const cookerCatalog = CookerCatalog.getInstance();

function resolveBeverageTag(value: string | number): TBeverageTagId {
	const errorCode = `Expected exactly one legacy BeverageTag named ${String(value)}.`;
	if (typeof value === 'number') {
		if (Object.hasOwn(BEVERAGE_TAG_MAP, value)) {
			return value as TBeverageTagId;
		}
		throw new Error(errorCode);
	}

	return resolveLegacyTagLabel({
		errorCode,
		facts: BEVERAGE_TAG_MAP,
		label: value,
	});
}

function resolveFoodTag(value: string | number): TFoodTagId {
	const errorCode = `Expected exactly one legacy FoodTag named ${String(value)}.`;
	if (typeof value === 'number') {
		if (Object.hasOwn(FOOD_TAG_MAP, value)) {
			return value as TFoodTagId;
		}
		throw new Error(errorCode);
	}

	return resolveLegacyTagLabel({
		errorCode,
		facts: FOOD_TAG_MAP,
		label: value,
	});
}

export const createNormalGuestComputedState = (
	currentStore: StoreApi<typeof normalGuestInitialState>
) => {
	const beverageTableRows = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentNormalGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const guestBeverageTags =
			currentNormalGuest === null
				? null
				: normalGuestCatalog.getPropsById(
						currentNormalGuest,
						'beverageTags'
					);

		return buildBeverageSuitabilityRows({
			beverageCatalog,
			guestBeverageTags,
			hiddenBeverages: shouldGet
				? currentStore.shared.beverage.table.hiddenBeverages.get()
				: currentStore.shared.beverage.table.hiddenBeverages.use(),
			hiddenDlcs: (shouldGet
				? currentStore.shared.hiddenItems.dlcs.get()
				: currentStore.shared.hiddenItems.dlcs.use()) as ReadonlySet<
				TBeverage['dlc']
			>,
			matchSearch: matchPinyinName,
			page: shouldGet
				? currentStore.shared.beverage.table.page.get()
				: currentStore.shared.beverage.table.page.use(),
			rowsPerPage: shouldGet
				? currentStore.shared.beverage.table.row.get()
				: currentStore.shared.beverage.table.row.use(),
			searchValue: shouldGet
				? currentStore.shared.beverage.searchValue.get()
				: currentStore.shared.beverage.searchValue.use(),
			selectedAvailabilityDlcs: shouldGet
				? currentStore.persistence.beverage.table.availabilityDlcs.get()
				: currentStore.persistence.beverage.table.availabilityDlcs.use(),
			selectedBeverageTags: [
				...(shouldGet
					? currentStore.shared.guest.select.beverageTag.get()
					: currentStore.shared.guest.select.beverageTag.use()),
			].map(resolveBeverageTag),
			sortDescriptor: shouldGet
				? currentStore.persistence.beverage.table.sortDescriptor.get()
				: currentStore.persistence.beverage.table.sortDescriptor.use(),
		});
	});

	const foodTableRows = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentNormalGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const currentGuestPopularTrend = shouldGet
			? currentStore.shared.guest.popularTrend.get()
			: currentStore.shared.guest.popularTrend.use();
		const isFamousShop = shouldGet
			? currentStore.shared.guest.famousShop.get()
			: currentStore.shared.guest.famousShop.use();
		const guestPositiveTags =
			currentNormalGuest === null
				? null
				: normalGuestCatalog.getPropsById(
						currentNormalGuest,
						'positiveTags'
					);

		return buildFoodSuitabilityRows({
			foodCatalog,
			getEasterEggScore: (food) => {
				if (currentNormalGuest === null) {
					return null;
				}

				const { food: easterEggFood, score } =
					checkNormalGuestFoodEasterEgg({
						currentFood: food.id,
						currentNormalGuest,
					});

				return easterEggFood === food.id ? score : null;
			},
			guestPositiveTags,
			hiddenDlcs: (shouldGet
				? currentStore.shared.hiddenItems.dlcs.get()
				: currentStore.shared.hiddenItems.dlcs.use()) as ReadonlySet<
				TFood['dlc']
			>,
			hiddenFoods: shouldGet
				? currentStore.shared.recipe.table.hiddenFoods.get()
				: currentStore.shared.recipe.table.hiddenFoods.use(),
			hiddenIngredients: shouldGet
				? currentStore.shared.recipe.table.hiddenIngredients.get()
				: currentStore.shared.recipe.table.hiddenIngredients.use(),
			isFamousShop,
			matchSearch: matchPinyinName,
			page: shouldGet
				? currentStore.shared.recipe.table.page.get()
				: currentStore.shared.recipe.table.page.use(),
			popularTrend: currentGuestPopularTrend,
			rowsPerPage: shouldGet
				? currentStore.shared.recipe.table.row.get()
				: currentStore.shared.recipe.table.row.use(),
			searchValue: shouldGet
				? currentStore.shared.recipe.searchValue.get()
				: currentStore.shared.recipe.searchValue.use(),
			selectedAvailabilityDlcs: shouldGet
				? currentStore.persistence.recipe.table.availabilityDlcs.get()
				: currentStore.persistence.recipe.table.availabilityDlcs.use(),
			selectedCookerTypes: shouldGet
				? currentStore.persistence.recipe.table.cookerTypes.get()
				: currentStore.persistence.recipe.table.cookerTypes.use(),
			selectedFoodTags: [
				...(shouldGet
					? currentStore.shared.guest.select.foodTag.get()
					: currentStore.shared.guest.select.foodTag.use()),
			].map(resolveFoodTag),
			sortDescriptor: shouldGet
				? currentStore.persistence.recipe.table.sortDescriptor.get()
				: currentStore.persistence.recipe.table.sortDescriptor.use(),
		});
	});

	const ingredientScoreChanges = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentNormalGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const currentMealFood = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const currentPopularTrend = shouldGet
			? currentStore.shared.guest.popularTrend.get()
			: currentStore.shared.guest.popularTrend.use();
		const isFamousShop = shouldGet
			? currentStore.shared.guest.famousShop.get()
			: currentStore.shared.guest.famousShop.use();

		if (currentNormalGuest === null || currentMealFood === null) {
			return { changesById: {}, darkIngredients: [] };
		}

		const guestPositiveTags = normalGuestCatalog.getPropsById(
			currentNormalGuest,
			'positiveTags'
		);
		const { food: currentFood, recipe: currentRecipe } =
			foodCatalog.getRecipeOwnerById(currentMealFood.recipeId);
		const currentExtraIngredients = currentMealFood.extraIngredients;

		return getIngredientScoreChanges({
			calculateFoodTagsWithTrend: (foodTags) =>
				foodCatalog.calculateFoodTagsWithTrend(
					foodTags,
					currentPopularTrend,
					isFamousShop
				),
			calculateIngredientTagsWithTrend: (ingredientTags) =>
				ingredientCatalog.calculateIngredientTagsWithTrend(
					ingredientTags,
					currentPopularTrend,
					isFamousShop
				),
			candidates: ingredientCatalog.data.map(({ id, tags }) => ({
				id,
				tags,
			})),
			composeFoodTagsWithPopularTrend: (tags) =>
				foodCatalog.composeFoodTagsWithPopularTrend(
					currentRecipe.ingredients,
					currentExtraIngredients,
					currentFood.positiveTags,
					tags,
					currentPopularTrend
				),
			currentMealFood,
			currentPopularTrend,
			getIngredientScoreChange: (
				oldFoodPositiveTags,
				newFoodPositiveTags,
				selectedGuestPositiveTags
			) =>
				foodCatalog.getIngredientScoreChange(
					oldFoodPositiveTags,
					newFoodPositiveTags,
					selectedGuestPositiveTags
				),
			getIngredientTags: (ingredient) =>
				ingredientCatalog.getIngredientTags(ingredient),
			specialGuestPositiveTags: guestPositiveTags,
		});
	});

	const savedGuestMealsWithEvaluation = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentNormalGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const savedMeals = shouldGet
			? currentStore.persistence.meals.get()
			: currentStore.persistence.meals.use();
		const hiddenDlcs = shouldGet
			? currentStore.shared.hiddenItems.dlcs.get()
			: currentStore.shared.hiddenItems.dlcs.use();
		const hiddenBeverages = shouldGet
			? currentStore.shared.beverage.table.hiddenBeverages.get()
			: currentStore.shared.beverage.table.hiddenBeverages.use();
		const hiddenIngredients = shouldGet
			? currentStore.shared.recipe.table.hiddenIngredients.get()
			: currentStore.shared.recipe.table.hiddenIngredients.use();
		const hiddenFoods = shouldGet
			? currentStore.shared.recipe.table.hiddenFoods.get()
			: currentStore.shared.recipe.table.hiddenFoods.use();
		const currentPopularTrend = shouldGet
			? currentStore.shared.guest.popularTrend.get()
			: currentStore.shared.guest.popularTrend.use();
		const isFamousShop = shouldGet
			? currentStore.shared.guest.famousShop.get()
			: currentStore.shared.guest.famousShop.use();

		if (currentNormalGuest === null) {
			return null;
		}

		const currentGuestMeals = savedMeals[currentNormalGuest];
		const visibleMeals = getVisibleSavedMeals({
			hiddenBeverages,
			hiddenDlcs,
			hiddenFoods,
			hiddenIngredients,
			meals: currentGuestMeals,
			resolveAvailabilityRefs: (meal) => {
				try {
					const { food } = foodCatalog.getRecipeOwnerById(
						meal.food.recipeId
					);
					return {
						beveragePaths:
							meal.beverage === null
								? null
								: beverageCatalog.getPropsById(
										meal.beverage,
										'availabilityPaths'
									),
						foodPaths: food.availabilityPaths,
						ingredientPaths: meal.food.extraIngredients.map(
							(ingredient) =>
								ingredientCatalog.getPropsById(
									ingredient,
									'availabilityPaths'
								)
						),
					};
				} catch {
					return null;
				}
			},
			resolveItemRefs: (meal) => {
				try {
					const { food, recipe } = foodCatalog.getRecipeOwnerById(
						meal.food.recipeId
					);
					return {
						beverage: meal.beverage,
						food: food.id,
						ingredients: [
							...recipe.ingredients,
							...meal.food.extraIngredients,
						],
					};
				} catch {
					return null;
				}
			},
		});

		if (checkLengthEmpty(visibleMeals)) {
			return null;
		}

		return visibleMeals.map(({ dataIndex, meal, visibleIndex }) => ({
			dataIndex,
			evaluation: evaluateNormalGuestSavedMeal({
				isFamousShop,
				mealFood: meal.food,
				normalGuest: currentNormalGuest,
				popularTrend: currentPopularTrend,
			}),
			meal,
			visibleIndex,
		}));
	});

	return {
		availableBeverageAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return beverageCatalog
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						beverageCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableBeverages: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return filterAvailableItemsByHiddenDlcs(
				beverageCatalog.data,
				hiddenDlcs
			)
				.map(({ id, name }) => ({ id, name }))
				.sort((a, b) => pinyinSort(a.name, b.name));
		},
		availableBeverageTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return beverageCatalog
				.getValuesByProp(
					'tags',
					false,
					filterAvailableItemsByHiddenDlcs(
						beverageCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort)
				.map(toGetValueCollection);
		},
		availableFoodAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return foodCatalog
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						foodCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableFoodCookers: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...new Set(
					filterAvailableItemsByHiddenDlcs(
						foodCatalog.data,
						hiddenDlcs
					).flatMap(({ recipes }) =>
						recipes.map(({ cookerType }) => cookerType)
					)
				),
			]
				.map((cookerType) => {
					const id = cookerCatalog.getIdByTypeAndSeries(
						cookerType,
						0
					);
					return {
						cookerType,
						id,
						name: cookerCatalog.getPropsById(id, 'name'),
					};
				})
				.sort((a, b) => pinyinSort(a.name, b.name));
		},
		availableFoods: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return filterAvailableItemsByHiddenDlcs(
				foodCatalog.data,
				hiddenDlcs
			)
				.filter(({ id }) => !foodCatalog.blockedFoods.has(id))
				.map(({ id, name }) => ({ id, name }))
				.sort((a, b) => pinyinSort(a.name, b.name));
		},
		availableFoodTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...foodCatalog.getValuesByProp(
					'positiveTags',
					false,
					filterAvailableItemsByHiddenDlcs(
						foodCatalog.data,
						hiddenDlcs
					).filter(
						({ positiveTags }) =>
							!positiveTags.some((positiveTag) =>
								foodCatalog.blockedTags.has(positiveTag)
							)
					)
				),
				DYNAMIC_FOOD_TAG_MAP.popularNegative,
				DYNAMIC_FOOD_TAG_MAP.popularPositive,
			]
				.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
				.map(toGetValueCollection);
		},
		availableGuestAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return normalGuestCatalog
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						normalGuestCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableGuestMaps: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return normalGuestCatalog
				.getValuesByProp(
					'maps',
					true,
					filterAvailableItemsByHiddenDlcs(
						normalGuestCatalog.data,
						hiddenDlcs
					)
				)
				.map(({ value }) => ({ name: MAP_FACTS[value].label, value }))
				.sort((a, b) => pinyinSort(a.name, b.name));
		},
		availableIngredientAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return ingredientCatalog
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						ingredientCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableIngredientLevels: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return ingredientCatalog
				.getValuesByProp(
					'level',
					true,
					filterAvailableItemsByHiddenDlcs(
						ingredientCatalog.data,
						hiddenDlcs
					).filter(
						({ level }) =>
							!ingredientCatalog.blockedLevels.has(level)
					)
				)
				.sort(numberSort);
		},
		availableIngredientTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...ingredientCatalog.getValuesByProp(
					'tags',
					false,
					filterAvailableItemsByHiddenDlcs(
						ingredientCatalog.data,
						hiddenDlcs
					).filter(
						({ tags }) =>
							!tags.some((tag) =>
								ingredientCatalog.blockedTags.has(tag)
							)
					)
				),
				DYNAMIC_FOOD_TAG_MAP.popularNegative,
				DYNAMIC_FOOD_TAG_MAP.popularPositive,
			]
				.sort((a, b) => pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b]))
				.map(toGetValueCollection);
		},
		availableNormalGuests: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			const sortState =
				currentStore.persistence.guest.pinyinSortState.use();
			const data =
				sortState === PINYIN_SORT_STATE_MAP.ascending
					? normalGuestCatalog.getPinyinSortedData()
					: sortState === PINYIN_SORT_STATE_MAP.descending
						? normalGuestCatalog.getPinyinSortedData().toReversed()
						: normalGuestCatalog.data;

			return filterAvailableItemsByHiddenDlcs(data, hiddenDlcs).map(
				({ id, name }) => ({ id, name })
			);
		},
		beverageTableAvailabilityDlcs: {
			read: () =>
				new Set(
					currentStore.persistence.beverage.table.availabilityDlcs.use()
				),
			write: (dlcs: Selection) => {
				const values = selectionToStringValues(dlcs);
				if (values !== null) {
					currentStore.persistence.beverage.table.availabilityDlcs.set(
						values
					);
				}
			},
		},
		beverageTableRows: () => beverageTableRows.use(),

		foodTableAvailabilityDlcs: {
			read: () =>
				new Set(
					currentStore.persistence.recipe.table.availabilityDlcs.use()
				),
			write: (dlcs: Selection) => {
				const values = selectionToStringValues(dlcs);
				if (values !== null) {
					currentStore.persistence.recipe.table.availabilityDlcs.set(
						values
					);
				}
			},
		},
		foodTableCookerTypes: {
			read: () =>
				cookerTypeSelectionAdapter.toSelectedKeys(
					new Set(
						currentStore.persistence.recipe.table.cookerTypes.use()
					)
				),
			write: (cookerTypes: Selection) => {
				currentStore.persistence.recipe.table.cookerTypes.set([
					...cookerTypeSelectionAdapter.fromSelection(cookerTypes),
				]);
			},
		},
		foodTableRows: () => foodTableRows.use(),

		ingredientScoreChanges: () => ingredientScoreChanges.use(),
		savedGuestMealsWithEvaluation: () =>
			savedGuestMealsWithEvaluation.use(),
	};
};

export type TNormalGuestComputedMethods = ComputedMethods<
	ReturnType<typeof createNormalGuestComputedState>
>;

export type TNormalGuestComputedStore = StoreApi<
	typeof normalGuestInitialState,
	TNormalGuestComputedMethods
>;
