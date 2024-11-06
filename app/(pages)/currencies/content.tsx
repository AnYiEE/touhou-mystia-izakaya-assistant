import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';

import {useOpenedItemPopover, useViewInNewWindow} from '@/hooks';

import {PopoverContent} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {type ICurrency} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Currency, checkA11yConfirmKey} from '@/utils';

interface IProps {
	data: Currency['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const openWindow = useViewInNewWindow();

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({description, dlc, from, id, name}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			/** @todo Add it back after {@link https://github.com/nextui-org/nextui/issues/3736} is fixed. */
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={name}
					image={<Sprite target="currency" name={name} size={3} />}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Currency Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="currency"
					id={id}
					name={name}
					description={{description}}
					dlc={dlc}
					ref={popoverCardRef}
				>
					<p>
						<span className="font-semibold">来源：</span>
						{from.map((item, fromIndex) => (
							<Fragment key={fromIndex}>
								{fromIndex > 0 && '、'}
								{typeof item === 'string'
									? item
									: Object.entries(item).map((itemObject, itemIndex) => {
											type TFrom = Exclude<ICurrency['from'][number], string>;
											const [method, target] = itemObject as [keyof TFrom, TFrom[keyof TFrom]];
											const isBuy = method === 'buy' && isObjectLike(target);
											const isTask = method === 'task' && typeof target === 'string';
											return (
												<Fragment key={`${fromIndex}-${itemIndex}`}>
													{itemIndex > 0 && '、'}
													{isBuy ? (
														<>
															{target.name}（
															<span className="inline-flex items-center">
																<Price showSymbol={false}>{target.price.amount}×</Price>
																<Tooltip
																	showArrow
																	content={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																	offset={6}
																	size="sm"
																>
																	<Sprite
																		target="currency"
																		name={target.price.currency as never}
																		size={1.25}
																		onClick={() => {
																			openWindow(
																				'currencies',
																				target.price.currency as never
																			);
																		}}
																		onKeyDown={(event) => {
																			if (checkA11yConfirmKey(event)) {
																				openWindow(
																					'currencies',
																					target.price.currency as never
																				);
																			}
																		}}
																		aria-label={`点击：在新窗口中查看货币【${target.price.currency}】的详情`}
																		role="button"
																		tabIndex={0}
																		className="cursor-pointer"
																	/>
																</Tooltip>
															</span>
															）
														</>
													) : (
														isTask && `地区【${target}】支线任务`
													)}
												</Fragment>
											);
										})}
							</Fragment>
						))}
					</p>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
