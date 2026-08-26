import { RecordCatalog } from '@/domain/catalog/shared/RecordCatalog';
import { FISHING_COLLECTIBLE_LIST } from '@/domain/data/fishingCollectibles/records';
import type { TFishingCollectibles } from '@/domain/data/fishingCollectibles/types';

export class FishingCollectibleCatalog extends RecordCatalog<TFishingCollectibles> {
	private static _instance: FishingCollectibleCatalog | undefined;

	public static getInstance() {
		if (FishingCollectibleCatalog._instance !== undefined) {
			return FishingCollectibleCatalog._instance;
		}

		const instance = new FishingCollectibleCatalog(
			FISHING_COLLECTIBLE_LIST,
			'fishingCollectible'
		);
		FishingCollectibleCatalog._instance = instance;

		return instance;
	}
}
