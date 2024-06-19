import {Fragment} from 'react';

import {useOpenedFoodPopover} from '@/hooks';

import {Popover, PopoverTrigger, PopoverContent, Tooltip} from '@nextui-org/react';

import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Sprite from '@/components/sprite';

import {BEVERAGE_TAG_STYLE} from '@/constants';
import {type IBeverage} from '@/data';
import {type instances} from '@/methods';

interface IProps {
	data: typeof instances.food.beverage.data;
}

export default function Content({data}: IProps) {
	const openedPopoverParam = 'select' as const;
	const [openedPopover, setOpenedPopover] = useOpenedFoodPopover(openedPopoverParam);

	return (
		<>
			{data.map(({dlc, from, name, level, price, tag: tags}, index) => {
				const levelString = `Lv.${level}`;
				const priceString = `￥${price}`;

				return (
					<Popover
						key={index}
						backdrop="opaque"
						showArrow
						isOpen={openedPopover === name}
						onOpenChange={(isOpen) => {
							setOpenedPopover(isOpen ? name : '');
						}}
					>
						<PopoverTrigger className="w-full">
							<FoodCard
								isHoverable
								isPressable
								name={name}
								description={priceString}
								image={<Sprite target="beverage" name={name} size={48} />}
							/>
						</PopoverTrigger>
						<PopoverContent>
							<FoodPopoverCard.CloseButton param={openedPopoverParam} />
							<FoodPopoverCard
								target="beverage"
								name={name}
								description={
									<>
										<span>
											<span className="font-semibold">售价：</span>
											{priceString}
										</span>
										<span>
											<span className="font-semibold">等级：</span>
											{levelString}
										</span>
									</>
								}
								dlc={dlc}
								tags={{positive: tags}}
								tagColors={BEVERAGE_TAG_STYLE}
							>
								{Object.entries(from as IBeverage['from']).map(([method, target], index) => (
									<div key={index}>
										<span className="font-semibold">
											{method === 'buy' ? '购买' : method === 'task' ? '任务' : '采集'}：
										</span>
										{Array.isArray(target)
											? target.map((item, index) => (
													<Fragment key={index}>
														{Array.isArray(item) ? (
															item[1] === true ? (
																<Tooltip
																	showArrow
																	content={`概率${method === 'buy' ? '出售' : '掉落'}`}
																>
																	<span className="underline decoration-dotted">
																		{item[0]}
																	</span>
																</Tooltip>
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
									</div>
								))}
							</FoodPopoverCard>
						</PopoverContent>
					</Popover>
				);
			})}
		</>
	);
}
