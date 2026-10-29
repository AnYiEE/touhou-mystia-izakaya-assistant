import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { IClothes } from '@/domain/data/clothes/schema';
import type { TClothesId } from '@/domain/data/clothes/types';
import type { ICooker } from '@/domain/data/cookers/schema';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { ICurrencyItem } from '@/domain/data/currencyItems/schema';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import { getDecorationSources } from '@/domain/data/decorations/sources';
import type { TDecorationId } from '@/domain/data/decorations/types';
import type { IFood } from '@/domain/data/foods/schema';
import type { TFoodId } from '@/domain/data/foods/types';
import type { IGeneralItem } from '@/domain/data/generalItems/schema';
import type { TGeneralItemId } from '@/domain/data/generalItems/types';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { type TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TDayMapInteractionKind } from '@/domain/data/maps/types';
import { getSourceEntries } from '@/domain/data/shared/sourceEntries';
import type { TDlc } from '@/domain/data/shared/types';

import { memoize } from '@/shared/utilities/cache/memoize';

export type TMapCatalogItem =
	| { id: TBeverageId; target: 'beverage' }
	| { id: TClothesId; target: 'clothes' }
	| { id: TCookerId; target: 'cooker' }
	| { id: TCurrencyItemId; target: 'currency_item' }
	| { id: TDecorationId; target: 'decoration' }
	| { id: TFoodId; target: 'food' }
	| { id: TIngredientId; target: 'ingredient' }
	| { id: TGeneralItemId; target: 'item' };

export type TDayMapCatalogPath =
	'/beverages' | '/clothes' | '/decorations' | '/foods' | '/ingredients';

const INTERACTION_CATALOG_ITEMS: Partial<
	Record<TDayMapInteractionKind, TMapCatalogItem>
> = {
	'comic-book': { id: 53, target: 'item' },
	'creator-box': { id: 5014, target: 'decoration' },
	'jizo-doll': { id: 1003, target: 'decoration' },
	'slot-machine': { id: 3000, target: 'decoration' },
	telephone: { id: 1004, target: 'decoration' },
	'ten-thousand-sales': { id: 0, target: 'item' },
};

const INTERACTION_CATALOG_PATHS: Partial<
	Record<TDayMapInteractionKind, TDayMapCatalogPath>
> = {
	'beverage-storage': '/beverages',
	closet: '/clothes',
	'cooking-table': '/foods',
	'food-storage': '/ingredients',
	showcase: '/decorations',
};

export function getInteractionCatalogItem(kind: TDayMapInteractionKind) {
	return INTERACTION_CATALOG_ITEMS[kind] ?? null;
}

export function getInteractionCatalogPath(kind: TDayMapInteractionKind) {
	return INTERACTION_CATALOG_PATHS[kind] ?? null;
}

type TCollaborationReward = TMapCatalogItem & { dlc: TDlc };

export interface ICollaborationRewardGroup {
	label: TCollaborationLabel;
	items: ReadonlyArray<TCollaborationReward>;
}

function hasCollaborationTerminal(
	source: object
): source is { collaboration: { collaborationLabel: TCollaborationLabel } } {
	return (
		'collaboration' in source &&
		typeof source.collaboration === 'object' &&
		source.collaboration !== null &&
		!Array.isArray(source.collaboration) &&
		!('merchants' in source.collaboration)
	);
}

function hasCollaborationArray(
	source: object
): source is {
	collaboration: Array<{ collaborationLabel: TCollaborationLabel }>;
} {
	return 'collaboration' in source && Array.isArray(source.collaboration);
}

/** @description Cache canonical IDs only; display names and preferences remain live. */
export const getCollaborationRewardGroups = /* @__PURE__ */ memoize(
	function getCollaborationRewardGroups(): ReadonlyArray<ICollaborationRewardGroup> {
		const groups = new Map<TCollaborationLabel, TCollaborationReward[]>();
		function addReward(
			label: TCollaborationLabel,
			item: TCollaborationReward
		) {
			const items = groups.get(label);
			if (items === undefined) {
				groups.set(label, [item]);
			} else {
				items.push(item);
			}
		}
		for (const { dlc, from, id } of BeverageCatalog.getInstance()
			.canonicalData) {
			if (hasCollaborationArray(from)) {
				for (const source of from.collaboration) {
					addReward(source.collaborationLabel, {
						dlc,
						id,
						target: 'beverage',
					});
				}
			}
		}
		for (const { dlc, from, id } of ClothesCatalog.getInstance()
			.canonicalData) {
			for (const source of getSourceEntries<IClothes['from']>(from)) {
				if (hasCollaborationTerminal(source)) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'clothes',
					});
				}
			}
		}
		for (const { dlc, from, id } of CookerCatalog.getInstance()
			.canonicalData) {
			for (const source of getSourceEntries<ICooker['from']>(from)) {
				if (hasCollaborationTerminal(source)) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'cooker',
					});
				}
			}
		}
		for (const { dlc, from, id } of CurrencyItemCatalog.getInstance()
			.canonicalData) {
			for (const source of getSourceEntries<ICurrencyItem['from']>(
				from
			)) {
				if (hasCollaborationTerminal(source)) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'currency_item',
					});
				}
			}
		}
		for (const { dlc, from, id } of FoodCatalog.getInstance()
			.canonicalData) {
			for (const source of getSourceEntries<IFood['from']>(from)) {
				if (hasCollaborationTerminal(source)) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'food',
					});
				}
			}
		}
		for (const { dlc, from, id } of GeneralItemCatalog.getInstance()
			.canonicalData) {
			for (const source of getSourceEntries<IGeneralItem['from']>(from)) {
				if (hasCollaborationTerminal(source)) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'item',
					});
				}
			}
		}
		for (const { dlc, from, id } of IngredientCatalog.getInstance()
			.canonicalData) {
			if (hasCollaborationArray(from)) {
				for (const source of from.collaboration) {
					addReward(source.collaborationLabel, {
						dlc,
						id,
						target: 'ingredient',
					});
				}
			}
		}
		for (const { dlc, from, id } of DecorationCatalog.getInstance()
			.canonicalData) {
			for (const source of getDecorationSources(from)) {
				if ('collaboration' in source) {
					addReward(source.collaboration.collaborationLabel, {
						dlc,
						id,
						target: 'decoration',
					});
				}
			}
		}
		return [...groups].map(([label, items]) => ({ items, label }));
	}
);
