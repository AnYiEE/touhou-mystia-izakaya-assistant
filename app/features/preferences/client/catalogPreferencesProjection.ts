import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import type { TDlc } from '@/domain/data/shared/types';
import type { IMealFood } from '@/domain/meals/types';
import type { IPopularTrend } from '@/domain/trends/types';

import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { badgesStore } from '@/features/catalog/items/badges/client/state/store';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
import { clothesStore } from '@/features/catalog/items/clothes/client/state/store';
import { cookersStore } from '@/features/catalog/items/cookers/client/state/store';
import { currencyItemsStore } from '@/features/catalog/items/currencyItems/client/state/store';
import { decorationsStore } from '@/features/catalog/items/decorations/client/state/store';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import { fishingCollectiblesStore } from '@/features/catalog/items/fishingCollectibles/client/state/store';
import { generalItemsStore } from '@/features/catalog/items/generalItems/client/state/store';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';
import { recordsStore } from '@/features/catalog/items/records/client/state/store';
import type { ICatalogPreferencesProjection } from '@/features/preferences/contracts';

import { globalStore } from './state/globalPersistenceStore';

const foodCatalog = FoodCatalog.getInstance();

function checkMealFoodHasHiddenItem(
	mealFood: IMealFood,
	hiddenFoods: ReadonlySet<TFoodId>,
	hiddenIngredients: ReadonlySet<TIngredientId>
) {
	try {
		const food = foodCatalog.resolveMealFood(mealFood);
		return (
			hiddenFoods.has(food.food) ||
			food.baseIngredients.some((ingredient) =>
				hiddenIngredients.has(ingredient)
			)
		);
	} catch {
		return true;
	}
}

function updateMealFoodForHiddenItems(
	mealFood: IMealFood,
	hiddenFoods: ReadonlySet<TFoodId>,
	hiddenIngredients: ReadonlySet<TIngredientId>
): IMealFood | null | undefined {
	if (checkMealFoodHasHiddenItem(mealFood, hiddenFoods, hiddenIngredients)) {
		return null;
	}

	const extraIngredients = mealFood.extraIngredients.filter(
		(ingredient) => !hiddenIngredients.has(ingredient)
	);

	if (extraIngredients.length !== mealFood.extraIngredients.length) {
		return { ...mealFood, extraIngredients };
	}

	return undefined;
}

function clearHiddenBeverageSelections(
	hiddenBeverages: ReadonlySet<TBeverageId>
) {
	const normalBeverage = normalGuestStore.shared.beverage.id.get();
	if (normalBeverage !== null && hiddenBeverages.has(normalBeverage)) {
		normalGuestStore.shared.beverage.id.set(null);
	}

	const specialBeverage = specialGuestStore.shared.beverage.id.get();
	if (specialBeverage !== null && hiddenBeverages.has(specialBeverage)) {
		specialGuestStore.shared.beverage.id.set(null);
	}
}

function clearHiddenFoodSelections(
	hiddenFoods: ReadonlySet<TFoodId>,
	hiddenIngredients: ReadonlySet<TIngredientId>
) {
	const normalMealFood = normalGuestStore.shared.recipe.data.get();
	if (normalMealFood !== null) {
		const nextNormalMealFood = updateMealFoodForHiddenItems(
			normalMealFood,
			hiddenFoods,
			hiddenIngredients
		);
		if (nextNormalMealFood !== undefined) {
			normalGuestStore.shared.recipe.data.set(nextNormalMealFood);
		}
	}

	const specialMealFood = specialGuestStore.shared.recipe.data.get();
	if (specialMealFood !== null) {
		const nextSpecialMealFood = updateMealFoodForHiddenItems(
			specialMealFood,
			hiddenFoods,
			hiddenIngredients
		);
		if (nextSpecialMealFood !== undefined) {
			specialGuestStore.shared.recipe.data.set(nextSpecialMealFood);
		}
	}
}

function getHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	return hiddenDlcValues.map(Number) as TDlc[];
}

function applyInitialHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	const hiddenDlcs = getHiddenDlcs(hiddenDlcValues);
	badgesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	beveragesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	clothesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	cookersStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	currencyItemsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	normalGuestStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	specialGuestStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	decorationsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	foodsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	fishingCollectiblesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	generalItemsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	ingredientsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	partnersStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	recordsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
}

function applyChangedHiddenDlcs(hiddenDlcValues: ReadonlyArray<string>) {
	const hiddenDlcs = getHiddenDlcs(hiddenDlcValues);
	badgesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	beveragesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	clothesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	cookersStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	currencyItemsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	normalGuestStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	specialGuestStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	decorationsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	foodsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	fishingCollectiblesStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	generalItemsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	ingredientsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	partnersStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
	recordsStore.shared.hiddenItems.dlcs.set(new Set(hiddenDlcs));
}

function applyFamousShop(famousShop: boolean) {
	normalGuestStore.shared.guest.famousShop.set(famousShop);
	specialGuestStore.shared.guest.famousShop.set(famousShop);
	foodsStore.shared.famousShop.set(famousShop);
	ingredientsStore.shared.famousShop.set(famousShop);
}

function applyPopularTrend(popularTrend: IPopularTrend, isInitial: boolean) {
	if (isInitial) {
		normalGuestStore.shared.guest.popularTrend.set(popularTrend);
		specialGuestStore.shared.guest.popularTrend.set(popularTrend);
		foodsStore.shared.popularTrend.set(popularTrend);
		ingredientsStore.shared.popularTrend.set(popularTrend);
		return;
	}

	normalGuestStore.shared.guest.popularTrend.assign(popularTrend);
	specialGuestStore.shared.guest.popularTrend.assign(popularTrend);
	foodsStore.shared.popularTrend.assign(popularTrend);
	ingredientsStore.shared.popularTrend.assign(popularTrend);
}

function applyInitialTableState() {
	const beverageColumns =
		globalStore.persistence.table.columns.beverage.get();
	const foodColumns = globalStore.persistence.table.columns.recipe.get();
	const row = globalStore.persistence.table.row.get();
	const selectableRows = globalStore.shared.table.selectableRows.get();
	const rowSet = new Set([row.toString()]);

	normalGuestStore.shared.beverage.table.columns.set(
		new Set(beverageColumns)
	);
	normalGuestStore.shared.beverage.table.row.set(row);
	normalGuestStore.shared.beverage.table.rows.set(rowSet);
	normalGuestStore.shared.beverage.table.selectableRows.set(selectableRows);
	normalGuestStore.shared.recipe.table.columns.set(new Set(foodColumns));
	normalGuestStore.shared.recipe.table.row.set(row);
	normalGuestStore.shared.recipe.table.rows.set(rowSet);
	normalGuestStore.shared.recipe.table.selectableRows.set(selectableRows);
	specialGuestStore.shared.beverage.table.columns.set(
		new Set(beverageColumns)
	);
	specialGuestStore.shared.beverage.table.row.set(row);
	specialGuestStore.shared.beverage.table.rows.set(rowSet);
	specialGuestStore.shared.beverage.table.selectableRows.set(selectableRows);
	specialGuestStore.shared.recipe.table.columns.set(new Set(foodColumns));
	specialGuestStore.shared.recipe.table.row.set(row);
	specialGuestStore.shared.recipe.table.rows.set(rowSet);
	specialGuestStore.shared.recipe.table.selectableRows.set(selectableRows);

	const hiddenBeverages =
		globalStore.persistence.table.hiddenItems.beverages.get();
	const hiddenFoods = globalStore.persistence.table.hiddenItems.foods.get();
	const hiddenIngredients =
		globalStore.persistence.table.hiddenItems.ingredients.get();
	normalGuestStore.shared.beverage.table.hiddenBeverages.set(
		new Set(hiddenBeverages)
	);
	normalGuestStore.shared.recipe.table.hiddenIngredients.set(
		new Set(hiddenIngredients)
	);
	normalGuestStore.shared.recipe.table.hiddenFoods.set(new Set(hiddenFoods));
	specialGuestStore.shared.beverage.table.hiddenBeverages.set(
		new Set(hiddenBeverages)
	);
	specialGuestStore.shared.recipe.table.hiddenIngredients.set(
		new Set(hiddenIngredients)
	);
	specialGuestStore.shared.recipe.table.hiddenFoods.set(new Set(hiddenFoods));
}

function applyInitialProjection() {
	applyInitialHiddenDlcs(globalStore.persistence.hiddenItems.dlcs.get());
	applyFamousShop(globalStore.persistence.famousShop.get());
	applyPopularTrend(globalStore.persistence.popularTrend.get(), true);
	applyInitialTableState();
}

export function createCatalogPreferencesProjection(): ICatalogPreferencesProjection {
	return {
		start() {
			applyInitialProjection();

			const unsubscribers = [
				globalStore.persistence.hiddenItems.dlcs.onChange(
					applyChangedHiddenDlcs
				),
				globalStore.persistence.famousShop.onChange((famousShop) => {
					applyFamousShop(famousShop);
				}),
				globalStore.persistence.popularTrend.onChange(
					(popularTrend) => {
						applyPopularTrend(popularTrend, false);
					}
				),
				globalStore.persistence.table.columns.beverage.onChange(
					(columns) => {
						normalGuestStore.shared.beverage.table.columns.set(
							new Set(columns)
						);
						specialGuestStore.shared.beverage.table.columns.set(
							new Set(columns)
						);
					}
				),
				globalStore.persistence.table.columns.recipe.onChange(
					(foodColumns) => {
						normalGuestStore.shared.recipe.table.columns.set(
							new Set(foodColumns)
						);
						specialGuestStore.shared.recipe.table.columns.set(
							new Set(foodColumns)
						);
					}
				),
				globalStore.persistence.table.row.onChange((row) => {
					const rowString = row.toString();
					normalGuestStore.shared.beverage.table.page.set(1);
					normalGuestStore.shared.beverage.table.row.set(row);
					normalGuestStore.shared.beverage.table.rows.set(
						new Set([rowString])
					);
					normalGuestStore.shared.recipe.table.page.set(1);
					normalGuestStore.shared.recipe.table.row.set(row);
					normalGuestStore.shared.recipe.table.rows.set(
						new Set([rowString])
					);
					specialGuestStore.shared.beverage.table.page.set(1);
					specialGuestStore.shared.beverage.table.row.set(row);
					specialGuestStore.shared.beverage.table.rows.set(
						new Set([rowString])
					);
					specialGuestStore.shared.recipe.table.page.set(1);
					specialGuestStore.shared.recipe.table.row.set(row);
					specialGuestStore.shared.recipe.table.rows.set(
						new Set([rowString])
					);
				}),
				globalStore.persistence.table.hiddenItems.beverages.onChange(
					(beverages) => {
						const hiddenBeverages = new Set(beverages);
						normalGuestStore.shared.beverage.table.hiddenBeverages.set(
							new Set(beverages)
						);
						specialGuestStore.shared.beverage.table.hiddenBeverages.set(
							new Set(beverages)
						);
						clearHiddenBeverageSelections(hiddenBeverages);
					}
				),
				globalStore.persistence.table.hiddenItems.ingredients.onChange(
					(ingredients) => {
						const hiddenIngredients = new Set(ingredients);
						normalGuestStore.shared.recipe.table.hiddenIngredients.set(
							new Set(ingredients)
						);
						specialGuestStore.shared.recipe.table.hiddenIngredients.set(
							new Set(ingredients)
						);
						clearHiddenFoodSelections(
							new Set<TFoodId>(),
							hiddenIngredients
						);
					}
				),
				globalStore.persistence.table.hiddenItems.foods.onChange(
					(foods) => {
						const hiddenFoods = new Set(foods);
						normalGuestStore.shared.recipe.table.hiddenFoods.set(
							new Set(foods)
						);
						specialGuestStore.shared.recipe.table.hiddenFoods.set(
							new Set(foods)
						);
						clearHiddenFoodSelections(
							hiddenFoods,
							new Set<TIngredientId>()
						);
					}
				),
			];

			return () => {
				unsubscribers.forEach((unsubscribe) => {
					unsubscribe();
				});
			};
		},
	};
}
