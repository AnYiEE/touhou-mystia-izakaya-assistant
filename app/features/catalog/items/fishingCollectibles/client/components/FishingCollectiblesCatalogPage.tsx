'use client';

import { compareMapDisplayCanonicalOrder } from '@/domain/places/mapOrdering';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { fishingCollectiblesConfig } from '@/features/catalog/items/fishingCollectibles/client/state/store';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import FishingCollectiblesCatalog from './FishingCollectiblesCatalog';

export default function FishingCollectiblesCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	return (
		<CollectibleCatalogPage
			compareSources={compareMapDisplayCanonicalOrder}
			config={fishingCollectiblesConfig}
			sourceFilterLabel={t('items.filter.fishingArea')}
			renderCatalog={(data) => <FishingCollectiblesCatalog data={data} />}
		/>
	);
}
