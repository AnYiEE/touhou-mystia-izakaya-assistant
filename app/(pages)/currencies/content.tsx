import { Fragment, memo, useRef } from 'react';
import { isObject } from 'lodash';

import {
	useItemPopoverState,
	useOpenedItemPopover,
	useViewInNewWindow,
} from '@/hooks';

import { Tooltip, cn } from '@/design/ui/components';

import { trackEvent } from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import { type ICurrency, type TCurrencyName } from '@/data';
// import {globalStore as store} from '@/stores';
import { type Currency } from '@/utils';
import type { TItemData } from '@/utils/types';

interface IProps {
	data: TItemData<Currency>;
}

export default memo<IProps>(function Content({ data }) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const { checkDefaultOpen, checkShouldEffect } =
		useItemPopoverState(openedPopover);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({ description, dlc, from, id, name }, dataIndex) => (
		<ItemPopoverCard.Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/heroui-inc/heroui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={checkDefaultOpen(name)}
		>
			<ItemPopoverCard.Trigger>
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
			</ItemPopoverCard.Trigger>
			<ItemPopoverCard.Content>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="currency"
					id={id}
					name={name}
					description={{ description }}
					dlc={dlc}
					ref={popoverCardRef}
				>
					{from.length > 0 && (
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
			</ItemPopoverCard.Content>
		</ItemPopoverCard.Popover>
	));
});
