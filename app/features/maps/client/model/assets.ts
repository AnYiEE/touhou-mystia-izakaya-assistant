import { DAY_MAP_CHARACTER_SPRITE_HASHES } from '@/domain/data/maps/dayMapCharacters';
import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import {
	DAY_MAP_FACILITY_SPRITES,
	DAY_MAP_FISHING_SPRITES,
	DAY_MAP_INTERACTION_SPRITES,
	DAY_MAP_PRAYER_SPRITES,
	DAY_MAP_TASK_SPRITES,
	DAY_MAP_TELEPORT_SPRITES,
} from '@/domain/data/maps/dayMapOverlaySprites';
import type {
	IDayMapCharacterSprite,
	IDayMapOverlaySprite,
	TDayMapInteractionKind,
	TDayMapLabel,
} from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';
import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

/**
 * @description Every map asset sits under a content-hash directory, so its URL
 * changes whenever its content does; the service worker caches them for good.
 */
const MAP_ASSET_BASE_URL = `${PUBLIC_RUNTIME_CONFIG.cdnUrl}/assets/maps`;

const DAY_MAP_INTERACTION_SPRITES_BY_KIND: Readonly<
	Partial<
		Record<
			TDayMapInteractionKind,
			Readonly<Partial<Record<TDayMapLabel, IDayMapOverlaySprite>>>
		>
	>
> = DAY_MAP_INTERACTION_SPRITES;

const DAY_MAP_TASK_SPRITES_BY_MAP: Readonly<
	Partial<
		Record<TDayMapLabel, Readonly<Record<string, IDayMapOverlaySprite>>>
	>
> = DAY_MAP_TASK_SPRITES;

const DAY_MAP_FISHING_SPRITES_BY_MAP: Readonly<
	Partial<Record<TDayMapLabel, ReadonlyArray<IDayMapOverlaySprite>>>
> = DAY_MAP_FISHING_SPRITES;

const DAY_MAP_FACILITY_SPRITES_BY_MAP: Readonly<
	Partial<
		Record<TDayMapLabel, Readonly<Record<string, IDayMapOverlaySprite>>>
	>
> = DAY_MAP_FACILITY_SPRITES;

const DAY_MAP_PRAYER_SPRITES_BY_MAP: Readonly<
	Partial<
		Record<TDayMapLabel, Readonly<Record<string, IDayMapOverlaySprite>>>
	>
> = DAY_MAP_PRAYER_SPRITES;

const DAY_MAP_TELEPORT_SPRITES_BY_MAP: Readonly<
	Partial<Record<TDayMapLabel, ReadonlyArray<IDayMapOverlaySprite>>>
> = DAY_MAP_TELEPORT_SPRITES;

/** @description Map art is published as WebP with a PNG copy for browsers without WebP. */
function getArtExtension() {
	return checkCompatibility().webp ? 'webp' : 'png';
}

function getDayMapBaseUrl(map: TDayMapLabel) {
	return `${MAP_ASSET_BASE_URL}/day/${map}/${DAY_MAP_LAYOUTS[map].art.hash}`;
}

export function getDayMapTileUrl(
	map: TDayMapLabel,
	level: number,
	column: number,
	row: number
) {
	return `${getDayMapBaseUrl(map)}/${level}/${column}_${row}.${getArtExtension()}`;
}

export function getDayMapPreviewUrl(map: TDayMapLabel) {
	return `${getDayMapBaseUrl(map)}/preview.${getArtExtension()}`;
}

export function getCharacterSpriteUrl({
	file,
	source,
}: IDayMapCharacterSprite) {
	return `${MAP_ASSET_BASE_URL}/characters/${String(source)}/${DAY_MAP_CHARACTER_SPRITE_HASHES[source]}/${file}`;
}

export function getDayMapInteractionSpriteUrl(
	map: TDayMapLabel,
	kind: TDayMapInteractionKind
) {
	const sprite = DAY_MAP_INTERACTION_SPRITES_BY_KIND[kind]?.[map];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/interactions/${kind}-${map}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapTaskSpriteUrl(map: TDayMapLabel, key: string) {
	const sprite = DAY_MAP_TASK_SPRITES_BY_MAP[map]?.[key];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/tasks/${map}-${key}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapInteractionSprite(
	map: TDayMapLabel,
	kind: TDayMapInteractionKind
) {
	return DAY_MAP_INTERACTION_SPRITES_BY_KIND[kind]?.[map];
}

export function getDayMapTaskSprite(map: TDayMapLabel, key: string) {
	return DAY_MAP_TASK_SPRITES_BY_MAP[map]?.[key];
}

export function getDayMapFishingSpriteUrl(map: TDayMapLabel, index: number) {
	const sprite = DAY_MAP_FISHING_SPRITES_BY_MAP[map]?.[index];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/fishing/${map}-${index}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapTeleportSpriteUrl(map: TDayMapLabel, index: number) {
	const sprite = DAY_MAP_TELEPORT_SPRITES_BY_MAP[map]?.[index];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/teleports/${map}-${index}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapFishingSprite(map: TDayMapLabel, index: number) {
	return DAY_MAP_FISHING_SPRITES_BY_MAP[map]?.[index];
}

export function getDayMapFacilitySpriteUrl(map: TDayMapLabel, key: string) {
	const sprite = DAY_MAP_FACILITY_SPRITES_BY_MAP[map]?.[key];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/facilities/${map}-${key}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapFacilitySprite(map: TDayMapLabel, key: string) {
	return DAY_MAP_FACILITY_SPRITES_BY_MAP[map]?.[key];
}

export function getDayMapPrayerSpriteUrl(map: TDayMapLabel, label: string) {
	const sprite = DAY_MAP_PRAYER_SPRITES_BY_MAP[map]?.[label];
	if (sprite === undefined) {
		return null;
	}
	return `${MAP_ASSET_BASE_URL}/prayers/${map}-${label}/${sprite.hash}/${sprite.file}`;
}

export function getDayMapPrayerSprite(map: TDayMapLabel, label: string) {
	return DAY_MAP_PRAYER_SPRITES_BY_MAP[map]?.[label];
}

export function getDayMapTeleportSprite(map: TDayMapLabel, index: number) {
	return DAY_MAP_TELEPORT_SPRITES_BY_MAP[map]?.[index];
}

export function getWorldMapImageUrl() {
	const { hash, image } = WORLD_MAP_FACTS;
	return `${MAP_ASSET_BASE_URL}/world/${hash}/${image}.${getArtExtension()}`;
}
