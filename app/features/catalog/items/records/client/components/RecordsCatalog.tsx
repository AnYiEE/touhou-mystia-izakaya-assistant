import { Fragment } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import { getMerchantLabel } from '@/domain/places/localizedLabels';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { useI18n } from '@/shared/i18n/useI18n';

const currencyItemCatalog = CurrencyItemCatalog.getInstance();

export default function RecordsCatalog({
	data,
}: {
	data: TItemData<RecordItemCatalog>;
}) {
	const openWindow = useViewInNewWindow();
	const { t } = useI18n(catalogItemsMessages);

	return (
		<CollectibleCatalog
			data={data}
			target="record"
			trackingLabel="Record Card"
		>
			{({ buy, composer, original, trackName }) => (
				<>
					<p>
						<span className="font-semibold">
							{t('items.source.trackName')}
						</span>
						{trackName}
					</p>
					<p>
						<span className="font-semibold">
							{t('items.source.originalTrack')}
						</span>
						{original}
					</p>
					<p>
						<span className="font-semibold">
							{t('items.source.arranger')}
						</span>
						{composer}
					</p>
					<p>
						<span className="font-semibold">
							{t('items.source.from')}
						</span>
						{getMerchantLabel(buy.merchant)}
						{t('items.source.parenthesisOpen')}
						{buy.prices.map(({ amount, currencyItem }, index) => (
							<Fragment key={currencyItem}>
								{index > 0 && t('items.source.listSeparator')}
								<span className="inline-flex items-center">
									<Price showSymbol={false}>{amount}×</Price>
									<Tooltip
										showArrow
										content={t(
											'items.source.actionCurrency',
											{
												label: currencyItemCatalog.getDisplayPropsById(
													currencyItem,
													'name'
												),
											}
										)}
										offset={1}
										size="sm"
									>
										<Sprite
											target="currency_item"
											recordId={currencyItem}
											size={1.25}
											onPress={() => {
												openWindow(
													'currencies',
													currencyItem,
													currencyItemCatalog.getDisplayPropsById(
														currencyItem,
														'name'
													)
												);
											}}
											aria-label={t(
												'items.source.actionCurrency',
												{
													label: currencyItemCatalog.getDisplayPropsById(
														currencyItem,
														'name'
													),
												}
											)}
											role="button"
										/>
									</Tooltip>
								</span>
							</Fragment>
						))}
						{t('items.source.parenthesisClose')}
					</p>
				</>
			)}
		</CollectibleCatalog>
	);
}
