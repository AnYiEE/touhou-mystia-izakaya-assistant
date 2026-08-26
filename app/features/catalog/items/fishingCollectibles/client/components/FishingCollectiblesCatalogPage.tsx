'use client';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { fishingCollectiblesConfig } from '@/features/catalog/items/fishingCollectibles/client/state/store';

import FishingCollectiblesCatalog from './FishingCollectiblesCatalog';

export default function FishingCollectiblesCatalogPage() {
	return (
		<CollectibleCatalogPage
			config={fishingCollectiblesConfig}
			sourceFilterLabel="垂钓地区"
			renderCatalog={(data) => <FishingCollectiblesCatalog data={data} />}
		/>
	);
}
