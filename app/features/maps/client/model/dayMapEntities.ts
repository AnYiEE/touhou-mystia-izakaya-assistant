import { BEVERAGE_LIST } from '@/domain/data/beverages/records';
import type { IBeverage } from '@/domain/data/beverages/schema';
import { INGREDIENT_LIST } from '@/domain/data/ingredients/records';
import type { IIngredient } from '@/domain/data/ingredients/schema';
import { DAY_MAP_CHARACTERS } from '@/domain/data/maps/dayMapCharacters';
import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import type {
	IDayMapArt,
	IDayMapCharacter,
	IDayMapCollectable,
	IDayMapTransition,
	TDayMapHourRange,
	TDayMapLabel,
	TDayMapPoint,
	TDayMapRect,
} from '@/domain/data/maps/types';
import { type TCollectableLabel } from '@/domain/data/places/collectableLabels';
import { COLLECTION_POINT_REFRESH_FACTS } from '@/domain/data/places/collectionFacts';
import {
	COLLECTION_POINT_YIELD_FACTS,
	type ICollectionPointYieldProduct,
} from '@/domain/data/places/collectionYieldFacts';

import {
	getCharacterEntityId,
	getCollectableEntityId,
	getFishingEntityId,
} from '@/features/maps/links';

export type TDayMapLayer =
	| 'collectable'
	| 'fishing'
	| 'merchant'
	| 'partner'
	| 'resident'
	| 'specialGuest'
	| 'teleport'
	| 'transition';

/** @description Display and list order of the layers. */
export const DAY_MAP_LAYERS = [
	'specialGuest',
	'partner',
	'merchant',
	'collectable',
	'transition',
	'teleport',
	'fishing',
	'resident',
] as const satisfies ReadonlyArray<TDayMapLayer>;

export const DEFAULT_HIDDEN_DAY_MAP_LAYERS: ReadonlySet<TDayMapLayer> = new Set(
	['resident']
);

interface IDayMapEntityBase {
	id: string;
	position: TDayMapPoint;
}

export interface IDayMapCollectableEntity extends IDayMapEntityBase {
	collectable: IDayMapCollectable;
	displayLabel: string;
	layer: 'collectable';
	products: ReadonlyArray<ICollectionPointYieldProduct>;
}

export interface IDayMapCharacterEntity extends IDayMapEntityBase {
	character: IDayMapCharacter;
	layer: 'merchant' | 'partner' | 'resident' | 'specialGuest';
	/** @description Spots of this character on the current map. */
	spots: ReadonlyArray<TDayMapPoint>;
}

export interface IDayMapTransitionEntity extends IDayMapEntityBase {
	layer: 'transition';
	transition: IDayMapTransition;
}

export interface IDayMapTeleportEntity extends IDayMapEntityBase {
	layer: 'teleport';
}

export interface IDayMapFishingEntity extends IDayMapEntityBase {
	area: TDayMapRect;
	layer: 'fishing';
}

export type TDayMapEntity =
	| IDayMapCharacterEntity
	| IDayMapCollectableEntity
	| IDayMapFishingEntity
	| IDayMapTeleportEntity
	| IDayMapTransitionEntity;

const COLLECTABLE_DISPLAY_LABEL_MAP = new Map<TCollectableLabel, string>();
for (const fact of COLLECTION_POINT_REFRESH_FACTS) {
	if ('label' in fact) {
		COLLECTABLE_DISPLAY_LABEL_MAP.set(fact.label, fact.displayLabel);
	} else if ('labels' in fact) {
		for (const label of fact.labels) {
			COLLECTABLE_DISPLAY_LABEL_MAP.set(label, fact.displayLabel);
		}
	}
}

const COLLECTABLE_PRODUCTS_MAP = new Map<
	TCollectableLabel,
	ReadonlyArray<ICollectionPointYieldProduct>
>(COLLECTION_POINT_YIELD_FACTS.map(({ label, products }) => [label, products]));

export function toContentPoint(
	art: IDayMapArt,
	[x, y]: TDayMapPoint
): readonly [number, number] {
	return [
		(x - art.bounds[0]) * art.pixelsPerUnit,
		(art.bounds[3] - y) * art.pixelsPerUnit,
	];
}

export function toContentRect(art: IDayMapArt, area: TDayMapRect) {
	const [left, top] = toContentPoint(art, [area[0], area[3]]);
	const [right, bottom] = toContentPoint(art, [area[2], area[1]]);

	return { height: bottom - top, left, top, width: right - left };
}

/** @description The product shown on the marker: the primary yield, else the first one. */
export function getPrimaryProduct({ products }: IDayMapCollectableEntity) {
	return products.find(({ kind }) => kind === 'primary') ?? products[0];
}

/** @description Showtime outside the default 10:00–18:00 window, which is the whole day. */
export function checkTimeLimited([from, to]: TDayMapHourRange) {
	return from !== 10 || to !== 18;
}

export function buildDayMapEntities(map: TDayMapLabel): TDayMapEntity[] {
	const layout = DAY_MAP_LAYOUTS[map];
	const entities: TDayMapEntity[] = [];

	for (const character of DAY_MAP_CHARACTERS) {
		const spots = character.destinations
			.filter((destination) => destination.map === map)
			.map(({ position }) => position);
		const [firstSpot] = spots;
		if (firstSpot === undefined) {
			continue;
		}
		entities.push({
			character,
			id: getCharacterEntityId(character.id),
			layer: character.kind,
			position: firstSpot,
			spots,
		});
	}

	for (const collectable of layout.collectables) {
		entities.push({
			collectable,
			displayLabel:
				COLLECTABLE_DISPLAY_LABEL_MAP.get(collectable.key) ??
				collectable.key,
			id: getCollectableEntityId(collectable.key),
			layer: 'collectable',
			position: collectable.position,
			products: COLLECTABLE_PRODUCTS_MAP.get(collectable.key) ?? [],
		});
	}

	layout.transitions.forEach((transition, index) => {
		entities.push({
			id: `transition:${transition.target}:${index}`,
			layer: 'transition',
			position: transition.position,
			transition,
		});
	});

	layout.teleports.forEach(({ position }, index) => {
		entities.push({ id: `teleport:${index}`, layer: 'teleport', position });
	});

	layout.fishingAreas.forEach(({ area }, index) => {
		entities.push({
			area,
			id: getFishingEntityId(index),
			layer: 'fishing',
			position: [(area[0] + area[2]) / 2, (area[1] + area[3]) / 2],
		});
	});

	return entities;
}

export interface IMerchantGoods {
	beverages: ReadonlyArray<TBeverageId>;
	ingredients: ReadonlyArray<TIngredientId>;
}

function checkSoldBy(
	{ buy }: IBeverage['from'] | IIngredient['from'],
	merchant: NonNullable<IDayMapCharacter['merchant']>
) {
	return (
		buy?.some((reference) => {
			const target = Array.isArray(reference) ? reference[0] : reference;
			return typeof merchant === 'number'
				? 'specialGuest' in target && target.specialGuest === merchant
				: 'label' in target && target.label === merchant;
		}) ?? false
	);
}

const merchantGoodsCache = new Map<
	NonNullable<IDayMapCharacter['merchant']>,
	IMerchantGoods
>();

/** @description Ingredients and beverages whose purchase sources include the merchant. */
export function getMerchantGoods(
	merchant: NonNullable<IDayMapCharacter['merchant']>
): IMerchantGoods {
	const cached = merchantGoodsCache.get(merchant);
	if (cached !== undefined) {
		return cached;
	}

	const goods: IMerchantGoods = {
		beverages: BEVERAGE_LIST.filter(({ from }) =>
			checkSoldBy(from, merchant)
		).map(({ id }) => id),
		ingredients: INGREDIENT_LIST.filter(({ from }) =>
			checkSoldBy(from, merchant)
		).map(({ id }) => id),
	};
	merchantGoodsCache.set(merchant, goods);

	return goods;
}

type TIngredientId = (typeof INGREDIENT_LIST)[number]['id'];
type TBeverageId = (typeof BEVERAGE_LIST)[number]['id'];

const INGREDIENT_ID_SET: ReadonlySet<number> = new Set(
	INGREDIENT_LIST.map(({ id }) => id)
);
const BEVERAGE_ID_SET: ReadonlySet<number> = new Set(
	BEVERAGE_LIST.map(({ id }) => id)
);

export function checkIngredientId(id: number): id is TIngredientId {
	return INGREDIENT_ID_SET.has(id);
}

export function checkBeverageId(id: number): id is TBeverageId {
	return BEVERAGE_ID_SET.has(id);
}
