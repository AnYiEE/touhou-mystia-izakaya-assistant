import type { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import GeneralItemSourceDetails from './GeneralItemSourceDetails';

export default function GeneralItemsCatalog({
	data,
}: {
	data: TItemData<GeneralItemCatalog>;
}) {
	const openWindow = useViewInNewWindow();

	return (
		<CollectibleCatalog data={data} target="item" trackingLabel="Item Card">
			{({ effects, from }) => (
				<>
					{from.length > 0 && (
						<GeneralItemSourceDetails
							from={from}
							openWindow={openWindow}
						/>
					)}
					{effects.length > 0 && (
						<p>
							<span className="font-semibold">效果：</span>
							{effects.join('；')}
						</p>
					)}
				</>
			)}
		</CollectibleCatalog>
	);
}
