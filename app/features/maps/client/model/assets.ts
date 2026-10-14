import type { TDayMapLabel } from '@/domain/data/maps/types';

import { PUBLIC_RUNTIME_CONFIG } from '@/infrastructure/environment/publicRuntimeConfig';

const MAP_ASSET_BASE_URL = `${PUBLIC_RUNTIME_CONFIG.cdnUrl}/assets/maps`;

export function getDayMapAssetUrl(map: TDayMapLabel, path: string) {
	return `${MAP_ASSET_BASE_URL}/day/${map}/${path}`;
}

export function getCharacterSpriteUrl(file: string) {
	return `${MAP_ASSET_BASE_URL}/characters/${file}`;
}

export function getWorldMapImageUrl(file: string) {
	return `${MAP_ASSET_BASE_URL}/${file}`;
}
