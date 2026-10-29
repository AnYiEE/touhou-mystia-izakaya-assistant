import { Fragment, memo } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import { CurrencyItemCatalog } from '@/domain/catalog/items/CurrencyItemCatalog';
import type { ICurrencyItem } from '@/domain/data/currencyItems/schema';
import type { TCurrencyItemId } from '@/domain/data/currencyItems/types';
import { PRAYER_LABEL_MAP } from '@/domain/data/labels/prayerFacts';
import { getSourceEntries } from '@/domain/data/shared/sourceEntries';
import { getCollaborationLabel } from '@/domain/labels/localizedCollaborationLabels';
import { getMapLabel } from '@/domain/places/localizedLabels';

import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import { formatSourceReference } from '@/features/catalog/items/shared/sourceReferenceFormatting';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import {
	type TItemRoutePath,
	type TShareableItemId,
	type TShareableItemName,
} from '@/features/itemSharing/contracts';
import {
	CollaborationMapLink,
	MerchantMapLink,
	PrayerMapLink,
} from '@/features/maps/client/components/MapLinks';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	from: ICurrencyItem['from'];
	id: TCurrencyItemId;
	openWindow: (
		path: TItemRoutePath,
		recordId: TShareableItemId,
		name: TShareableItemName
	) => void;
}

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export default memo<IProps>(function CurrencyItemSourceDetails({
	from,
	id,
	openWindow,
}) {
	const { locale, t } = useI18n(catalogItemsMessages);

	return (
		<p>
			<span className="font-semibold">{t('items.source.from')}</span>
			{getSourceEntries<ICurrencyItem['from']>(from).map(
				(source, sourceIndex) => {
					if ('collaboration' in source) {
						return (
							<Fragment key={sourceIndex}>
								{sourceIndex > 0 &&
									t('items.source.listSeparator')}
								{t('items.source.collaborationTerminal', {
									label: getCollaborationLabel(
										source.collaboration.collaborationLabel
									),
								})}
								<CollaborationMapLink itemId={id} />
							</Fragment>
						);
					}
					if ('mapSideTask' in source) {
						return (
							<Fragment key={sourceIndex}>
								{sourceIndex > 0 &&
									t('items.source.listSeparator')}
								{t('items.source.mapSideTask', {
									map: getMapLabel(source.mapSideTask.map),
								})}
							</Fragment>
						);
					}
					if ('mapPrayer' in source) {
						return (
							<Fragment key={sourceIndex}>
								{sourceIndex > 0 &&
									t('items.source.listSeparator')}
								{t('items.source.mapPrayer', {
									map: getMapLabel(source.mapPrayer.map),
									prayer: PRAYER_LABEL_MAP[
										source.mapPrayer.label
									],
								})}
								<PrayerMapLink
									itemId={id}
									reference={source.mapPrayer}
								/>
							</Fragment>
						);
					}
					if ('spellCardReward' in source) {
						return (
							<Fragment key={sourceIndex}>
								{sourceIndex > 0 &&
									t('items.source.listSeparator')}
								{t('items.source.rewardSpellCard', {
									name: specialGuestCatalog.getDisplayPropsById(
										source.spellCardReward.specialGuest,
										'name'
									),
								})}
							</Fragment>
						);
					}

					const { amount, currencyItem } = source.buy.price;
					const currencyItemName =
						currencyItemCatalog.getDisplayPropsById(
							currencyItem,
							'name'
						);
					return (
						<Fragment key={sourceIndex}>
							{sourceIndex > 0 && t('items.source.listSeparator')}
							{formatSourceReference(source.buy.merchant, locale)}
							<MerchantMapLink
								itemId={id}
								reference={source.buy.merchant}
							/>
							{t('items.source.parenthesisOpen')}
							<span className="inline-flex items-center">
								<Price showSymbol={false}>{amount}×</Price>
								<Tooltip
									showArrow
									content={t('items.source.actionCurrency', {
										label: currencyItemName,
									})}
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
												currencyItemName
											);
										}}
										aria-label={t(
											'items.source.actionCurrency',
											{ label: currencyItemName }
										)}
										role="button"
									/>
								</Tooltip>
							</span>
							{t('items.source.parenthesisClose')}
						</Fragment>
					);
				}
			)}
		</p>
	);
});
