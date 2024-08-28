import {Fragment, memo, useRef} from 'react';

import {openedPopoverParam, useOpenedFoodPopover} from '@/hooks/useOpenedFoodPopover';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {type IIngredient, INGREDIENT_TAG_STYLE} from '@/data';
import {type Ingredient} from '@/utils';

interface IProps {
	data: Ingredient['data'];
	isInNewWindow: boolean;
}

export default memo<IProps>(function Content({data, isInNewWindow}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedFoodPopover(popoverCardRef);

	return (
		<>
			{data.map(({dlc, from, name, level, price, tags, type}, dataIndex) => (
				<Popover
					key={dataIndex}
					showArrow
					backdrop="opaque"
					isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
				>
					<PopoverTrigger>
						<FoodCard
							isHoverable
							isPressable
							name={name}
							description={<Price>{price}</Price>}
							image={<Sprite target="ingredient" name={name} size={3} />}
							onPress={() => {
								trackEvent(TrackCategory.Click, 'Ingredient Card', name);
							}}
						/>
					</PopoverTrigger>
					<PopoverContent>
						<FoodPopoverCard.CloseButton isInNewWindow={isInNewWindow} param={openedPopoverParam} />
						<FoodPopoverCard.ShareButton name={name} param={openedPopoverParam} />
						<FoodPopoverCard
							target="ingredient"
							name={name}
							description={{level, price}}
							dlc={dlc}
							ingredientType={type}
							tags={{positive: tags}}
							tagColors={INGREDIENT_TAG_STYLE}
							ref={popoverCardRef}
						>
							{Object.entries(from as IIngredient['from']).map(([method, target], fromIndex) => {
								const probability = `概率${method === 'buy' ? '出售' : '掉落'}`;
								const way = method === 'buy' ? '购买' : method === 'task' ? '任务' : '采集';

								return (
									<p key={fromIndex}>
										<span className="font-semibold">{way}：</span>
										{target.map((item, index) => (
											<Fragment key={index}>
												{Array.isArray(item) ? (
													item[1] ? (
														<Popover showArrow offset={6.5}>
															<Tooltip showArrow content={probability} offset={4}>
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
												{index < target.length - 1 && '、'}
											</Fragment>
										))}
									</p>
								);
							})}
						</FoodPopoverCard>
					</PopoverContent>
				</Popover>
			))}
		</>
	);
});
