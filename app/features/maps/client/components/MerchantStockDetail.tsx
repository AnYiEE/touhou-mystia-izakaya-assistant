'use client';

import { memo, useMemo } from 'react';

import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import type { TFoodId } from '@/domain/data/foods/types';
import { type TMerchantLabel } from '@/domain/data/places/merchantFacts';
import { MERCHANT_STOCK_FACTS } from '@/domain/data/places/merchantStockFacts';

import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { mapsMessages } from '@/features/maps/client/messages';
import {
	checkBeverageId,
	checkIngredientId,
} from '@/features/maps/client/model/dayMapEntities';
import { type IDayMapVisibility } from '@/features/maps/client/model/useDayMapVisibility';

import { useI18n } from '@/shared/i18n/useI18n';

import MapCatalogItems, {
	type TMapCatalogItemWithMetadata,
} from './MapCatalogItems';

interface IProps {
	merchant: TMerchantLabel;
	onPopoverOpenChange: (isOpen: boolean) => void;
	visibility: IDayMapVisibility;
}

const foodCatalog = FoodCatalog.getInstance();

const foodByRecipeId = new Map<number, TFoodId>();
for (const food of foodCatalog.canonicalData) {
	for (const recipe of food.recipes) {
		foodByRecipeId.set(recipe.id, food.id);
	}
}
const foodIdByProductId = new Map<number, TFoodId>(
	foodCatalog.canonicalData.map(({ id }) => [id, id])
);

function formatRange([min, max]: readonly [number, number]) {
	return min === max ? String(min) : `${min}–${max}`;
}

export function formatStockPriceMultiplier([min, max]: readonly [
	number,
	number,
]) {
	return min === max ? `${min}` : `${min}–${max}`;
}

export function getMerchantStockFoodIds(merchant: TMerchantLabel) {
	const stock = MERCHANT_STOCK_FACTS[merchant];
	const foodIds = new Set<TFoodId>();
	for (const entry of stock?.stock ?? []) {
		const foodId =
			entry.productType === 0
				? foodIdByProductId.get(entry.productId)
				: entry.productType === 6
					? foodByRecipeId.get(entry.productId)
					: undefined;
		if (foodId !== undefined) {
			foodIds.add(foodId);
		}
	}
	return foodIds;
}

export default memo<IProps>(function MerchantStockDetail({
	merchant,
	onPopoverOpenChange,
	visibility,
}) {
	const { t } = useI18n(mapsMessages);
	useCatalogLocalizationRevision();

	const stock = MERCHANT_STOCK_FACTS[merchant];
	const groups = useMemo(() => {
		if (stock === undefined) {
			return [];
		}

		const goods = new Map<string, TMapCatalogItemWithMetadata>();
		const recipes = new Map<string, TMapCatalogItemWithMetadata>();
		const addItem = (
			items: Map<string, TMapCatalogItemWithMetadata>,
			item: TMapCatalogItemWithMetadata
		) => {
			const key = `${item.target}:${item.id}`;
			if (!items.has(key)) {
				items.set(key, item);
			}
		};

		for (const entry of stock.stock) {
			const metadata = (
				<>
					{entry.saleProbability}% · {formatRange(entry.amount)}
				</>
			);

			if (
				entry.productType === 1 &&
				checkIngredientId(entry.productId) &&
				visibility.isProductVisible({
					productId: entry.productId,
					productType: 1,
				})
			) {
				addItem(goods, {
					id: entry.productId,
					metadata,
					target: 'ingredient',
				});
			} else if (
				entry.productType === 2 &&
				checkBeverageId(entry.productId) &&
				visibility.isProductVisible({
					productId: entry.productId,
					productType: 2,
				})
			) {
				addItem(goods, {
					id: entry.productId,
					metadata,
					target: 'beverage',
				});
			} else {
				const foodId =
					entry.productType === 0
						? foodIdByProductId.get(entry.productId)
						: entry.productType === 6
							? foodByRecipeId.get(entry.productId)
							: undefined;
				if (foodId !== undefined && visibility.isFoodVisible(foodId)) {
					addItem(recipes, { id: foodId, metadata, target: 'food' });
				}
			}
		}

		return [
			{ items: [...goods.values()], label: t('maps.detail.goods') },
			{ items: [...recipes.values()], label: t('maps.detail.recipes') },
		].filter(({ items }) => items.length > 0);
	}, [stock, t, visibility]);

	if (stock === undefined || groups.length === 0) {
		return null;
	}

	return (
		<>
			{groups.map(({ items, label }) => (
				<div key={label} className="space-y-1">
					<div className="flex items-baseline justify-between gap-2 px-1.5">
						<p className="font-semibold">{label}</p>
						<p className="text-right text-tiny text-default-700">
							{t('maps.detail.stockProbability')} /{' '}
							{t('maps.detail.stockAmount')}
						</p>
					</div>
					<MapCatalogItems
						items={items}
						layout="rows"
						onPopoverOpenChange={onPopoverOpenChange}
					/>
				</div>
			))}
		</>
	);
});
