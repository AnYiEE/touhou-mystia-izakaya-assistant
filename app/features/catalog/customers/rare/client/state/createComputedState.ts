import { type State } from '@davstack/store';
import { type Selection } from '@heroui/table';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import type { TBeverage, TRecipe } from '@/domain/catalog/food/types';
import { getBondRecipes } from '@/domain/catalog/queries/getBondRecipes';
import { getBondRewards } from '@/domain/catalog/queries/getBondRewards';
import type { TCookerName } from '@/domain/data/cookers/types';
import type { TIngredientName } from '@/domain/data/ingredients/types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import type {
	TBeverageTag,
	TIngredientTag,
	TRecipeTag,
} from '@/domain/data/tags/types';
import { evaluateRareSavedMeal } from '@/domain/evaluation/evaluateSavedMeal';
import { getIngredientScoreChanges } from '@/domain/evaluation/getIngredientScoreChanges';
import {
	checkIngredientEasterEgg as checkCustomerRareIngredientEasterEgg,
	checkRecipeEasterEgg as checkCustomerRareRecipeEasterEgg,
} from '@/domain/evaluation/rareCustomerMeal';

import { getVisibleSavedMeals } from '@/features/catalog/customers/shared/mealPlanning/getVisibleSavedMeals';
import { buildSelectionTip } from '@/features/catalog/customers/shared/presentation/buildSelectionTip';
import { buildBeverageSuitabilityRows } from '@/features/catalog/customers/shared/queries/buildBeverageSuitabilityRows';
import { buildRecipeSuitabilityRows } from '@/features/catalog/customers/shared/queries/buildRecipeSuitabilityRows';
import { createCustomerPlansComputedDefinition } from '@/features/customerPlans/client/state/planStoreDefinition';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { sortBy } from '@/shared/utilities/collections/sortBy';
import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { matchPinyinName } from '@/shared/utilities/search/matchPinyinName';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';
import { createComputedAccessor } from '@/shared/utilities/state/createComputedAccessor';

import {
	type customerRareInitialState,
	customerRareNames as getNames,
	customerRareBeverageInstance as instance_beverage,
	customerRareClothesInstance as instance_clothes,
	customerRareCookerInstance as instance_cooker,
	customerRareCustomerInstance as instance_customer,
	customerRareIngredientInstance as instance_ingredient,
	customerRareOrnamentInstance as instance_ornament,
	customerRarePartnerInstance as instance_partner,
	customerRareRecipeInstance as instance_recipe,
} from './initialState';

export function createCustomerRareComputedState(
	currentStore: State<typeof customerRareInitialState>
) {
	const beverageTableRows = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentCustomerName = shouldGet
			? currentStore.shared.customer.name.get()
			: currentStore.shared.customer.name.use();
		const customerBeverageTags =
			currentCustomerName === null
				? null
				: instance_customer.getPropsByName(
						currentCustomerName,
						'beverageTags'
					);

		return buildBeverageSuitabilityRows({
			beverageInstance: instance_beverage,
			customerBeverageTags,
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
					? currentStore.shared.customer.select.beverageTag.get()
					: currentStore.shared.customer.select.beverageTag.use()),
			] as TBeverageTag[],
			sortDescriptor: shouldGet
				? currentStore.persistence.beverage.table.sortDescriptor.get()
				: currentStore.persistence.beverage.table.sortDescriptor.use(),
		});
	});

	const recipeTableRows = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentCustomerName = shouldGet
			? currentStore.shared.customer.name.get()
			: currentStore.shared.customer.name.use();
		const currentCustomerPopularTrend = shouldGet
			? currentStore.shared.customer.popularTrend.get()
			: currentStore.shared.customer.popularTrend.use();
		const isFamousShop = shouldGet
			? currentStore.shared.customer.famousShop.get()
			: currentStore.shared.customer.famousShop.use();
		const customerData =
			currentCustomerName === null
				? null
				: instance_customer.getPropsByName(currentCustomerName);

		return buildRecipeSuitabilityRows({
			customerNegativeTags: customerData?.negativeTags ?? [],
			customerPositiveTags: customerData?.positiveTags ?? null,
			getEasterEggScore: (recipe) => {
				if (currentCustomerName === null) {
					return null;
				}

				const { recipe: easterEggRecipe, score } =
					checkCustomerRareRecipeEasterEgg({
						currentCustomerName,
						currentRecipeName: recipe.name,
					});

				return recipe.name === easterEggRecipe ? score : null;
			},
			hiddenDlcs: (shouldGet
				? currentStore.shared.hiddenItems.dlcs.get()
				: currentStore.shared.hiddenItems.dlcs.use()) as ReadonlySet<
				TRecipe['dlc']
			>,
			hiddenIngredients: shouldGet
				? currentStore.shared.recipe.table.hiddenIngredients.get()
				: currentStore.shared.recipe.table.hiddenIngredients.use(),
			hiddenRecipes: shouldGet
				? currentStore.shared.recipe.table.hiddenRecipes.get()
				: currentStore.shared.recipe.table.hiddenRecipes.use(),
			isFamousShop,
			matchSearch: matchPinyinName,
			page: shouldGet
				? currentStore.shared.recipe.table.page.get()
				: currentStore.shared.recipe.table.page.use(),
			popularTrend: currentCustomerPopularTrend,
			recipeInstance: instance_recipe,
			rowsPerPage: shouldGet
				? currentStore.shared.recipe.table.row.get()
				: currentStore.shared.recipe.table.row.use(),
			searchValue: shouldGet
				? currentStore.shared.recipe.searchValue.get()
				: currentStore.shared.recipe.searchValue.use(),
			selectedAvailabilityDlcs: shouldGet
				? currentStore.persistence.recipe.table.availabilityDlcs.get()
				: currentStore.persistence.recipe.table.availabilityDlcs.use(),
			selectedCookers: (shouldGet
				? currentStore.persistence.recipe.table.cookers.get()
				: currentStore.persistence.recipe.table.cookers.use()) as TCookerName[],
			selectedRecipeTags: [
				...(shouldGet
					? currentStore.shared.customer.select.recipeTag.get()
					: currentStore.shared.customer.select.recipeTag.use()),
			] as TRecipeTag[],
			sortDescriptor: shouldGet
				? currentStore.persistence.recipe.table.sortDescriptor.get()
				: currentStore.persistence.recipe.table.sortDescriptor.use(),
		});
	});

	const currentMealPrice = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentBeverageName = shouldGet
			? currentStore.shared.beverage.name.get()
			: currentStore.shared.beverage.name.use();
		const currentRecipeData = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.customer.isDarkMatter.get()
				: currentStore.shared.customer.isDarkMatter.use()
		);

		const beveragePrice =
			currentBeverageName === null
				? 0
				: instance_beverage.getPropsByName(
						currentBeverageName,
						'price'
					);
		const recipePrice =
			currentRecipeData === null
				? 0
				: isDarkMatter
					? DARK_MATTER_META_MAP.price
					: instance_recipe.getPropsByName(
							currentRecipeData.name,
							'price'
						);

		return beveragePrice + recipePrice;
	});

	const bondRewards = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentCustomerName = shouldGet
			? currentStore.shared.customer.name.get()
			: currentStore.shared.customer.name.use();

		if (currentCustomerName === null) {
			return {
				bondClothes: null,
				bondCooker: null,
				bondOrnaments: [],
				bondPartner: null,
				bondRecipes: [],
				collection: false,
				hasBondRewards: false,
			};
		}

		const currentCustomerCollection = instance_customer.getPropsByName(
			currentCustomerName,
			'collection'
		);

		return getBondRewards({
			collection: currentCustomerCollection,
			customerName: currentCustomerName,
			getBondClothes: (customerName) =>
				instance_clothes.getBondClothes(customerName),
			getBondCooker: (customerName) =>
				instance_cooker.getBondCooker(customerName),
			getBondOrnaments: (customerName) =>
				instance_ornament.getBondOrnaments(customerName),
			getBondPartner: (customerName) =>
				instance_partner.getBondPartner(customerName),
			getBondRecipes: (customerName) =>
				getBondRecipes(customerName, instance_recipe.data),
		});
	});

	const ingredientScoreChanges = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentCustomerName = shouldGet
			? currentStore.shared.customer.name.get()
			: currentStore.shared.customer.name.use();
		const currentRecipeData = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const currentPopularTrend = shouldGet
			? currentStore.shared.customer.popularTrend.get()
			: currentStore.shared.customer.popularTrend.use();
		const currentCustomerOrderRecipeTag = shouldGet
			? currentStore.shared.customer.order.get().recipeTag
			: currentStore.shared.customer.order.use().recipeTag;
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.customer.isDarkMatter.get()
				: currentStore.shared.customer.isDarkMatter.use()
		);
		const isFamousShop = shouldGet
			? currentStore.shared.customer.famousShop.get()
			: currentStore.shared.customer.famousShop.use();

		if (currentCustomerName === null || currentRecipeData === null) {
			return { changesByName: {}, darkIngredientNames: [] };
		}

		const {
			negativeTags: currentRecipeNegativeTags,
			positiveTags: currentRecipePositiveTags,
		} = instance_recipe.getPropsByName(currentRecipeData.name);
		const currentRecipeIngredients: ReadonlyArray<TIngredientName> =
			instance_recipe.getRecipeVariantById(
				currentRecipeData.name,
				currentRecipeData.recipeId
			).ingredients;
		const {
			negativeTags: customerNegativeTags,
			positiveTags: customerPositiveTags,
		} = instance_customer.getPropsByName(currentCustomerName);

		return getIngredientScoreChanges({
			calculateIngredientTagsWithTrend: (ingredientTags) =>
				instance_ingredient.calculateTagsWithTrend(
					ingredientTags,
					currentPopularTrend,
					isFamousShop
				) as TRecipeTag[],
			calculateRecipeTagsWithTrend: (recipeTags) =>
				instance_recipe.calculateTagsWithTrend(
					recipeTags,
					currentPopularTrend,
					isFamousShop
				),
			candidates: instance_ingredient.data.map(({ name, tags }) => ({
				name,
				tags,
			})),
			composeRecipeTagsWithPopularTrend: (tags) =>
				instance_recipe.composeTagsWithPopularTrend(
					currentRecipeIngredients,
					currentRecipeData.extraIngredients,
					currentRecipePositiveTags,
					tags as TIngredientTag[],
					currentPopularTrend
				),
			currentCustomerOrderRecipeTag,
			currentPopularTrend,
			currentRecipeExtraIngredients: currentRecipeData.extraIngredients,
			currentRecipeIngredients,
			currentRecipeName: currentRecipeData.name,
			currentRecipeNegativeTags,
			customerNegativeTags,
			customerPositiveTags,
			getIngredientEasterEggScore: ({
				currentIngredients,
				currentRecipeName,
				ingredientName,
			}) => {
				const { ingredient: easterEggIngredient, score } =
					checkCustomerRareIngredientEasterEgg({
						currentCustomerName,
						currentIngredients: [...currentIngredients],
						currentRecipeName,
					});

				if (
					ingredientName !== easterEggIngredient ||
					currentRecipeIngredients.includes(easterEggIngredient) ||
					currentRecipeData.extraIngredients.includes(
						easterEggIngredient
					)
				) {
					return null;
				}

				return score;
			},
			getIngredientScoreChange: (
				oldRecipePositiveTags,
				newRecipePositiveTags,
				selectedCustomerPositiveTags,
				selectedCustomerNegativeTags
			) =>
				instance_recipe.getIngredientScoreChange(
					oldRecipePositiveTags,
					newRecipePositiveTags,
					selectedCustomerPositiveTags,
					selectedCustomerNegativeTags
				),
			getIngredientTags: (ingredientName) =>
				instance_ingredient.getPropsByName(ingredientName, 'tags'),
			isDarkMatter,
		});
	});

	const savedCustomerMealsWithEvaluation = createComputedAccessor(
		(getOrUse) => {
			const shouldGet = getOrUse === 'get';
			const currentCustomerName = shouldGet
				? currentStore.shared.customer.name.get()
				: currentStore.shared.customer.name.use();
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
			const hiddenRecipes = shouldGet
				? currentStore.shared.recipe.table.hiddenRecipes.get()
				: currentStore.shared.recipe.table.hiddenRecipes.use();
			const currentPopularTrend = shouldGet
				? currentStore.shared.customer.popularTrend.get()
				: currentStore.shared.customer.popularTrend.use();
			const isFamousShop = shouldGet
				? currentStore.shared.customer.famousShop.get()
				: currentStore.shared.customer.famousShop.use();

			if (currentCustomerName === null) {
				return null;
			}

			const currentCustomerMeals = savedMeals[currentCustomerName];

			const visibleMeals = getVisibleSavedMeals({
				hiddenBeverages,
				hiddenDlcs,
				hiddenIngredients,
				hiddenRecipes,
				meals: currentCustomerMeals,
				resolveAvailabilityRefs: (meal) => {
					try {
						return {
							beveragePaths: instance_beverage.getPropsByName(
								meal.beverage,
								'availabilityPaths'
							),
							ingredientPaths: meal.recipe.extraIngredients.map(
								(ingredientName) =>
									instance_ingredient.getPropsByName(
										ingredientName,
										'availabilityPaths'
									)
							),
							recipePaths: instance_recipe.getPropsByName(
								meal.recipe.name,
								'availabilityPaths'
							),
						};
					} catch {
						return null;
					}
				},
				resolveItemRefs: (meal) => {
					try {
						const recipeIngredients =
							instance_recipe.getRecipeVariantById(
								meal.recipe.name,
								meal.recipe.recipeId
							).ingredients;
						return {
							beverageName: meal.beverage,
							ingredientNames: [
								...recipeIngredients,
								...meal.recipe.extraIngredients,
							],
							recipeName: meal.recipe.name,
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
				evaluation: evaluateRareSavedMeal({
					beverageName: meal.beverage,
					customerName: currentCustomerName,
					customerOrder: meal.order,
					hasMystiaCooker: meal.hasMystiaCooker,
					isFamousShop,
					popularTrend: currentPopularTrend,
					recipeData: meal.recipe,
				}),
				meal,
				visibleIndex,
			}));
		}
	);

	const unsatisfiedSelectionTip = createComputedAccessor((getOrUse) => {
		const shouldGet = getOrUse === 'get';
		const currentBeverageName = shouldGet
			? currentStore.shared.beverage.name.get()
			: currentStore.shared.beverage.name.use();
		const currentRecipeData = shouldGet
			? currentStore.shared.recipe.data.get()
			: currentStore.shared.recipe.data.use();
		const hasMystiaCooker = shouldGet
			? currentStore.shared.customer.hasMystiaCooker.get()
			: currentStore.shared.customer.hasMystiaCooker.use();
		const isDarkMatter = Boolean(
			shouldGet
				? currentStore.shared.customer.isDarkMatter.get()
				: currentStore.shared.customer.isDarkMatter.use()
		);

		const args = {
			hasMystiaCooker,
			hasSelectedBeverage: currentBeverageName !== null,
			hasSelectedRecipe: currentRecipeData !== null,
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
			return instance_beverage
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_beverage.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableBeverageNames: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_beverage
				.getValuesByProp(
					'name',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_beverage.data,
						hiddenDlcs
					)
				)
				.sort(pinyinSort);
		},
		availableBeverageTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return sortBy(
				instance_beverage.sortedTags,
				instance_beverage.getValuesByProp(
					'tags',
					false,
					filterAvailableItemsByHiddenDlcs(
						instance_beverage.data,
						hiddenDlcs
					)
				)
			).map(toGetValueCollection);
		},
		availableCustomerAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_customer
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_customer.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableCustomerNames: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return sortBy(
				getNames(
					currentStore.persistence.customer.pinyinSortState.use()
				),
				instance_customer.getValuesByProp(
					'name',
					false,
					filterAvailableItemsByHiddenDlcs(
						instance_customer.data,
						hiddenDlcs
					)
				)
			).map(toGetValueCollection);
		},
		availableCustomerPlaces: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_customer
				.getValuesByProp(
					'places',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_customer.data,
						hiddenDlcs
					)
				)
				.sort(pinyinSort);
		},
		availableIngredientAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_ingredient
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_ingredient.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableIngredientLevels: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_ingredient
				.getValuesByProp(
					'level',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_ingredient.data,
						hiddenDlcs
					).filter(
						({ level }) =>
							!instance_ingredient.blockedLevels.has(level)
					)
				)
				.sort(numberSort);
		},
		availableIngredientTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...instance_ingredient.getValuesByProp(
					'tags',
					false,
					filterAvailableItemsByHiddenDlcs(
						instance_ingredient.data,
						hiddenDlcs
					).filter(
						({ tags }) =>
							!tags.some((tag) =>
								instance_ingredient.blockedTags.has(tag)
							)
					)
				),
				DYNAMIC_TAG_MAP.popularNegative,
				DYNAMIC_TAG_MAP.popularPositive,
			]
				.map(toGetValueCollection)
				.sort(pinyinSort);
		},
		availableRecipeAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_recipe
				.getValuesByProp(
					'availabilityDlcs',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_recipe.data,
						hiddenDlcs
					)
				)
				.sort(numberSort);
		},
		availableRecipeCookers: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return Array.from(
				new Set(
					filterAvailableItemsByHiddenDlcs(
						instance_recipe.data,
						hiddenDlcs
					)
						.values()
						.flatMap(({ recipes }) =>
							recipes.values().map(({ cooker }) => cooker)
						)
				),
				toGetValueCollection
			).sort(pinyinSort);
		},
		availableRecipeNames: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return instance_recipe
				.getValuesByProp(
					'name',
					true,
					filterAvailableItemsByHiddenDlcs(
						instance_recipe.data,
						hiddenDlcs
					).filter(
						({ name }) => !instance_recipe.blockedRecipes.has(name)
					)
				)
				.sort(pinyinSort);
		},
		availableRecipeTags: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...instance_recipe.getValuesByProp(
					'positiveTags',
					false,
					filterAvailableItemsByHiddenDlcs(
						instance_recipe.data,
						hiddenDlcs
					).filter(
						({ positiveTags }) =>
							!positiveTags.some((positiveTag) =>
								instance_recipe.blockedTags.has(positiveTag)
							)
					)
				),
				DYNAMIC_TAG_MAP.popularNegative,
				DYNAMIC_TAG_MAP.popularPositive,
			]
				.map(toGetValueCollection)
				.sort(pinyinSort);
		},

		beverageTableAvailabilityDlcs: {
			read: () =>
				new Set(
					currentStore.persistence.beverage.table.availabilityDlcs.use()
				),
			write: (dlcs: Selection) => {
				currentStore.persistence.beverage.table.availabilityDlcs.set([
					...(dlcs === 'all' ? [dlcs] : dlcs),
				] as never);
			},
		},
		beverageTableRows: () => beverageTableRows.use(),

		recipeTableAvailabilityDlcs: {
			read: () =>
				new Set(
					currentStore.persistence.recipe.table.availabilityDlcs.use()
				),
			write: (dlcs: Selection) => {
				currentStore.persistence.recipe.table.availabilityDlcs.set([
					...(dlcs === 'all' ? [dlcs] : dlcs),
				] as never);
			},
		},
		recipeTableCookers: {
			read: () =>
				new Set(currentStore.persistence.recipe.table.cookers.use()),
			write: (cookers: Selection) => {
				currentStore.persistence.recipe.table.cookers.set([
					...(cookers === 'all' ? [cookers] : cookers),
				] as never);
			},
		},
		recipeTableRows: () => recipeTableRows.use(),

		bondRewards: () => bondRewards.use(),
		currentMealPrice: () => currentMealPrice.use(),
		ingredientScoreChanges: () => ingredientScoreChanges.use(),
		savedCustomerMealsWithEvaluation: () =>
			savedCustomerMealsWithEvaluation.use(),
		unsatisfiedSelectionTip: () => unsatisfiedSelectionTip.use(),
		...createCustomerPlansComputedDefinition(currentStore),
	};
}
