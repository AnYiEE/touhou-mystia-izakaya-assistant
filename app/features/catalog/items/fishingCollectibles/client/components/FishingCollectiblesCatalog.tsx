import { getDlcLabel } from '@/domain/availability/localizedLabels';
import type { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { getMapLabel } from '@/domain/places/localizedLabels';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import type { TItemData } from '@/features/catalog/shared/contracts';

import { useI18n } from '@/shared/i18n/useI18n';

export default function FishingCollectiblesCatalog({
	data,
}: {
	data: TItemData<FishingCollectibleCatalog>;
}) {
	const { t } = useI18n(catalogItemsMessages);

	return (
		<CollectibleCatalog
			data={data}
			target="trophy"
			trackingLabel="Fishing Collectible Card"
			summaryDetails={({ map, requiredContentDlc }) => (
				<>
					<p className="whitespace-nowrap">
						<span className="font-semibold">
							{t('items.source.fishingArea')}
						</span>
						{getMapLabel(map)}
					</p>
					<p className="whitespace-nowrap">
						<span className="font-semibold">
							{t('items.source.requiredContent')}
						</span>
						{getDlcLabel(requiredContentDlc)}
					</p>
				</>
			)}
		/>
	);
}
