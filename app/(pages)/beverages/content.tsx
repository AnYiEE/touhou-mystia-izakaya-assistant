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

import {BEVERAGE_TAG_STYLE, type IBeverage} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Beverage} from '@/utils';

interface IProps {
	data: Beverage['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isHighAppearance = store.persistence.highAppearance.use();

	return data.map(({dlc, from, name, level, price, tags}, dataIndex) => (
		<Popover
			key={dataIndex}
			showArrow
			// backdrop={isHighAppearance ? 'blur' : 'opaque'}
			isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
		>
			<ItemPopoverCard.Trigger>
				<ItemCard
					isHoverable={openedPopover ? openedPopover === name : true}
					isPressable={openedPopover ? openedPopover === name : true}
					name={name}
					description={<Price>{price}</Price>}
					image={<Sprite target="beverage" name={name} size={3} />}
					onPress={() => {
						trackEvent(TrackCategory.Click, 'Beverage Card', name);
					}}
				/>
			</ItemPopoverCard.Trigger>
			<PopoverContent>
				<ItemPopoverCard.CloseButton />
				<ItemPopoverCard.ShareButton name={name} />
				<ItemPopoverCard
					target="beverage"
					name={name}
					description={{level, price}}
					dlc={dlc}
					tags={{beverage: tags}}
					tagColors={BEVERAGE_TAG_STYLE}
					ref={popoverCardRef}
				>
					{Object.entries(from).map((fromObject, fromIndex) => {
						type TFrom = Exclude<IBeverage['from'], string>;
						const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
						const isBuy = method === 'buy';
						const isTask = method === 'task';
						const probability = `概率${isBuy ? '出售' : '掉落'}`;
						const way = isBuy ? '购买' : isTask ? '任务' : '采集';
						return (
							<p key={fromIndex}>
								<span className="font-semibold">{way}：</span>
								{Array.isArray(target)
									? target.map((item, targetIndex) => (
											<Fragment key={targetIndex}>
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
												{targetIndex < target.length - 1 && '、'}
											</Fragment>
										))
									: '初始拥有'}
							</p>
						);
					})}
				</ItemPopoverCard>
			</PopoverContent>
		</Popover>
	));
});
