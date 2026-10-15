'use client';

import { useMemo } from 'react';

import { isAvailableWithHiddenDlcs } from '@/domain/availability';
import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import type { ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import { globalStore } from '@/features/preferences/client/state/globalPersistenceStore';

import {
	type TDayMapEntity,
	checkBeverageId,
	checkIngredientId,
} from './dayMapEntities';
import { checkDayMapLabel, getDayMapDlc } from './dayMapLabels';

export interface IDayMapVisibility {
	isMapVisible: (map: TDayMapLabel) => boolean;
	isProductVisible: (
		product: Pick<ICollectionPointYieldProduct, 'productId' | 'productType'>
	) => boolean;
	isSpecialGuestVisible: (id: TSpecialGuestId) => boolean;
}

const beverageCatalog = BeverageCatalog.getInstance();
const ingredientCatalog = IngredientCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

/**
 * @description What the map may show under the global settings: datasets the
 * player does not own, and ingredients or beverages they disabled, are hidden.
 */
export function useDayMapVisibility(): IDayMapVisibility {
	const hiddenDlcs = globalStore.hiddenDlcs.use();
	const hiddenBeverages = globalStore.hiddenBeverages.use();
	const hiddenIngredients = globalStore.hiddenIngredients.use();

	return useMemo(
		() => ({
			isMapVisible: (map) => {
				const dlc = getDayMapDlc(map);
				return dlc === 0 || !hiddenDlcs.has(dlc);
			},
			isProductVisible: ({ productId, productType }) => {
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
			isSpecialGuestVisible: (id) =>
				isAvailableWithHiddenDlcs(
					specialGuestCatalog.getPropsById(id, 'availabilityPaths'),
					hiddenDlcs
				),
		}),
		[hiddenBeverages, hiddenDlcs, hiddenIngredients]
	);
}

/**
 * @description Drops what the settings hide. A collection point whose every
 * product is hidden disappears; exits into a hidden map are dropped as well.
 */
export function filterVisibleDayMapEntities(
	entities: ReadonlyArray<TDayMapEntity>,
	{ isMapVisible, isProductVisible, isSpecialGuestVisible }: IDayMapVisibility
) {
	const result: TDayMapEntity[] = [];
	for (const entity of entities) {
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
