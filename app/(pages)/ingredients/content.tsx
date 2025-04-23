import {Fragment, memo, useRef} from 'react';

import {useItemPopoverState, useOpenedItemPopover} from '@/hooks';

import {
	CLASSNAME_FOCUS_VISIBLE_OUTLINE,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollShadow,
	Tooltip,
	cn,
} from '@/design/ui/components';

import {trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Ol from '@/components/ol';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {
	COLLECTION_LOCATION_REFRESH_TIME_MAP,
	type IIngredient,
	INGREDIENT_TAG_STYLE,
	type TCollectionLocation,
} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Ingredient} from '@/utils';
import type {TItemData} from '@/utils/types';

interface IProps {
	data: TItemData<Ingredient>;
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);
	const {checkDefaultOpen, checkShouldEffect} = useItemPopoverState(openedPopover);

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({description, dlc, from, id, level, name, price, tags, type}, dataIndex) => (
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
					description={<Price>{price}</Price>}
					image={<Sprite target="ingredient" name={name} size={3} />}
					onPress={() => {
						trackEvent(trackEvent.category.click, 'Ingredient Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<ItemPopoverCard.Content>
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
					<ScrollShadow size={16} className="max-h-dvh-safe-half">
						{Object.entries(from).map((fromObject, fromIndex) => {
							type TFrom = Exclude<IIngredient['from'], string>;
							const [method, target] = fromObject as [keyof TFrom, ExtractCollectionValue<TFrom>];
							const isBuy = method === 'buy';
							const isCollect = method === 'collect';
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
																	CLASSNAME_FOCUS_VISIBLE_OUTLINE
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
												{isCollect || Array.isArray(item)
													? (() => {
															const isArray = Array.isArray(item);
															const itemProbability = isArray
																? typeof item[1] === 'number'
																	? `${item[1]}%${probability}`
																	: item[1]
																		? probability
																		: null
																: null;
															const collectableTimeRange =
																isCollect && isArray && item.length === 4
																	? ([item[2], item[3]] as [number, number])
																	: null;
															const collectableTimeRangeContent =
																collectableTimeRange === null ? null : (
																	<>
																		{itemProbability === null ? '' : '；'}
																		采集点出现时间：
																		{collectableTimeRange[0]}
																		<span className="mx-0.5">-</span>
																		{collectableTimeRange[1]}点
																	</>
																);
															const refreshTime = isCollect
																? COLLECTION_LOCATION_REFRESH_TIME_MAP[
																		(isArray
																			? item[0]
																			: item) as TCollectionLocation
																	]
																: null;
															const refreshTimeContent =
																refreshTime === null ? null : (
																	<>
																		{collectableTimeRange === null
																			? itemProbability === null
																				? ''
																				: '；'
																			: '，'}
																		采集点刷新周期：
																		{refreshTime}
																		小时
																	</>
																);
															const itemContent = isArray ? item[0] : item;
															const tooltipContent =
																itemProbability !== null ||
																collectableTimeRangeContent !== null ||
																refreshTimeContent !== null ? (
																	<p>
																		{itemProbability}
																		{collectableTimeRangeContent}
																		{refreshTimeContent}
																	</p>
																) : null;
															return tooltipContent === null ? (
																itemContent
															) : (
																<Popover offset={2} size="sm">
																	<Tooltip
																		content={tooltipContent}
																		closeDelay={0}
																		offset={0}
																		size="sm"
																	>
																		<span className="underline-dotted-offset2 cursor-pointer">
																			<PopoverTrigger>
																				<span
																					tabIndex={0}
																					className={
																						CLASSNAME_FOCUS_VISIBLE_OUTLINE
																					}
																				>
																					{itemContent}
																				</span>
																			</PopoverTrigger>
																		</span>
																	</Tooltip>
																	<PopoverContent>{tooltipContent}</PopoverContent>
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
			</ItemPopoverCard.Content>
		</ItemPopoverCard.Popover>
	));
});
