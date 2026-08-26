import { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import { MERCHANT_LABEL_MAP } from '@/domain/data/places/merchantFacts';

import { createCollectibleStore } from '@/features/catalog/items/collectibles/client/state/createCollectibleStore';

export const recordsConfig = createCollectibleStore({
	getSources: (item) => [MERCHANT_LABEL_MAP[item.buy.merchant]],
	instance: RecordItemCatalog.getInstance(),
	storageName: 'page-records-storage',
});

export const recordsStore = recordsConfig.store;
