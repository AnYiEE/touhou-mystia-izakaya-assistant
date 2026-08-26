import { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

import { createCollectibleStore } from '@/features/catalog/items/collectibles/client/state/createCollectibleStore';

export const fishingCollectiblesConfig = createCollectibleStore({
	getSources: (item) => [MAP_FACTS[item.map].label],
	instance: FishingCollectibleCatalog.getInstance(),
	storageName: 'page-fishing-collectibles-storage',
});

export const fishingCollectiblesStore = fishingCollectiblesConfig.store;
