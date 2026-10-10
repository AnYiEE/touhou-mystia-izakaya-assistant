'use client';

import CollectibleCatalogPage from '@/features/catalog/items/collectibles/client/components/CollectibleCatalogPage';
import { recordsConfig } from '@/features/catalog/items/records/client/state/store';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import RecordsCatalog from './RecordsCatalog';

export default function RecordsCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	return (
		<CollectibleCatalogPage
			config={recordsConfig}
			sourceFilterLabel={t('items.filter.source')}
			renderCatalog={(data) => <RecordsCatalog data={data} />}
		/>
	);
}
