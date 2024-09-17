import {Fragment, memo, useRef} from 'react';

import {useOpenedItemPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

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
			<PopoverTrigger>
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
			</PopoverTrigger>
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
					{Object.entries(from as IIngredient['from']).map(([method, target], fromIndex) => {
						const probability = `概率${method === 'buy' ? '出售' : '掉落'}`;
						const way =
							method === 'buy'
								? '购买'
								: method === 'fishing'
									? '钓鱼'
									: method === 'task'
										? '任务'
										: '采集';

						return (
							<p key={fromIndex}>
								{way === '钓鱼' ? (
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
								{target.map((item, index) => (
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
