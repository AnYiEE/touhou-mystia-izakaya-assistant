import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';

import {useOpenedItemPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import ItemCard from '@/components/itemCard';
import ItemPopoverCard from '@/components/itemPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {type IRecipe, RECIPE_TAG_STYLE} from '@/data';
// import {globalStore as store} from '@/stores';
import {type Recipe} from '@/utils';

interface IProps {
	data: Recipe['data'];
}

export default memo<IProps>(function Content({data}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedItemPopover(popoverCardRef);

	// const isShowBackgroundImage = store.persistence.backgroundImage.use();

	return data.map(
		({dlc, from, name, level, price, cooker, ingredients, negativeTags, positiveTags, max, min}, dataIndex) => (
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
						image={<Sprite target="recipe" name={name} size={3} />}
						onPress={() => {
							trackEvent(TrackCategory.Click, 'Recipe Card', name);
						}}
					/>
				</PopoverTrigger>
				<PopoverContent>
					<ItemPopoverCard.CloseButton />
					<ItemPopoverCard.ShareButton name={name} />
					<ItemPopoverCard
						target="recipe"
						name={name}
						description={{level, price}}
						dlc={dlc}
						cooker={name === '黑暗物质' ? null : cooker}
						ingredients={ingredients}
						tags={{negative: negativeTags, positive: positiveTags}}
						tagColors={RECIPE_TAG_STYLE}
						ref={popoverCardRef}
					>
						<p>
							<span className="font-semibold">食谱来源：</span>
							{typeof from === 'string'
								? from
								: Object.entries(from).map((fromObject, index) => {
										type TFrom = Exclude<IRecipe['from'], string>;
										const [method, target] = fromObject as [keyof TFrom, TFrom[keyof TFrom]];
										const isLevelUp = method === 'levelup';
										const isSelf = method === 'self';
										return (
											<Fragment key={index}>
												{isLevelUp
													? '游戏等级提升'
													: isSelf
														? '初始拥有'
														: isObjectLike(target) && (
																<>
																	<span className="pr-1">【{target.name}】羁绊</span>
																	Lv.{target.level - 1}
																	<span className="px-0.5">➞</span>Lv.
																	{target.level}
																</>
															)}
											</Fragment>
										);
									})}
						</p>
						{max !== 0 && (
							<p>
								<Popover showArrow offset={6} size="sm">
									<Tooltip showArrow content="随游戏等级提升而降低" offset={3} size="sm">
										<span className="inline-flex cursor-pointer">
											<PopoverTrigger>
												<span tabIndex={0} className="font-semibold">
													<span className="underline-dotted-offset2">烹饪时间</span>：
												</span>
											</PopoverTrigger>
										</span>
									</Tooltip>
									<PopoverContent>随游戏等级提升而降低</PopoverContent>
								</Popover>
								{max}秒<span className="px-0.5">➞</span>
								{min}秒
							</p>
						)}
					</ItemPopoverCard>
				</PopoverContent>
			</Popover>
		)
	);
});
