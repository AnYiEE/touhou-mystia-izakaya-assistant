import {Fragment, memo} from 'react';

import {useOpenedFoodPopover} from '@/hooks';

import {Popover, PopoverContent, PopoverTrigger} from '@nextui-org/react';

import FoodCard from '@/components/foodCard';
import FoodPopoverCard from '@/components/foodPopoverCard';
import Sprite from '@/components/sprite';

import {RECIPE_TAG_STYLE} from '@/constants';
import {type IRecipe} from '@/data';
import {type instances} from '@/methods';

interface IProps {
	data: typeof instances.food.recipe.data;
}

export default memo(function Content({data}: IProps) {
	const openedPopoverParam = 'select' as const;
	const [openedPopover] = useOpenedFoodPopover(openedPopoverParam);

	return (
		<>
			{data.map(({dlc, from, name, level, price, kitchenware, positive, negative, ingredients}, index) => {
				const levelString = `Lv.${level}`;
				const priceString = `￥${price}`;

				return (
					<Popover
						key={index}
						backdrop="opaque"
						showArrow
						isOpen={openedPopover ? openedPopover === name : (undefined as unknown as boolean)}
					>
						<PopoverTrigger className="w-full">
							<FoodCard
								isHoverable
								isPressable
								name={name}
								description={priceString}
								image={<Sprite target="recipe" name={name} size={3} />}
							/>
						</PopoverTrigger>
						<PopoverContent>
							<FoodPopoverCard.CloseButton param={openedPopoverParam} />
							<FoodPopoverCard.ShareButton name={name} param={openedPopoverParam} />
							<FoodPopoverCard
								target="recipe"
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
								kitchenware={kitchenware}
								ingredients={ingredients}
								tags={{positive, negative}}
								tagColors={RECIPE_TAG_STYLE}
							>
								<div>
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
																			Lv.{target.level}
																			<span className="px-1">→</span>Lv.
																			{target.level + 1}
																		</>
																	)}
													</Fragment>
												)
											)}
								</div>
							</FoodPopoverCard>
						</PopoverContent>
					</Popover>
				);
			})}
		</>
	);
});
