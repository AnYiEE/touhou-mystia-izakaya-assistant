import {Fragment, memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
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

	// const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return data.map(({dlc, from, name, level, price, tags, type}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			// backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
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
					name={name}
					description={{level, price, type}}
					dlc={dlc}
					tags={{positive: tags}}
					tagColors={INGREDIENT_TAG_STYLE}
					ref={popoverCardRef}
				>
					{Object.entries(from).map((fromObject, fromIndex) => {
						type TFrom = Exclude<IIngredient['from'], string>;
						const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
						const isBuy = method === 'buy';
						const isFishing = method === 'fishing';
						const isTask = method === 'task';
						const probability = `概率${isBuy ? '出售' : '掉落'}`;
						const way = isBuy ? '购买' : isFishing ? '钓鱼' : isTask ? '任务' : '采集';
						return (
							<p key={fromIndex}>
								{isFishing ? (
									<span>
										<Popover showArrow offset={6} size="sm">
											<Tooltip showArrow content={probability} offset={3} size="sm">
												<span className="inline-flex cursor-pointer">
													<PopoverTrigger>
														<span tabIndex={0} className="font-semibold">
															<span className="underline-dotted-offset2">{way}</span>：
														</span>
													</PopoverTrigger>
												</span>
											</Tooltip>
											<PopoverContent>{probability}</PopoverContent>
										</Popover>
									</span>
								) : (
									<span className="font-semibold">{way}：</span>
								)}
								{target?.map((item, index) => (
									<Fragment key={index}>
										{Array.isArray(item) ? (
											item[1] ? (
												<Popover showArrow offset={6} size="sm">
													<Tooltip showArrow content={probability} offset={3} size="sm">
														<span className="underline-dotted-offset2 inline-flex cursor-pointer">
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
										{index < target.length - 1 && '、'}
									</Fragment>
								))}
							</p>
						);
					})}
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
