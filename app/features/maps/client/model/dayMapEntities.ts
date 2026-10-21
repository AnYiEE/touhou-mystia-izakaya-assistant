import { BeverageCatalog } from '@/domain/catalog/food/BeverageCatalog';
import { FoodCatalog } from '@/domain/catalog/food/FoodCatalog';
import { IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { IBeverage } from '@/domain/data/beverages/schema';
import type { TBeverageId } from '@/domain/data/beverages/types';
import type { TCookerId } from '@/domain/data/cookers/types';
import type { TFoodId } from '@/domain/data/foods/types';
import type { IIngredient } from '@/domain/data/ingredients/schema';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DAY_MAP_CHARACTERS } from '@/domain/data/maps/dayMapCharacters';
import {
	DAY_MAP_COLLABORATION_TERMINAL,
	type IDayMapFacility,
} from '@/domain/data/maps/dayMapFacilityFacts';
import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import type {
	IDayMapArt,
	IDayMapCharacter,
	IDayMapCollectable,
	IDayMapInteraction,
	IDayMapPrayer,
	IDayMapTaskInteraction,
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
import type { TMerchantReference } from '@/domain/data/places/types';

import {
	getCharacterEntityId,
	getCollectableEntityId,
	getFacilityEntityId,
	getFishingEntityId,
	getInteractionEntityId,
	getPrayerEntityId,
	getTaskEntityId,
} from '@/features/maps/links';

import { memoize } from '@/shared/utilities/cache/memoize';

export type TDayMapLayer =
	| 'collectable'
	| 'facility'
	| 'fishing'
	| 'interaction'
	| 'merchant'
	| 'partner'
	| 'prayer'
	| 'resident'
	| 'specialGuest'
	| 'task'
	| 'teleport'
	| 'transition';

/** @description Display and list order of the layers. */
export const DAY_MAP_LAYERS = [
	'specialGuest',
	'partner',
	'merchant',
	'collectable',
	'prayer',
	'facility',
	'interaction',
	'transition',
	'teleport',
	'fishing',
	'task',
	'resident',
] as const satisfies ReadonlyArray<TDayMapLayer>;

export const DEFAULT_HIDDEN_DAY_MAP_LAYERS: ReadonlySet<TDayMapLayer> = new Set(
	['resident', 'task']
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
	index: number;
	layer: 'teleport';
}

export interface IDayMapFacilityEntity extends IDayMapEntityBase {
	facility: IDayMapFacility;
	layer: 'facility';
}

export interface IDayMapFishingEntity extends IDayMapEntityBase {
	area: TDayMapRect;
	index: number;
	layer: 'fishing';
}

export interface IDayMapPrayerEntity extends IDayMapEntityBase {
	layer: 'prayer';
	prayer: IDayMapPrayer;
}

export interface IDayMapInteractionEntity extends IDayMapEntityBase {
	interaction: IDayMapInteraction;
	layer: 'interaction';
}

export interface IDayMapTaskEntity extends IDayMapEntityBase {
	layer: 'task';
	task: IDayMapTaskInteraction;
}

export type TDayMapEntity =
	| IDayMapCharacterEntity
	| IDayMapCollectableEntity
	| IDayMapFacilityEntity
	| IDayMapFishingEntity
	| IDayMapInteractionEntity
	| IDayMapPrayerEntity
	| IDayMapTaskEntity
	| IDayMapTeleportEntity
	| IDayMapTransitionEntity;

const COLLECTABLE_DISPLAY_LABEL_MAP = new Map<TCollectableLabel, string>();
for (const fact of COLLECTION_POINT_REFRESH_FACTS) {
	if ('label' in fact) {
		if (!COLLECTABLE_DISPLAY_LABEL_MAP.has(fact.label)) {
			COLLECTABLE_DISPLAY_LABEL_MAP.set(fact.label, fact.displayLabel);
		}
	} else if ('labels' in fact) {
		for (const label of fact.labels) {
			if (!COLLECTABLE_DISPLAY_LABEL_MAP.has(label)) {
				COLLECTABLE_DISPLAY_LABEL_MAP.set(label, fact.displayLabel);
			}
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

/** @description Static map data is shared across selection changes and return visits. */
export const buildDayMapEntities = /* @__PURE__ */ memoize(
	function buildDayMapEntities(
		map: TDayMapLabel
	): ReadonlyArray<TDayMapEntity> {
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

		for (const prayer of layout.prayers ?? []) {
			entities.push({
				id: getPrayerEntityId(prayer.label),
				layer: 'prayer',
				position: prayer.position,
				prayer,
			});
		}

		for (const interaction of layout.interactions ?? []) {
			entities.push({
				id: getInteractionEntityId(interaction.kind),
				interaction,
				layer: 'interaction',
				position: interaction.position,
			});
		}

		for (const task of layout.tasks ?? []) {
			entities.push({
				id: getTaskEntityId(task.key),
				layer: 'task',
				position: task.position,
				task,
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
			entities.push({
				id: `teleport:${index}`,
				index,
				layer: 'teleport',
				position,
			});
		});

		layout.fishingAreas.forEach(({ area }, index) => {
			entities.push({
				area,
				id: getFishingEntityId(index),
				index,
				layer: 'fishing',
				position: [(area[0] + area[2]) / 2, (area[1] + area[3]) / 2],
			});
		});

		const facility = DAY_MAP_COLLABORATION_TERMINAL;
		if (facility.map === map) {
			entities.push({
				facility,
				id: getFacilityEntityId(facility.key),
				layer: 'facility',
				position: facility.position,
			});
		}

		return entities;
	}
);

/** @description Resolve a canonical entity ID to the map entity selected by the route. */
export function findDayMapEntity(map: TDayMapLabel, entityId: string) {
	return (
		buildDayMapEntities(map).find((entity) => entity.id === entityId) ??
		null
	);
}

export function findDayMapMerchantEntityId(
	map: TDayMapLabel,
	merchant: string
) {
	return (
		buildDayMapEntities(map).find(
			(entity) =>
				'character' in entity && entity.character.merchant === merchant
		)?.id ?? null
	);
}

export interface IMerchantGoods {
	beverages: ReadonlyArray<TBeverageId>;
	cookers: ReadonlyArray<TCookerId>;
	foods: ReadonlyArray<TFoodId>;
	ingredients: ReadonlyArray<TIngredientId>;
}

function checkMerchantReference(
	reference: TMerchantReference,
	merchant: NonNullable<IDayMapCharacter['merchant']>
) {
	return typeof merchant === 'number'
		? reference.specialGuest === merchant
		: reference.label === merchant;
}

function checkSoldBy(
	{ buy }: IBeverage['from'] | IIngredient['from'],
	merchant: NonNullable<IDayMapCharacter['merchant']>
) {
	return (
		buy?.some((reference) =>
			checkMerchantReference(
				Array.isArray(reference) ? reference[0] : reference,
				merchant
			)
		) ?? false
	);
}

const merchantGoodsCache = new Map<
	NonNullable<IDayMapCharacter['merchant']>,
	IMerchantGoods
>();

/** @description Stable IDs of goods whose purchase sources include the merchant. */
export function getMerchantGoods(
	merchant: NonNullable<IDayMapCharacter['merchant']>
): IMerchantGoods {
	const cached = merchantGoodsCache.get(merchant);
	if (cached !== undefined) {
		return cached;
	}

	const goods: IMerchantGoods = {
		beverages: BeverageCatalog.getInstance()
			.canonicalData.filter(({ from }) => checkSoldBy(from, merchant))
			.map(({ id }) => id),
		cookers: CookerCatalog.getInstance()
			.canonicalData.filter(({ from }) =>
				from.some(
					(source) =>
						'buy' in source &&
						checkMerchantReference(source.buy.merchant, merchant)
				)
			)
			.map(({ id }) => id),
		foods: FoodCatalog.getInstance()
			.canonicalData.filter(({ from }) =>
				'buy' in from
					? checkMerchantReference(from.buy.merchant, merchant)
					: 'collaboration' in from &&
						from.collaboration.merchants.some(
							({ merchant: reference }) =>
								checkMerchantReference(reference, merchant)
						)
			)
			.map(({ id }) => id),
		ingredients: IngredientCatalog.getInstance()
			.canonicalData.filter(({ from }) => checkSoldBy(from, merchant))
			.map(({ id }) => id),
	};
	merchantGoodsCache.set(merchant, goods);

	return goods;
}

const INGREDIENT_ID_SET: ReadonlySet<number> = new Set(
	IngredientCatalog.getInstance().canonicalData.map(({ id }) => id)
);
const BEVERAGE_ID_SET: ReadonlySet<number> = new Set(
	BeverageCatalog.getInstance().canonicalData.map(({ id }) => id)
);

export function checkIngredientId(id: number): id is TIngredientId {
	return INGREDIENT_ID_SET.has(id);
}

export function checkBeverageId(id: number): id is TBeverageId {
	return BEVERAGE_ID_SET.has(id);
}
