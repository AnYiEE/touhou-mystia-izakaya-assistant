import {Fragment, memo} from 'react';

import {useOpenedFoodPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {BEVERAGE_TAG_STYLE} from '@/constants';
import {type IBeverage} from '@/data';
import {type Beverage} from '@/utils';

interface IProps {
	data: Beverage['data'];
}

export default memo<IProps>(function Content({data}) {
	const openedPopoverParam = 'select';
	const [openedPopover] = useOpenedFoodPopover(openedPopoverParam);

	return (
		<>
			{data.map(({dlc, from, name, level, price, tags}, dataIndex) => (
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
							image={<Sprite target="beverage" name={name} size={3} />}
							onPress={() => {
								trackEvent(TrackCategory.Click, 'Beverage Card', name);
							}}
						/>
					</PopoverTrigger>
					<PopoverContent>
						<FoodPopoverCard.CloseButton param={openedPopoverParam} />
						<FoodPopoverCard.ShareButton name={name} param={openedPopoverParam} />
						<FoodPopoverCard
							target="beverage"
							name={name}
							description={{level, price}}
							dlc={dlc}
							tags={{beverage: tags}}
							tagColors={BEVERAGE_TAG_STYLE}
						>
							{Object.entries(from as IBeverage['from']).map(([method, target], fromIndex) => {
								const probability = `概率${method === 'buy' ? '出售' : '掉落'}`;
								const way = method === 'buy' ? '购买' : method === 'task' ? '任务' : '采集';

								return (
									<p key={fromIndex}>
										<span className="font-semibold">{way}：</span>
										{Array.isArray(target)
											? target.map((item, index) => (
													<Fragment key={index}>
														{Array.isArray(item) ? (
															item[1] ? (
																<Popover showArrow offset={6.5}>
																	<Tooltip showArrow content={probability} offset={4}>
																		<span className="cursor-pointer underline decoration-dotted underline-offset-2">
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
												))
											: '初始拥有'}
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
