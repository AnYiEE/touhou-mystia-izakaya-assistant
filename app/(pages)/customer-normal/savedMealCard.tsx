import {Fragment, forwardRef, memo} from 'react';

import {Button, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {Plus} from './resultCard';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';

import {useCustomerNormalStore} from '@/stores';

interface IProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();
		const savedMeal = store.persistence.meals.use();

		const instance_recipe = store.instances.recipe.get();

		if (!currentCustomerName || !savedMeal[currentCustomerName]?.length) {
			return null;
		}

		const savedCustomerMeal = savedMeal[currentCustomerName];

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col gap-3 p-4">
					{savedCustomerMeal.map(
						({index: mealIndex, popular, beverage, recipe, extraIngredients}, loopIndex) => (
							<Fragment key={loopIndex}>
								<div className="flex flex-col items-center gap-4 md:flex-row">
									<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
										<div className="flex items-center gap-2">
											{(() => {
												const cooker = instance_recipe.getPropsByName(recipe, 'cooker');
												return (
													<Popover showArrow offset={11}>
														<Tooltip showArrow content={cooker}>
															<span className="flex cursor-pointer">
																<PopoverTrigger>
																	<Sprite
																		target="cooker"
																		name={cooker}
																		size={1.5}
																		title=""
																	/>
																</PopoverTrigger>
															</span>
														</Tooltip>
														<PopoverContent>{cooker}</PopoverContent>
													</Popover>
												);
											})()}
											<Popover showArrow offset={8}>
												<Tooltip showArrow content={recipe} offset={4}>
													<span className="flex cursor-pointer">
														<PopoverTrigger>
															<Sprite target="recipe" name={recipe} size={2} />
														</PopoverTrigger>
													</span>
												</Tooltip>
												<PopoverContent>{recipe}</PopoverContent>
											</Popover>
											<Plus size={0.75} />
											<Popover showArrow offset={8}>
												<Tooltip showArrow content={beverage} offset={4}>
													<span className="flex cursor-pointer">
														<PopoverTrigger>
															<Sprite target="beverage" name={beverage} size={2} />
														</PopoverTrigger>
													</span>
												</Tooltip>
												<PopoverContent>{beverage}</PopoverContent>
											</Popover>
										</div>
										<Plus size={0.75} />
										{(() => {
											const originalIngredients = instance_recipe.getPropsByName(
												recipe,
												'ingredients'
											);
											const lestExtraIngredientsLength = Math.max(
												5 - originalIngredients.length,
												0
											);
											const lestExtraIngredients = extraIngredients.slice(
												0,
												lestExtraIngredientsLength
											);
											return (
												<div className="flex items-center gap-x-3 xl:gap-1">
													{originalIngredients.map((name, index) => (
														<Popover key={index} showArrow offset={8}>
															<Tooltip showArrow content={name} offset={4}>
																<span className="flex cursor-pointer">
																	<PopoverTrigger>
																		<Sprite
																			target="ingredient"
																			name={name}
																			size={2}
																		/>
																	</PopoverTrigger>
																</span>
															</Tooltip>
															<PopoverContent>{name}</PopoverContent>
														</Popover>
													))}
													{lestExtraIngredients.length > 0 && (
														<div className="flex items-center gap-x-3 rounded outline outline-2 outline-offset-1 outline-divider xl:gap-1">
															{lestExtraIngredients.map((name, index) => {
																const content = `额外食材：${name}`;
																return (
																	<Popover key={index} showArrow offset={8}>
																		<Tooltip showArrow content={content} offset={4}>
																			<span className="flex cursor-pointer">
																				<PopoverTrigger>
																					<Sprite
																						target="ingredient"
																						name={name}
																						size={2}
																					/>
																				</PopoverTrigger>
																			</span>
																		</Tooltip>
																		<PopoverContent>{content}</PopoverContent>
																	</Popover>
																);
															})}
														</div>
													)}
												</div>
											);
										})()}
									</div>
									<div className="flex w-full justify-center gap-2 md:w-auto">
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
											className="md:w-auto"
										>
											删除
										</Button>
										<Button
											color="primary"
											fullWidth
											size="sm"
											variant="flat"
											onPress={() => {
												store.shared.customer.popular.set(popular);
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
											className="md:w-auto"
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
