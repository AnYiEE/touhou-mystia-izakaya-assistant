import {Fragment, memo, useRef} from 'react';
import {isObjectLike} from 'lodash';

import {useViewInNewWindow} from '@/hooks';
import {openedPopoverParam, useOpenedFoodPopover} from '@/hooks/useOpenedFoodPopover';

import {Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {type IRecipe, RECIPE_TAG_STYLE} from '@/data';
import {type Recipe} from '@/utils';

interface IProps {
	data: Recipe['data'];
	isInNewWindow: boolean;
}

export default memo<IProps>(function Content({data, isInNewWindow}) {
	const popoverCardRef = useRef<HTMLDivElement | null>(null);
	const [openedPopover] = useOpenedFoodPopover(popoverCardRef);
	const openWindow = useViewInNewWindow();

	return (
		<>
			{data.map(
				(
					{dlc, from, name, level, price, cooker, ingredients, negativeTags, positiveTags, max, min},
					dataIndex
				) => (
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
								image={<Sprite target="recipe" name={name} size={3} />}
								onPress={() => {
									trackEvent(TrackCategory.Click, 'Recipe Card', name);
								}}
							/>
						</PopoverTrigger>
						<PopoverContent>
							<FoodPopoverCard.CloseButton isInNewWindow={isInNewWindow} param={openedPopoverParam} />
							<FoodPopoverCard.ShareButton name={name} param={openedPopoverParam} />
							<FoodPopoverCard
								target="recipe"
								name={name}
								description={{level, price}}
								dlc={dlc}
								cooker={cooker}
								ingredients={ingredients}
								tags={{negative: negativeTags, positive: positiveTags}}
								tagColors={RECIPE_TAG_STYLE}
								openWindow={openWindow}
								ref={popoverCardRef}
							>
								<p>
									<span className="font-semibold">菜谱来源：</span>
									{typeof from === 'string'
										? from
										: Object.entries(from as Exclude<IRecipe['from'], string>).map(
												([method, target], index) => (
													<Fragment key={index}>
														{method === 'self'
															? '初始拥有'
															: method === 'levelup'
																? '升级'
																: isObjectLike(target) && (
																		<>
																			<span className="pr-1">{target.name}</span>
																			Lv.{target.level - 1}
																			<span className="px-0.5">→</span>Lv.
																			{target.level}
																		</>
																	)}
													</Fragment>
												)
											)}
								</p>
								<p>
									<span className="font-semibold">烹饪时间：</span>
									{min}秒<span className="px-0.5">-</span>
									{max}秒
								</p>
							</FoodPopoverCard>
						</PopoverContent>
					</Popover>
				)
			)}
		</>
	);
});
