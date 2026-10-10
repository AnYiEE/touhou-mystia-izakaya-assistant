import { cn } from '@heroui/theme';
import { Fragment, memo, useMemo, useRef } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { formatMerchantReference } from '@/domain/availability/sourceResolvers';
import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import {
	CurrencyItemCatalog,
	type CurrencyItemCatalog as CurrencyItemCatalogModel,
} from '@/domain/catalog/items/CurrencyItemCatalog';
import { PRAYER_LABEL_MAP } from '@/domain/data/labels/prayerFacts';
import { getMapLabel } from '@/domain/places/localizedLabels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import ItemCard from '@/features/catalog/shared/client/components/ItemCard';
import {
	ItemPopover,
	ItemPopoverContent,
	ItemPopoverTrigger,
} from '@/features/catalog/shared/client/components/ItemPopover';
import ItemPopoverCard from '@/features/catalog/shared/client/components/ItemPopoverCard';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { useItemPopoverState } from '@/features/catalog/shared/client/hooks/useItemPopoverState';
import { useOpenedItemPopover } from '@/features/catalog/shared/client/hooks/useOpenedItemPopover';
import type { TItemData } from '@/features/catalog/shared/contracts';
import { ItemPopoverCloseButton } from '@/features/itemSharing/client/components/ItemPopoverCloseButton';
import { ItemShareButton } from '@/features/itemSharing/client/components/ItemShareButton';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';

import { useI18n } from '@/shared/i18n/useI18n';

interface IProps {
	data: TItemData<CurrencyItemCatalogModel>;
}

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

export default memo<IProps>(function CurrencyItemsCatalog({ data }) {
	const { t } = useI18n(catalogItemsMessages);
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef, data);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();
	const presentationData = useMemo(
		() =>
			data.map((record) => ({
				...record,
				presentationDescription: { description: record.description },
			})),
		[data]
	);

	return presentationData.map(
		({ dlc, from, id, name, presentationDescription }, dataIndex) => (
			<ItemPopover
				key={getPopoverKey(dataIndex, id)}
				showArrow
				/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
				// backdrop={isHighAppearance ? 'blur' : 'opaque'}
				defaultOpen={checkDefaultOpen(id)}
				{...getPopoverOpenChangeProps(id)}
			>
				<ItemPopoverTrigger>
					<ItemCard
						isHoverable={checkShouldEffect(id)}
						isPressable={checkShouldEffect(id)}
						name={name}
						image={
							<Sprite
								target="currency_item"
								recordId={id}
								size={3}
								className={cn({
									'-translate-y-px': id === 6 || id === 29,
									'translate-x-px': id === 5 || id === 5011,
								})}
							/>
						}
						onPress={() => {
							trackEvent(
								trackEvent.category.click,
								'Currency Card',
								name
							);
						}}
					/>
				</ItemPopoverTrigger>
				<ItemPopoverContent>
					<ItemPopoverCloseButton />
					<ItemShareButton name={name} recordId={id} />
					<ItemPopoverCard
						target="currency_item"
						id={id}
						name={name}
						description={presentationDescription}
						dlc={dlc}
						ref={popoverCardRef}
					>
						<p>
							<span className="font-semibold">
								{t('items.source.from')}
							</span>
							{from.map((source, fromIndex) => {
								if ('mapSideTask' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 &&
												t('items.source.listSeparator')}
											{t('items.source.mapSideTask', {
												map: getMapLabel(
													source.mapSideTask.map
												),
											})}
										</Fragment>
									);
								}
								if ('mapPrayer' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 &&
												t('items.source.listSeparator')}
											{t('items.source.mapPrayer', {
												map: getMapLabel(
													source.mapPrayer.map
												),
												prayer: PRAYER_LABEL_MAP[
													source.mapPrayer.label
												],
											})}
										</Fragment>
									);
								}
								if ('spellCardReward' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 &&
												t('items.source.listSeparator')}
											{t('items.source.rewardSpellCard', {
												name: specialGuestCatalog.getDisplayPropsById(
													source.spellCardReward
														.specialGuest,
													'name'
												),
											})}
										</Fragment>
									);
								}

								const { amount, currencyItem } =
									source.buy.price;
								const currencyItemName =
									currencyItemCatalog.getDisplayPropsById(
										currencyItem,
										'name'
									);
								return (
									<Fragment key={fromIndex}>
										{fromIndex > 0 &&
											t('items.source.listSeparator')}
										{formatMerchantReference(
											source.buy.merchant
										)}
										{t('items.source.parenthesisOpen')}
										<span className="inline-flex items-center">
											<Price showSymbol={false}>
												{amount}×
											</Price>
											<Tooltip
												showArrow
												content={t(
													'items.source.actionCurrency',
													{ label: currencyItemName }
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
															currencyItemName
														);
													}}
													aria-label={t(
														'items.source.actionCurrency',
														{
															label: currencyItemName,
														}
													)}
													role="button"
												/>
											</Tooltip>
										</span>
										{t('items.source.parenthesisClose')}
									</Fragment>
								);
							})}
						</p>
					</ItemPopoverCard>
				</ItemPopoverContent>
			</ItemPopover>
		)
	);
});
