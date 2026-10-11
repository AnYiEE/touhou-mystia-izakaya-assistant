'use client';

import { badgesConfig } from '@/features/catalog/items/badges/client/state/store';
import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';

import BadgesCatalog from './BadgesCatalog';

export default function BadgesCatalogPage() {
	return (
		<CollectibleCatalogPage
			config={badgesConfig}
			renderCatalog={(data) => <BadgesCatalog data={data} />}
		/>
	);
}
