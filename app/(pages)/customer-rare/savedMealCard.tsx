import {Fragment, forwardRef, memo} from 'react';
import clsx from 'clsx/lite';

import {Avatar, Button, Card, Divider, Tooltip} from '@nextui-org/react';

import {Plus} from './resultCard';
import TagGroup from './tagGroup';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {customerRatingColorMap} from './constants';
import {BEVERAGE_TAG_STYLE, RECIPE_TAG_STYLE} from '@/constants';
import {useCustomerRareStore} from '@/stores';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
		const store = useCustomerRareStore();

		const currentCustomerName = store.shared.customer.data.use()?.name;
		const savedMeal = store.persistence.meals.use();

		const instance_recipe = store.instances.recipe.get();

		if (!currentCustomerName || !savedMeal[currentCustomerName]?.length) {
			return null;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-assertion
		const savedCustomerMeal = savedMeal[currentCustomerName]!;

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4 xl:gap-2 xl:px-2 xl:py-3">
					{savedCustomerMeal.map(
						(
							{
								index: mealIndex,
								hasMystiaCooker,
								order,
								popular,
								rating,
								beverage,
								recipe,
								extraIngredients,
								price,
							},
							loopIndex
						) => (
							<Fragment key={loopIndex}>
								<div className="flex flex-col items-center gap-4 md:flex-row xl:gap-3">
									<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap xl:gap-2">
										<Tooltip
											showArrow
											color={customerRatingColorMap[rating]}
											content={
												<>
													{rating}
													{popular.tag && (
														<>
															•{popular.isNegative ? '流行厌恶' : '流行喜爱'}•
															{popular.tag}
														</>
													)}
												</>
											}
											placement="left"
										>
											<Avatar
												isBordered
												showFallback
												color={customerRatingColorMap[rating]}
												fallback={
													<TagGroup className="flex-nowrap text-nowrap break-keep">
														{price !== 0 && (
															<Tags.Tag tag={`￥${price}` as never} tagStyle={{}} />
														)}
														{order.recipeTag && (
															<Tags.Tag
																tag={order.recipeTag}
																tagStyle={RECIPE_TAG_STYLE.positive}
															/>
														)}
														{order.beverageTag && (
															<Tags.Tag
																tag={order.beverageTag}
																tagStyle={BEVERAGE_TAG_STYLE.positive}
															/>
														)}
													</TagGroup>
												}
												radius="sm"
												role="banner"
												classNames={{
													base: 'h-[1.25rem] w-44 ring-offset-0',
												}}
											/>
										</Tooltip>
										<div className="flex items-center gap-2">
											<Tooltip
												showArrow
												content="此点单使用夜雀系列厨具制作"
												isDisabled={!hasMystiaCooker}
											>
												<Sprite
													target="cooker"
													name={instance_recipe.getPropsByName(recipe, 'cooker')}
													size={1.5}
													className={clsx(
														hasMystiaCooker &&
															'rounded-full ring-2 ring-warning-400 dark:ring-warning-200'
													)}
												/>
											</Tooltip>
											<Tooltip showArrow content={recipe} offset={2}>
												<Sprite target="recipe" name={recipe} size={2} />
											</Tooltip>
											<Plus size={0.75} className="mx-2 xl:m-0" />
											<Tooltip showArrow content={beverage} offset={2}>
												<Sprite target="beverage" name={beverage} size={2} />
											</Tooltip>
										</div>
										<Plus size={0.75} className="xl:m-0" />
										<div className="flex items-center gap-x-3 xl:gap-1">
											{[
												...instance_recipe.getPropsByName(recipe, 'ingredients'),
												...extraIngredients,
											]
												.slice(0, 5)
												.map((name, index) => (
													<Tooltip key={index} showArrow content={name} offset={2}>
														<Sprite target="ingredient" name={name} size={2} />
													</Tooltip>
												))}
										</div>
									</div>
									<div className="flex w-full justify-center gap-2 md:w-auto xl:flex-col-reverse">
										<Button
											color="danger"
											fullWidth
											size="sm"
											variant="flat"
											onPress={() => {
												store.persistence.meals[currentCustomerName]?.set(
													savedCustomerMeal.filter((meal) => meal.index !== mealIndex)
												);
												trackEvent(
													TrackCategory.Click,
													'Remove Button',
													`${recipe} - ${beverage}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
												);
											}}
											className="md:w-auto xl:h-6"
										>
											删除
										</Button>
										<Button
											color="primary"
											fullWidth
											size="sm"
											variant="flat"
											onPress={() => {
												store.shared.customer.hasMystiaCooker.set(hasMystiaCooker);
												store.shared.customer.order.set(order);
												store.shared.customer.popular.set(popular);
												store.shared.customer.rating.set(rating);
												store.shared.beverage.name.set(beverage);
												store.shared.recipe.data.set({
													extraIngredients,
													name: recipe,
												});
												trackEvent(
													TrackCategory.Click,
													'Select Button',
													`${recipe} - ${beverage}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
												);
											}}
											className="md:w-auto xl:h-6"
										>
											选择
										</Button>
									</div>
								</div>
								{loopIndex < savedCustomerMeal.length - 1 && <Divider />}
							</Fragment>
						)
					)}
				</div>
			</Card>
		);
	})
);
