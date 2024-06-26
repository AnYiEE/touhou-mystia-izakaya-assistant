import {Fragment, memo} from 'react';

import {useOpenedFoodPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Sprite from '@/components/sprite';

import {BEVERAGE_TAG_STYLE} from '@/constants';
import {type IBeverage} from '@/data';
import type {TBeverageInstance} from '@/methods/food/types';

interface IProps {
	data: TBeverageInstance['data'];
}

export default memo(function Content({data}: IProps) {
	const openedPopoverParam = 'select';
	const [openedPopover] = useOpenedFoodPopover(openedPopoverParam);

	return (
		<>
			{data.map(({dlc, from, name, level, price, tags}, dataIndex) => (
				<Popover
					key={dataIndex}
					backdrop="opaque"
					showArrow
					isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
				>
					<PopoverTrigger className="w-full">
						<FoodCard
							isHoverable
							isPressable
							name={name}
							description={`￥${price}`}
							image={<Sprite target="beverage" name={name} size={3} />}
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
																<Popover showArrow offset={0}>
																	<Tooltip
																		showArrow
																		content={probability}
																		offset={-1.5}
																	>
																		<span className="cursor-pointer underline decoration-dotted">
																			<PopoverTrigger>
																				<span>{item[0]}</span>
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
