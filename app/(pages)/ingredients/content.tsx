import {Fragment, memo, useRef} from 'react';
import {twJoin} from 'tailwind-merge';

import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent, PopoverTrigger, ScrollShadow} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Ol from '@/components/ol';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {type IIngredient, INGREDIENT_TAG_STYLE} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Ingredient} from '@/utils';

interface IProps {
	data: Ingredient['data'];
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
						trackEvent(TrackCategory.Click, 'Ingredient Card', name);
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
									<p className={twJoin('font-semibold', fromIndex !== 0 && 'mt-1')}>
										{isFishing || isFishingAdvanced ? (
											<Popover showArrow offset={6} size="sm">
												<Tooltip showArrow content={label} offset={3} size="sm">
													<span className="inline-flex cursor-pointer">
														<PopoverTrigger>
															<span tabIndex={0} className="underline-dotted-offset2">
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
												{Array.isArray(item) ? (
													item[1] ? (
														<Popover showArrow offset={6} size="sm">
															<Tooltip
																showArrow
																content={probability}
																offset={3}
																size="sm"
															>
																<span className="underline-dotted-offset2 cursor-pointer">
																	<PopoverTrigger>
																		<span tabIndex={0}>{item[0]}</span>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>{probability}</PopoverContent>
														</Popover>
													) : (
														item[0]
													)
												) : (
													item
												)}
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
