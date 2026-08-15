import { type State } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { selectionToStringValues } from '@/design/ui/components/selectionKeys';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import type { TBeverage, TFood } from '@/domain/catalog/food/types';
import { resolveLegacyTagLabel } from '@/domain/catalog/legacy/resolveLegacyTagLabel';
import { getBondFoods } from '@/domain/catalog/queries/getBondFoods';
import { getBondRewards } from '@/domain/catalog/queries/getBondRewards';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import {
	BEVERAGE_TAG_MAP,
	DARK_MATTER_META_MAP,
	DYNAMIC_FOOD_TAG_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type { TBeverageTagId, TFoodTagId } from '@/domain/data/tags/types';
import { evaluateSpecialGuestSavedMeal } from '@/domain/evaluation/evaluateSavedMeal';
import { getIngredientScoreChanges } from '@/domain/evaluation/getIngredientScoreChanges';
import {
	checkFoodEasterEgg as checkSpecialGuestFoodEasterEgg,
	checkIngredientEasterEgg as checkSpecialGuestIngredientEasterEgg,
} from '@/domain/evaluation/specialGuestMeal';

import { getVisibleSavedMeals } from '@/features/catalog/guests/shared/mealPlanning/getVisibleSavedMeals';
import { buildSelectionTip } from '@/features/catalog/guests/shared/presentation/buildSelectionTip';
import { buildBeverageSuitabilityRows } from '@/features/catalog/guests/shared/queries/buildBeverageSuitabilityRows';
import { buildFoodSuitabilityRows } from '@/features/catalog/guests/shared/queries/buildFoodSuitabilityRows';
import { cookerTypeSelectionAdapter } from '@/features/catalog/guests/shared/state/cookerTypeSelectionAdapter';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';
import { createSpecialGuestPlansComputedDefinition } from '@/features/specialGuestPlans/client/state/planStoreDefinition';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { matchPinyinName } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';
import { createComputedAccessor } from '@/shared/utilities/state/createComputedAccessor';

import {
	specialGuestBeverageCatalog as beverageCatalog,
	specialGuestClothesCatalog as clothesCatalog,
	specialGuestCookerCatalog as cookerCatalog,
	specialGuestDecorationCatalog as decorationCatalog,
	specialGuestFoodCatalog as foodCatalog,
	specialGuestNames as getNames,
	specialGuestIngredientCatalog as ingredientCatalog,
	specialGuestPartnerCatalog as partnerCatalog,
	specialGuestCatalog,
	type specialGuestInitialState,
} from './initialState';

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

export function createSpecialGuestComputedState(
	currentStore: State<typeof specialGuestInitialState>
) {
	const currentGuestName = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentSpecialGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();

		return currentSpecialGuest === null
			? null
			: specialGuestCatalog.getPropsById(currentSpecialGuest, 'name');
	});

	const beverageTableRows = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentSpecialGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const guestBeverageTags =
			currentSpecialGuest === null
				? null
				: specialGuestCatalog.getPropsById(
						currentSpecialGuest,
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
		const currentSpecialGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const currentGuestPopularTrend = shouldGet
			? currentStore.shared.guest.popularTrend.get()
			: currentStore.shared.guest.popularTrend.use();
		const isFamousShop = shouldGet
			? currentStore.shared.guest.famousShop.get()
			: currentStore.shared.guest.famousShop.use();
		const guestData =
			currentSpecialGuest === null
				? null
				: specialGuestCatalog.getPropsById(currentSpecialGuest);

		return buildFoodSuitabilityRows({
			foodCatalog,
			getEasterEggScore: (food) => {
				if (currentSpecialGuest === null) {
					return null;
				}

				const { food: easterEggFood, score } =
					checkSpecialGuestFoodEasterEgg({
						currentFood: food.id,
						currentSpecialGuest,
					});

				return easterEggFood === food.id ? score : null;
			},
			guestNegativeTags: guestData?.negativeTags ?? [],
			guestPositiveTags: guestData?.positiveTags ?? null,
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

	const currentMealPrice = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentBeverage = shouldGet
			? currentStore.shared.beverage.id.get()
			: currentStore.shared.beverage.id.use();
		const currentMealFood = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.guest.isDarkMatter.get()
				: currentStore.shared.guest.isDarkMatter.use()
		);

		const beveragePrice =
			currentBeverage === null
				? 0
				: beverageCatalog.getPropsById(currentBeverage, 'price');
		const foodPrice =
			currentMealFood === null
				? 0
				: isDarkMatter
					? DARK_MATTER_META_MAP.price
					: foodCatalog.getRecipeOwnerById(currentMealFood.recipeId)
							.food.price;

		return beveragePrice + foodPrice;
	});

	const bondRewards = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentSpecialGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();

		if (currentSpecialGuest === null) {
			return {
				bondClothes: null,
				bondCooker: null,
				bondDecorations: [],
				bondFoods: [],
				bondPartner: null,
				collection: false,
				hasBondRewards: false,
			};
		}

		const { collection } =
			specialGuestCatalog.getPropsById(currentSpecialGuest);
		const rewards = getBondRewards({
			collection,
			getBondClothes: (specialGuest) =>
				clothesCatalog.getBondClothesBySpecialGuest(specialGuest),
			getBondCooker: (specialGuest) =>
				cookerCatalog.getBondCookerBySpecialGuest(specialGuest),
			getBondDecorations: (specialGuest) =>
				decorationCatalog.getBondDecorationsBySpecialGuest(
					specialGuest
				),
			getBondFoods: (specialGuest) =>
				getBondFoods(specialGuest, foodCatalog.data),
			getBondPartner: (specialGuest) =>
				partnerCatalog.getBondPartnerBySpecialGuest(specialGuest),
			specialGuest: currentSpecialGuest,
		});

		return {
			bondClothes:
				rewards.bondClothes === null
					? null
					: {
							id: rewards.bondClothes,
							name: clothesCatalog.getPropsById(
								rewards.bondClothes,
								'name'
							),
						},
			bondCooker:
				rewards.bondCooker === null
					? null
					: {
							id: rewards.bondCooker,
							name: cookerCatalog.getPropsById(
								rewards.bondCooker,
								'name'
							),
						},
			bondDecorations: rewards.bondDecorations.map(({ id, level }) => ({
				id,
				level,
				name: decorationCatalog.getPropsById(id, 'name'),
			})),
			bondFoods: rewards.bondFoods.map(({ id, level }) => ({
				id,
				level,
				name: foodCatalog.getPropsById(id, 'name'),
			})),
			bondPartner:
				rewards.bondPartner === null
					? null
					: {
							id: rewards.bondPartner,
							name: partnerCatalog.getPropsById(
								rewards.bondPartner,
								'name'
							),
						},
			collection: rewards.collection,
			hasBondRewards: rewards.hasBondRewards,
		};
	});

	const ingredientScoreChanges = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentSpecialGuest = shouldGet
			? currentStore.shared.guest.id.get()
			: currentStore.shared.guest.id.use();
		const currentMealFood = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const currentPopularTrend = shouldGet
			? currentStore.shared.guest.popularTrend.get()
			: currentStore.shared.guest.popularTrend.use();
		const currentGuestOrderFoodTag = shouldGet
			? currentStore.shared.guest.order.get().foodTag
			: currentStore.shared.guest.order.use().foodTag;
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.guest.isDarkMatter.get()
				: currentStore.shared.guest.isDarkMatter.use()
		);
		const isFamousShop = shouldGet
			? currentStore.shared.guest.famousShop.get()
			: currentStore.shared.guest.famousShop.use();

		if (currentSpecialGuest === null || currentMealFood === null) {
			return { changesById: {}, darkIngredients: [] };
		}

		const { food: currentFood, recipe: currentRecipe } =
			foodCatalog.getRecipeOwnerById(currentMealFood.recipeId);
		const currentExtraIngredients = currentMealFood.extraIngredients;
		const {
			negativeTags: specialGuestNegativeTags,
			positiveTags: specialGuestPositiveTags,
		} = specialGuestCatalog.getPropsById(currentSpecialGuest);
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
			currentGuestOrderFoodTag,
			currentMealFood,
			currentPopularTrend,
			getIngredientEasterEggScore: ({
				currentFood,
				currentIngredients,
				ingredient,
			}) => {
				const { ingredient: easterEggIngredient, score } =
					checkSpecialGuestIngredientEasterEgg({
						currentExtraIngredients: currentIngredients,
						currentFood,
						currentFoodIngredients: currentRecipe.ingredients,
						currentSpecialGuest,
					});

				if (
					ingredient !== easterEggIngredient ||
					currentRecipe.ingredients.includes(ingredient) ||
					currentExtraIngredients.includes(ingredient)
				) {
					return null;
				}

				return score;
			},
			getIngredientScoreChange: (
				oldFoodPositiveTags,
				newFoodPositiveTags,
				selectedGuestPositiveTags,
				selectedGuestNegativeTags
			) =>
				foodCatalog.getIngredientScoreChange(
					oldFoodPositiveTags,
					newFoodPositiveTags,
					selectedGuestPositiveTags,
					selectedGuestNegativeTags
				),
			getIngredientTags: (ingredient) =>
				ingredientCatalog.getIngredientTags(ingredient),
			isDarkMatter,
			specialGuestNegativeTags,
			specialGuestPositiveTags,
		});
	});

	const savedGuestMealsWithEvaluation = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentSpecialGuest = shouldGet
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

		if (currentSpecialGuest === null) {
			return null;
		}
		const currentGuestMeals = savedMeals[currentSpecialGuest];

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
						beveragePaths: beverageCatalog.getPropsById(
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
			evaluation: evaluateSpecialGuestSavedMeal({
				beverage: meal.beverage,
				hasMystiaCooker: meal.hasMystiaCooker,
				isFamousShop,
				mealFood: meal.food,
				popularTrend: currentPopularTrend,
				specialGuest: currentSpecialGuest,
				specialGuestOrder: meal.order,
			}),
			meal,
			visibleIndex,
		}));
	});

	const unsatisfiedSelectionTip = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentBeverage = shouldGet
			? currentStore.shared.beverage.id.get()
			: currentStore.shared.beverage.id.use();
		const currentMealFood = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const hasMystiaCooker = shouldGet
			? currentStore.shared.guest.hasMystiaCooker.get()
			: currentStore.shared.guest.hasMystiaCooker.use();
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.guest.isDarkMatter.get()
				: currentStore.shared.guest.isDarkMatter.use()
		);

		const args = {
			hasMystiaCooker,
			hasSelectedBeverage: currentBeverage !== null,
			hasSelectedFood: currentMealFood !== null,
			isDarkMatter,
		};

		return {
			rating: buildSelectionTip({ action: '评级', ...args }),
			save: buildSelectionTip({ action: '保存', ...args }),
		};
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
							!positiveTags.some((tag) =>
								foodCatalog.blockedTags.has(tag)
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
			return specialGuestCatalog
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						specialGuestCatalog.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableGuestMaps: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return specialGuestCatalog
				.getValuesByProp(
					'maps',
					true,
					filterAvailableItemsByHiddenDlcs(
						specialGuestCatalog.data,
						hiddenDlcs
					)
				)
				.map(({ value }) => ({ name: MAP_FACTS[value].label, value }))
				.sort((a, b) => pinyinSort(a.name, b.name));
		},
		availableGuestNames: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return sortBy(
				getNames(currentStore.persistence.guest.pinyinSortState.use()),
				specialGuestCatalog.getValuesByProp(
					'name',
					false,
					filterAvailableItemsByHiddenDlcs(
						specialGuestCatalog.data,
						hiddenDlcs
					)
				)
			).map(toGetValueCollection);
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
		availableSpecialGuests: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			const sortState =
				currentStore.persistence.guest.pinyinSortState.use();
			const data =
				sortState === PINYIN_SORT_STATE_MAP.ascending
					? specialGuestCatalog.getPinyinSortedData()
					: sortState === PINYIN_SORT_STATE_MAP.descending
						? specialGuestCatalog.getPinyinSortedData().toReversed()
						: specialGuestCatalog.data;

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

		bondRewards: () => bondRewards.use(),
		currentGuestName: () => currentGuestName.use(),
		currentMealPrice: () => currentMealPrice.use(),
		ingredientScoreChanges: () => ingredientScoreChanges.use(),
		savedGuestMealsWithEvaluation: () =>
			savedGuestMealsWithEvaluation.use(),
		unsatisfiedSelectionTip: () => unsatisfiedSelectionTip.use(),
		...createSpecialGuestPlansComputedDefinition(currentStore),
	};
}
