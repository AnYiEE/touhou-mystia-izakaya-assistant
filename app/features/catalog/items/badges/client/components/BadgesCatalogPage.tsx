'use client';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { badgesConfig } from '@/features/catalog/items/badges/client/state/store';

import BadgesCatalog from './BadgesCatalog';

export default function BadgesCatalogPage() {
	return (
		<CollectibleCatalogPage
			config={badgesConfig}
			renderCatalog={(data) => <BadgesCatalog data={data} />}
		/>
	);
}
