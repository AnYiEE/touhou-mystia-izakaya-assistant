import {Fragment, memo, useRef} from 'react';

import {openedPopoverParam, useOpenedFoodPopover} from '@/hooks/useOpenedFoodPopover';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {BEVERAGE_TAG_STYLE, type IBeverage} from '@/data';
import {globalStore as store} from '@/stores';
import {type Beverage} from '@/utils';

interface IProps {
	data: Beverage['data'];
	isInNewWindow: boolean;
}

export default memo<IProps>(function Content({data, isInNewWindow}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedFoodPopover(popoverCardRef);

	const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return data.map(({dlc, from, name, level, price, tags}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			backdrop={isShowBackgroundImage ? 'blur' : 'opaque'}
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
				<FoodPopoverCard.CloseButton isInNewWindow={isInNewWindow} param={openedPopoverParam} />
				<FoodPopoverCard.ShareButton name={name} param={openedPopoverParam} />
				<FoodPopoverCard
					target="beverage"
					name={name}
					description={{level, price}}
					dlc={dlc}
					tags={{beverage: tags}}
					tagColors={BEVERAGE_TAG_STYLE}
					ref={popoverCardRef}
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
														<Popover showArrow offset={6} size="sm">
															<Tooltip
																showArrow
																content={probability}
																offset={3}
																size="sm"
															>
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
										))
									: '初始拥有'}
							</p>
						);
					})}
				</FoodPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
