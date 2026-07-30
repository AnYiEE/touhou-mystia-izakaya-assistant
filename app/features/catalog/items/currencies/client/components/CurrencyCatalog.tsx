import { cn } from '@heroui/theme';
import { isObject } from 'lodash';
import { Fragment, memo, useRef } from 'react';

import Tooltip from '@/design/ui/components/tooltip';

import { type Currency } from '@/domain/catalog/items/Currency';
import type { ICurrency } from '@/domain/data/currencies/schema';
import type { TCurrencyName } from '@/domain/data/currencies/types';

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

import { checkObjectOrStringEmpty } from '@/shared/utilities/collections/check';

interface IProps {
	data: TItemData<Currency>;
}

export default memo<IProps>(function CurrencyCatalog({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const { defaultOpenedPopover, getPopoverOpenChangeProps } =
		useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect, getPopoverKey } =
		useItemPopoverState(defaultOpenedPopover);
	const openWindow = useViewInNewWindow();

	return data.map(({ description, dlc, from, id, name }, dataIndex) => (
		<ItemPopover
			key={getPopoverKey(dataIndex, name)}
			showArrow
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			defaultOpen={checkDefaultOpen(name)}
			{...getPopoverOpenChangeProps(name)}
		>
			<ItemPopoverTrigger>
				<ItemCard
					isHoverable={checkShouldEffect(name)}
					isPressable={checkShouldEffect(name)}
					name={name}
					image={
						<Sprite
							target="currency"
							name={name}
							size={3}
							className={cn({
								'-translate-y-px':
									name === '红色的宝石' ||
									name === '银色的青蛙硬币',
								'translate-x-px':
									name === '破损的符咒' ||
									name === '蓬松松糖果',
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
				<ItemShareButton name={name} />
				<ItemPopoverCard
					target="currency"
					id={id}
					name={name}
					description={{ description }}
					dlc={dlc}
					ref={popoverCardRef}
				>
					{!checkObjectOrStringEmpty(from) && (
						<p>
							<span className="font-semibold">来源：</span>
							{from.map((item, fromIndex) => (
								<Fragment key={fromIndex}>
									{fromIndex > 0 && '、'}
									{typeof item === 'string'
										? item
										: Object.entries(item).map(
												(itemObject, itemIndex) => {
													type TFrom = Exclude<
														ICurrency['from'][number],
														string
													>;
													const [method, target] =
														itemObject as [
															keyof TFrom,
															ExtractCollectionValue<TFrom>,
														];
													const isBuy =
														method === 'buy' &&
														isObject(target);
													const isTask =
														method === 'task' &&
														typeof target ===
															'string';
													return (
														<Fragment
															key={`${fromIndex}-${itemIndex}`}
														>
															{itemIndex > 0 &&
																'、'}
															{isBuy ? (
																<>
																	{
																		target.name
																	}
																	（
																	<span className="inline-flex items-center">
																		<Price
																			showSymbol={
																				false
																			}
																		>
																			{
																				target
																					.price
																					.amount
																			}
																			×
																		</Price>
																		<Tooltip
																			showArrow
																			content={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																			offset={
																				1
																			}
																			size="sm"
																		>
																			<Sprite
																				target="currency"
																				name={
																					target
																						.price
																						.currency as TCurrencyName
																				}
																				size={
																					1.25
																				}
																				onPress={() => {
																					openWindow(
																						'currencies',
																						target
																							.price
																							.currency as TCurrencyName
																					);
																				}}
																				aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																				role="button"
																			/>
																		</Tooltip>
																	</span>
																	）
																</>
															) : (
																isTask &&
																`地区【${target}】支线任务`
															)}
														</Fragment>
													);
												}
											)}
								</Fragment>
							))}
						</p>
					)}
				</ItemPopoverCard>
			</ItemPopoverContent>
		</ItemPopover>
	));
});
