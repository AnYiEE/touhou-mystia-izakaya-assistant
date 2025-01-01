import {Fragment, memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent, PopoverTrigger, ScrollShadow, cn} from '@nextui-org/react';

import {trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Ol from '@/components/ol';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {type IIngredient, INGREDIENT_TAG_STYLE} from '@/data';
import {CLASS_FOCUS_VISIBLE_OUTLINE} from '@/design/theme';
// import {globalStore as store} from '@/stores';
import {type Ingredient} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	data: TItemData<Ingredient>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({description, dlc, from, id, level, name, price, tags, type}, dataIndex) => (
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
					description={<Price>{price}</Price>}
					image={<Sprite target="ingredient" name={name} size={3} />}
					onPress={() => {
						trackEvent(trackEvent.category.Click, 'Ingredient Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="ingredient"
					id={id}
					name={name}
					description={{description, level, price, type}}
					dlc={dlc}
					tags={{positive: tags}}
					tagColors={INGREDIENT_TAG_STYLE}
					ref={popoverCardRef}
				>
					<ScrollShadow hideScrollBar size={16} className="max-h-dvh-safe-half">
						{Object.entries(from).map((fromObject, fromIndex) => {
							type TFrom = Exclude<IIngredient['from'], string>;
							const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
							const isBuy = method === 'buy';
							const isFishing = method === 'fishing';
							const isFishingAdvanced = method === 'fishingAdvanced';
							const isTask = method === 'task';
							const probability = `概率${isBuy ? '出售' : '掉落'}`;
							const way = isBuy
								? '购买'
								: isFishing
									? '钓鱼'
									: isFishingAdvanced
										? '高级钓鱼'
										: isTask
											? '任务'
											: '采集';
							const label = `${probability}，使用摆件【${isFishing ? '普通的' : '超级'}钓鱼竿】`;
							return (
								<Fragment key={fromIndex}>
									<p
										className={cn('font-semibold', {
											'mt-1': fromIndex !== 0,
										})}
									>
										{isFishing || isFishingAdvanced ? (
											<Popover showArrow offset={5} size="sm">
												<Tooltip showArrow content={label} offset={3} size="sm">
													<span className="inline-flex cursor-pointer">
														<PopoverTrigger>
															<span
																tabIndex={0}
																className={cn(
																	'underline-dotted-offset2',
																	CLASS_FOCUS_VISIBLE_OUTLINE
																)}
															>
																{way}
															</span>
														</PopoverTrigger>
													</span>
												</Tooltip>
												<PopoverContent>{label}</PopoverContent>
											</Popover>
										) : (
											way
										)}
									</p>
									<Ol className="ml-3">
										{target?.map((item, targetIndex) => (
											<Ol.Li key={targetIndex}>
												{Array.isArray(item)
													? (() => {
															const itemProbability =
																typeof item[1] === 'number'
																	? `${item[1]}%${probability}`
																	: item[1]
																		? probability
																		: null;
															const itemTime =
																item.length === 4 ? (
																	<>
																		{itemProbability === null ? '' : '，'}
																		采集点出现时间：
																		{item[2]}
																		<span className="mx-0.5">-</span>
																		{item[3]}点
																	</>
																) : null;
															const content =
																itemProbability !== null || itemTime !== null ? (
																	<p>
																		{itemProbability}
																		{itemTime}
																	</p>
																) : null;
															return content === null ? (
																item[0]
															) : (
																<Popover offset={2} size="sm">
																	<Tooltip
																		content={content}
																		closeDelay={0}
																		offset={0}
																		size="sm"
																	>
																		<span className="underline-dotted-offset2 cursor-pointer">
																			<PopoverTrigger>
																				<span
																					tabIndex={0}
																					className={
																						CLASS_FOCUS_VISIBLE_OUTLINE
																					}
																				>
																					{item[0]}
																				</span>
																			</PopoverTrigger>
																		</span>
																	</Tooltip>
																	<PopoverContent>{content}</PopoverContent>
																</Popover>
															);
														})()
													: item}
											</Ol.Li>
										))}
									</Ol>
								</Fragment>
							);
						})}
					</ScrollShadow>
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
