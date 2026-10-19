'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';
import type { TDlc } from '@/domain/data/shared/types';

import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import {
	type TDayMapEntity,
	checkBeverageId,
	checkIngredientId,
} from './dayMapEntities';
import { checkDayMapLabel, getDayMapDlc } from './dayMapLabels';

export interface IDayMapVisibility {
	isCookerVisible: (id: TCookerId) => boolean;
	isDlcVisible: (dlc: TDlc) => boolean;
	isFoodVisible: (id: TFoodId) => boolean;
	isMapVisible: (map: TDayMapLabel) => boolean;
	isProductVisible: (
		product: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>
	) => boolean;
	isSpecialGuestVisible: (id: TSpecialGuestId) => boolean;
}

const beverageCatalog = BeverageCatalog.getInstance();
const cookerCatalog = CookerCatalog.getInstance();
const foodCatalog = FoodCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

/** @description Item source links inside a shared map inherit its visit-local visibility policy, including portals. */
export const DayMapIgnorePreferencesContext = createContext(false);

const isVisible = () => true;
const ALL_DAY_MAP_CONTENT_VISIBLE: IDayMapVisibility = {
	isCookerVisible: isVisible,
	isDlcVisible: isVisible,
	isFoodVisible: isVisible,
	isMapVisible: isVisible,
	isProductVisible: isVisible,
	isSpecialGuestVisible: isVisible,
};

/**
 * @description What the map may show under the global settings: datasets the
 * player does not own, and ingredients or beverages they disabled, are hidden.
 */
export function useDayMapVisibility(
	shouldIgnorePreferences?: boolean
): IDayMapVisibility {
	const shouldInheritIgnoredPreferences = useContext(
		DayMapIgnorePreferencesContext
	);
	const hiddenDlcs = globalStore.hiddenDlcs.use();
	const hiddenBeverages = globalStore.hiddenBeverages.use();
	const hiddenFoods = globalStore.hiddenFoods.use();
	const hiddenIngredients = globalStore.hiddenIngredients.use();

	const isCookerVisible = useCallback(
		(id: TCookerId) =>
			isAvailableWithHiddenDlcs(
				cookerCatalog.getPropsById(id, 'availabilityPaths'),
				hiddenDlcs
			),
		[hiddenDlcs]
	);
	const isFoodVisible = useCallback(
		(id: TFoodId) =>
			!hiddenFoods.has(id) &&
			isAvailableWithHiddenDlcs(
				foodCatalog.getPropsById(id, 'availabilityPaths'),
				hiddenDlcs
			),
		[hiddenDlcs, hiddenFoods]
	);
	const isDlcVisible = useCallback(
		(dlc: TDlc) => dlc === 0 || !hiddenDlcs.has(dlc),
		[hiddenDlcs]
	);
	const isMapVisible = useCallback(
		(map: TDayMapLabel) => isDlcVisible(getDayMapDlc(map)),
		[isDlcVisible]
	);
	const isProductVisible = useCallback<IDayMapVisibility['isProductVisible']>(
		({ productId, productType }) => {
			if (productType === 1 && checkIngredientId(productId)) {
				return (
					!hiddenIngredients.has(productId) &&
					isAvailableWithHiddenDlcs(
						ingredientCatalog.getPropsById(
							productId,
							'availabilityPaths'
						),
						hiddenDlcs
					)
				);
			}
			if (productType === 2 && checkBeverageId(productId)) {
				return (
					!hiddenBeverages.has(productId) &&
					isAvailableWithHiddenDlcs(
						beverageCatalog.getPropsById(
							productId,
							'availabilityPaths'
						),
						hiddenDlcs
					)
				);
			}
			return true;
		},
		[hiddenBeverages, hiddenDlcs, hiddenIngredients]
	);
	const isSpecialGuestVisible = useCallback(
		(id: TSpecialGuestId) =>
			isAvailableWithHiddenDlcs(
				specialGuestCatalog.getPropsById(id, 'availabilityPaths'),
				hiddenDlcs
			),
		[hiddenDlcs]
	);
	const visibility = useMemo(
		() => ({
			isCookerVisible,
			isDlcVisible,
			isFoodVisible,
			isMapVisible,
			isProductVisible,
			isSpecialGuestVisible,
		}),
		[
			isCookerVisible,
			isDlcVisible,
			isFoodVisible,
			isMapVisible,
			isProductVisible,
			isSpecialGuestVisible,
		]
	);
	return (shouldIgnorePreferences ?? shouldInheritIgnoredPreferences)
		? ALL_DAY_MAP_CONTENT_VISIBLE
		: visibility;
}

/**
 * @description Drops what the settings hide. A collection point whose every
 * product is hidden disappears; exits into a hidden map are dropped as well.
 */
export function filterVisibleDayMapEntities(
	entities: ReadonlyArray<TDayMapEntity>,
	{
		isDlcVisible,
		isMapVisible,
		isProductVisible,
		isSpecialGuestVisible,
	}: IDayMapVisibility
) {
	const result: TDayMapEntity[] = [];
	for (const entity of entities) {
		if (
			'character' in entity &&
			entity.character.dlc !== undefined &&
			!isDlcVisible(entity.character.dlc)
		) {
			continue;
		}
		switch (entity.layer) {
			case 'collectable': {
				const products = entity.products.filter(isProductVisible);
				if (entity.products.length > 0 && products.length === 0) {
					continue;
				}
				result.push(
					products.length === entity.products.length
						? entity
						: { ...entity, products }
				);
				break;
			}
			case 'specialGuest':
				if (
					entity.character.specialGuest === null ||
					isSpecialGuestVisible(entity.character.specialGuest)
				) {
					result.push(entity);
				}
				break;
			case 'transition': {
				const { target } = entity.transition;
				if (!checkDayMapLabel(target) || isMapVisible(target)) {
					result.push(entity);
				}
				break;
			}
			default:
				result.push(entity);
		}
	}
	return result;
}
