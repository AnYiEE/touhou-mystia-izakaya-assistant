import { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';

import { createCollectibleStore } from '@/features/catalog/items/collectibles/client/state/createCollectibleStore';

export const badgesConfig = createCollectibleStore({
	getSources: () => [],
	instance: BadgeCatalog.getInstance(),
	storageName: 'page-badges-storage',
});

export const badgesStore = badgesConfig.store;
