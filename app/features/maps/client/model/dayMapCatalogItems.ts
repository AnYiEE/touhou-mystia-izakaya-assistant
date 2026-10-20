import { ClothesCatalog } from '@/domain/catalog/items/ClothesCatalog';
import { DecorationCatalog } from '@/domain/catalog/items/DecorationCatalog';
import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import type { TClothesId } from '@/domain/data/clothes/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TDecorationId } from '@/domain/data/decorations/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { TGeneralItemId } from '@/domain/data/generalItems/types';
import { type TCollaborationLabel } from '@/domain/data/labels/collaborationFacts';
import type { TDayMapInteractionKind } from '@/domain/data/maps/types';
import type { TDlc } from '@/domain/data/shared/types';

import { memoize } from '@/shared/utilities/cache/memoize';

export type TMapCatalogItem =
	| { id: TClothesId; target: 'clothes' }
	| { id: TCookerId; target: 'cooker' }
	| { id: TDecorationId; target: 'decoration' }
	| { id: TFoodId; target: 'food' }
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

function hasCollaborationUnlock(
	source: object
): source is {
	collaborationUnlock: { collaborationLabel: TCollaborationLabel };
} {
	return 'collaborationUnlock' in source;
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
		for (const { dlc, from, id } of ClothesCatalog.getInstance()
			.canonicalData) {
			for (const source of from) {
				if (hasCollaborationUnlock(source)) {
					addReward(source.collaborationUnlock.collaborationLabel, {
						dlc,
						id,
						target: 'clothes',
					});
				}
			}
		}
		for (const { dlc, from, id } of GeneralItemCatalog.getInstance()
			.canonicalData) {
			for (const source of from) {
				if (hasCollaborationUnlock(source)) {
					addReward(source.collaborationUnlock.collaborationLabel, {
						dlc,
						id,
						target: 'item',
					});
				}
			}
		}
		for (const { dlc, from, id } of DecorationCatalog.getInstance()
			.canonicalData) {
			if ('collaboration' in from) {
				addReward(from.collaboration.collaborationLabel, {
					dlc,
					id,
					target: 'decoration',
				});
			}
		}
		return [...groups].map(([label, items]) => ({ items, label }));
	}
);
