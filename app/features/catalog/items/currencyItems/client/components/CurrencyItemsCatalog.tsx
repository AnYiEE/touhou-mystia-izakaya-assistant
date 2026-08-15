import { cn } from '@heroui/theme';
import { Fragment, memo, useMemo, useRef } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { SpecialGuestCatalog } from '@/domain/catalog/guests/SpecialGuestCatalog';
import {
	CurrencyItemCatalog,
	type CurrencyItemCatalog as CurrencyItemCatalogModel,
} from '@/domain/catalog/items/CurrencyItemCatalog';
import { MAP_FACTS } from '@/domain/data/places/placeFacts';
import type { TMerchantReference } from '@/domain/data/places/types';

import { trackEvent } from '@/features/analytics/client/trackEvent';
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

interface IProps {
	data: TItemData<CurrencyItemCatalogModel>;
}

const currencyItemCatalog = CurrencyItemCatalog.getInstance();
const specialGuestCatalog = SpecialGuestCatalog.getInstance();

function formatMerchantReference(merchant: TMerchantReference) {
	return 'map' in merchant
		? `【${MAP_FACTS[merchant.map].label}】${merchant.label}`
		: `【${specialGuestCatalog.getPropsById(merchant.specialGuest, 'name')}】${merchant.label}`;
}

export default memo<IProps>(function CurrencyItemsCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
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
							<span className="font-semibold">来源：</span>
							{from.map((source, fromIndex) => {
								if ('mapSideTask' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 && '、'}地区【
											{
												MAP_FACTS[
													source.mapSideTask.map
												].label
											}
											】支线任务
										</Fragment>
									);
								}
								if ('mapPrayer' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 && '、'}地区【
											{
												MAP_FACTS[source.mapPrayer.map]
													.label
											}
											】{source.mapPrayer.locationLabel}
											处祈愿
										</Fragment>
									);
								}
								if ('spellCardReward' in source) {
									return (
										<Fragment key={fromIndex}>
											{fromIndex > 0 && '、'}【
											{specialGuestCatalog.getPropsById(
												source.spellCardReward
													.specialGuest,
												'name'
											)}
											】奖励符卡
										</Fragment>
									);
								}

								const { amount, currencyItem } =
									source.buy.price;
								const currencyItemName =
									currencyItemCatalog.getPropsById(
										currencyItem,
										'name'
									);
								return (
									<Fragment key={fromIndex}>
										{fromIndex > 0 && '、'}
										{formatMerchantReference(
											source.buy.merchant
										)}
										（
										<span className="inline-flex items-center">
											<Price showSymbol={false}>
												{amount}×
											</Price>
											<Tooltip
												showArrow
												content={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
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
													aria-label={`点击：在新窗口中查看货币【${currencyItemName}】的详情`}
													role="button"
												/>
											</Tooltip>
										</span>
										）
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
