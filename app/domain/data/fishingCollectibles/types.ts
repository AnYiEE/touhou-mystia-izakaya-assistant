export type TFishingCollectibles =
	typeof import('./records').FISHING_COLLECTIBLE_RECORDS;
export type TFishingCollectibleId = TFishingCollectibles[number]['id'];
export type TFishingCollectibleName = TFishingCollectibles[number]['name'];
