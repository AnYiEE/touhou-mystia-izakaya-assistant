import {Fragment, memo} from 'react';

import {useOpenedFoodPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';

import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Sprite from '@/components/sprite';

import {RECIPE_TAG_STYLE} from '@/constants';
import {type IRecipe} from '@/data';
import type {TRecipeInstance} from '@/methods/food/types';

interface IProps {
	data: TRecipeInstance['data'];
}

export default memo(function Content({data}: IProps) {
	const openedPopoverParam = 'select';
	const [openedPopover] = useOpenedFoodPopover(openedPopoverParam);

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
								description={`￥${price}`}
								image={<Sprite target="recipe" name={name} size={3} />}
							/>
						</PopoverTrigger>
						<PopoverContent>
							<FoodPopoverCard.CloseButton param={openedPopoverParam} />
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
																: typeof target === 'object' && (
																		<>
																			<span className="pr-1">{target.name}</span>
																			Lv.{target.level - 1}
																			<span className="px-1">→</span>Lv.
																			{target.level}
																		</>
																	)}
													</Fragment>
												)
											)}
								</p>
								<p>
									<span className="font-semibold">烹饪时间：</span>
									{min}秒<span className="px-1">-</span>
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
