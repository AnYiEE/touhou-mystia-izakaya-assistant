'use client';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { recordsConfig } from '@/features/catalog/items/records/client/state/store';

import RecordsCatalog from './RecordsCatalog';

export default function RecordsCatalogPage() {
	return (
		<CollectibleCatalogPage
			config={recordsConfig}
			sourceFilterLabel="来源"
			renderCatalog={(data) => <RecordsCatalog data={data} />}
		/>
	);
}
