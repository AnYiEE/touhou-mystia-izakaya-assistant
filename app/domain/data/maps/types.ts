import type { TSpecialGuestId } from '@/domain/data/guests/special/types';
import type { TCollectableLabel } from '@/domain/data/places/collectableLabels';
import type { TMerchantLabel } from '@/domain/data/places/merchantFacts';
import type { TMapLabel, TPlaceLabel } from '@/domain/data/places/types';

import type { TLocale } from '@/shared/i18n/locale';

/** @description Day-scene places outside the fifteen regions (interiors and event scenes). */
export type TExtraDayMapLabel =
	| 'Basement'
	| 'DLC3_HakureiFestival'
	| 'DLC4_ScarletMansionBasement'
	| 'Hakugyokurou'
	| 'Home'
	| 'PartyStage';

export type TDayMapLabel = TExtraDayMapLabel | TMapLabel;

export interface IDayMapExtraFact {
	dlc: 0 | 3 | 4;
	/** @description `event` scenes only exist during story or concert events. */
	kind: 'event' | 'interior' | 'place';
	names: Readonly<Partial<Record<TLocale, string>>> &
		Readonly<Record<'zh-CN', string>>;
	/** @description Region whose world-map spot also covers this place. */
	parent: TMapLabel | null;
}

/** @description World-space coordinates (Unity units, y up). */
export type TDayMapPoint = readonly [x: number, y: number];

/** @description World-space rectangle as `[minX, minY, maxX, maxY]`. */
export type TDayMapRect = readonly [
	minX: number,
	minY: number,
	maxX: number,
	maxY: number,
];

/** @description In-game hour range `[from, to)`, e.g. `[10, 14]`. */
export type TDayMapHourRange = readonly [from: number, to: number];

export interface IDayMapArtLevel {
	columns: number;
	height: number;
	rows: number;
	/** @description `[column, row]` pairs of non-empty tiles. */
	tiles: ReadonlyArray<readonly [column: number, row: number]>;
	width: number;
}

export interface IDayMapArt {
	bounds: TDayMapRect;
	height: number;
	/** @description Level 0 is the sharpest; each next level halves the size. */
	levels: ReadonlyArray<IDayMapArtLevel>;
	pixelsPerUnit: number;
	tileSize: number;
	width: number;
}

export interface IDayMapCollectable {
	isOffByDefault: boolean;
	key: TCollectableLabel;
	position: TDayMapPoint;
	regenerateHours: number;
	showTime: TDayMapHourRange;
}

export interface IDayMapTransition {
	/** @description Trigger area of the exit, when the game defines one. */
	area: TDayMapRect | null;
	/** @description Player position after arriving at the target map. */
	arrival: TDayMapPoint | null;
	costsAction: boolean;
	position: TDayMapPoint;
	target: TPlaceLabel | (string & {});
	/** @description Simplified Chinese game name of the target, for places without a map. */
	targetName: string;
}

export interface IDayMapTeleport {
	position: TDayMapPoint;
}

export interface IDayMapFishingArea {
	area: TDayMapRect;
}

export interface IDayMapLayout {
	art: IDayMapArt;
	collectables: ReadonlyArray<IDayMapCollectable>;
	fishingAreas: ReadonlyArray<IDayMapFishingArea>;
	teleports: ReadonlyArray<IDayMapTeleport>;
	transitions: ReadonlyArray<IDayMapTransition>;
}

export type TDayMapCharacterKind = 'merchant' | 'resident' | 'specialGuest';

export interface IDayMapCharacterSprite {
	file: string;
	height: number;
	/** @description Feet position inside the image, in image pixels. */
	pivot: TDayMapPoint;
	pixelsPerUnit: number;
	width: number;
}

export interface IDayMapCharacterDestination {
	map: TDayMapLabel;
	position: TDayMapPoint;
}

export interface IDayMapCharacter {
	/** @description One entry means a fixed spot; several mean one is picked at random each day. */
	destinations: ReadonlyArray<IDayMapCharacterDestination>;
	id: string;
	isOffByDefault: boolean;
	kind: TDayMapCharacterKind;
	merchant: TMerchantLabel | null;
	name: string;
	showTime: TDayMapHourRange;
	specialGuest: TSpecialGuestId | null;
	sprite: IDayMapCharacterSprite | null;
}

export interface IWorldMapSpot {
	place: TPlaceLabel;
	position: readonly [x: number, y: number];
}

export interface IWorldMapFacts {
	connections: ReadonlyArray<readonly [TPlaceLabel, TPlaceLabel]>;
	height: number;
	image: string;
	spots: ReadonlyArray<IWorldMapSpot>;
	width: number;
}
