import { Fragment, memo, useCallback, useMemo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import { type RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import { getDayMapMerchantMap } from '@/domain/data/maps/dayMapSourceFacts';
import { type TMerchantLabel } from '@/domain/data/places/merchantFacts';
import { getMerchantLabel } from '@/domain/places/localizedLabels';

import CollectibleCatalog from '@/features/catalog/items/collectibles/client/components/CollectibleCatalog';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { MerchantMapLink } from '@/features/maps/client/components/MapLinks';
import { getDayMapLabel } from '@/features/maps/client/model/dayMapLabels';

import { useI18n } from '@/shared/i18n/useI18n';

const currencyItemCatalog = CurrencyItemCatalog.getInstance();

interface IProps {
	data: TItemData<RecordItemCatalog>;
}

interface IMerchantPresentation {
	reference: { label: TMerchantLabel };
	source: string;
}

export default memo<IProps>(function RecordsCatalog({ data }) {
	const { t } = useI18n(catalogItemsMessages);
	const openWindow = useViewInNewWindow();

	const merchantPresentations = useMemo(() => {
		const presentations = new Map<TMerchantLabel, IMerchantPresentation>();
		for (const { buy } of data) {
			const { merchant } = buy;
			if (presentations.has(merchant)) {
				continue;
			}
			const map = getDayMapMerchantMap(merchant);
			const merchantLabel = getMerchantLabel(merchant);
			presentations.set(merchant, {
				reference: { label: merchant },
				source:
					map === undefined
						? merchantLabel
						: t('items.source.mapCollection', {
								label: merchantLabel,
								map: getDayMapLabel(map),
							}),
			});
		}
		return presentations;
	}, [data, t]);

	const renderRecordDetails = useCallback(
		({
			buy,
			composer,
			id,
			original,
			trackName,
		}: IProps['data'][number]) => {
			const merchantPresentation = merchantPresentations.get(
				buy.merchant
			);
			const merchantReference = merchantPresentation?.reference ?? {
				label: buy.merchant,
			};

			return (
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
						{merchantPresentation?.source ??
							getMerchantLabel(buy.merchant)}
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
						<MerchantMapLink
							itemId={id}
							reference={merchantReference}
						/>
					</p>
				</>
			);
		},
		[merchantPresentations, openWindow, t]
	);

	return (
		<CollectibleCatalog
			data={data}
			target="record"
			trackingLabel="Record Card"
		>
			{renderRecordDetails}
		</CollectibleCatalog>
	);
});
