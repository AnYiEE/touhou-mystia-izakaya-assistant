import { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';

import { createCollectibleStore } from '@/features/catalog/items/collectibles/client/state/createCollectibleStore';

export const generalItemsConfig = createCollectibleStore({
	getSources: () => [],
	instance: GeneralItemCatalog.getInstance(),
	storageName: 'page-items-storage',
});

export const generalItemsStore = generalItemsConfig.store;
