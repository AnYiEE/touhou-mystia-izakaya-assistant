import { DLC_LABEL_MAP } from '@/domain/availability/messages';
import type { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import type { TItemData } from '@/features/catalog/shared/contracts';

export default function FishingCollectiblesCatalog({
	data,
}: {
	data: TItemData<FishingCollectibleCatalog>;
}) {
	return (
		<CollectibleCatalog
			data={data}
			target="trophy"
			trackingLabel="Fishing Collectible Card"
			summaryDetails={({ map, requiredContentDlc }) => (
				<>
					<p className="whitespace-nowrap">
						<span className="font-semibold">垂钓地区：</span>
						{MAP_FACTS[map].label}
					</p>
					<p className="whitespace-nowrap">
						<span className="font-semibold">所需内容：</span>
						{DLC_LABEL_MAP[requiredContentDlc].label}
					</p>
				</>
			)}
		/>
	);
}
