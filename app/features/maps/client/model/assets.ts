import { DAY_MAP_CHARACTER_SPRITE_HASH } from '@/domain/data/maps/dayMapCharacters';
import { DAY_MAP_LAYOUTS } from '@/domain/data/maps/dayMapLayouts';
import type { TDayMapLabel } from '@/domain/data/maps/types';
import { WORLD_MAP_FACTS } from '@/domain/data/maps/worldMapFacts';

import { checkCompatibility } from '@/infrastructure/browser/compatibility/checkCompatibility';
import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

/**
 * @description Every map asset sits under a content-hash directory, so its URL
 * changes whenever its content does; the service worker caches them for good.
 */
const MAP_ASSET_BASE_URL = `${PUBLIC_RUNTIME_CONFIG.cdnUrl}/assets/maps`;

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

export function getCharacterSpriteUrl(file: string) {
	return `${MAP_ASSET_BASE_URL}/characters/${DAY_MAP_CHARACTER_SPRITE_HASH}/${file}`;
}

export function getWorldMapImageUrl() {
	const { hash, image } = WORLD_MAP_FACTS;
	return `${MAP_ASSET_BASE_URL}/world/${hash}/${image}.${getArtExtension()}`;
}
