import type { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { useI18n } from '@/shared/i18n/useI18n';

import GeneralItemSourceDetails from './GeneralItemSourceDetails';

export default function GeneralItemsCatalog({
	data,
}: {
	data: TItemData<GeneralItemCatalog>;
}) {
	const openWindow = useViewInNewWindow();
	const { t } = useI18n(catalogItemsMessages);

	return (
		<CollectibleCatalog data={data} target="item" trackingLabel="Item Card">
			{({ effects, from }) => (
				<>
					<GeneralItemSourceDetails
						from={from}
						openWindow={openWindow}
					/>
					{effects.length > 0 && (
						<p>
							<span className="font-semibold">
								{t('items.source.effect')}
							</span>
							{effects.join('；')}
						</p>
					)}
				</>
			)}
		</CollectibleCatalog>
	);
}
