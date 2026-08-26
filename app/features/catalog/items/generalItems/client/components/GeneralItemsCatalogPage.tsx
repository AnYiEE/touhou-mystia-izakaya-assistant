'use client';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { generalItemsConfig } from '@/features/catalog/items/generalItems/client/state/store';

import GeneralItemsCatalog from './GeneralItemsCatalog';

export default function GeneralItemsCatalogPage() {
	return (
		<CollectibleCatalogPage
			config={generalItemsConfig}
			renderCatalog={(data) => <GeneralItemsCatalog data={data} />}
		/>
	);
}
