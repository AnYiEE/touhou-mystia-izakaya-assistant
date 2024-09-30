import {Fragment, forwardRef} from 'react';
import {twJoin} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Button, Card, Divider, PopoverContent, PopoverTrigger} from '@nextui-org/react';

import {Plus} from './resultCard';
import TagGroup from './tagGroup';
import Popover from '@/components/popover';
import Price from '@/components/price';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';
import Tooltip from '@/components/tooltip';

import {customerRatingColorMap} from './constants';
import {BEVERAGE_TAG_STYLE, DARK_MATTER_NAME, RECIPE_TAG_STYLE} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';

interface IProps {}

export default forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerData = customerStore.shared.customer.data.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentSavedMeals = customerStore.persistence.meals.use();

	const instance_recipe = customerStore.instances.recipe.get();

	if (currentCustomerData === null) {
		return null;
	}

	const {name: currentCustomerName} = currentCustomerData;

	if (currentSavedMeals[currentCustomerName] === undefined || currentSavedMeals[currentCustomerName].length === 0) {
		return null;
	}

	const savedCustomerMeal = currentSavedMeals[currentCustomerName];

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: twJoin(isHighAppearance && 'bg-content1/40 backdrop-blur'),
			}}
			ref={ref}
		>
			<div className="space-y-3 p-4 xl:space-y-2 xl:px-2 xl:py-3">
				{savedCustomerMeal.map(
					({index: mealIndex, hasMystiaCooker, order, beverage, recipe, extraIngredients}, loopIndex) => (
						<Fragment key={loopIndex}>
							<div className="flex flex-col items-center gap-4 md:flex-row md:gap-3 lg:gap-4 xl:gap-3">
								<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap md:gap-2 lg:gap-3 xl:gap-2">
									{(() => {
										const {isDarkMatter, price, rating} = customerStore.evaluateSavedMealResult({
											beverageName: beverage,
											extraIngredients,
											hasMystiaCooker,
											order,
											popular: currentCustomerPopular,
											recipeName: recipe,
										});
										const isisDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
										const originalCooker = instance_recipe.getPropsByName(recipe, 'cooker');
										const cooker = isisDarkMatterOrNormalMeal
											? originalCooker
											: (`夜雀${originalCooker}` as const);
										const recipeName = isDarkMatter ? DARK_MATTER_NAME : recipe;
										const customerRatingColor = customerRatingColorMap[rating];
										return (
											<>
												<Popover
													showArrow
													color={customerRatingColor}
													offset={13}
													placement="left"
												>
													<Tooltip
														showArrow
														color={customerRatingColor}
														content={rating}
														placement="left"
													>
														<span className="cursor-pointer">
															<PopoverTrigger>
																<Avatar
																	isBordered
																	showFallback
																	color={customerRatingColor}
																	fallback={
																		<TagGroup className="h-4 flex-nowrap items-center whitespace-nowrap">
																			{price !== 0 && (
																				<Tags.Tag
																					tag={
																						(
																							<Price>{price}</Price>
																						) as never
																					}
																					tagStyle={{}}
																					className="p-0.5 leading-none"
																				/>
																			)}
																			{order.recipeTag &&
																				isisDarkMatterOrNormalMeal && (
																					<Tags.Tag
																						tag={order.recipeTag}
																						tagStyle={
																							RECIPE_TAG_STYLE.positive
																						}
																						className="p-0.5 leading-none"
																					/>
																				)}
																			{order.beverageTag &&
																				isisDarkMatterOrNormalMeal && (
																					<Tags.Tag
																						tag={order.beverageTag}
																						tagStyle={
																							BEVERAGE_TAG_STYLE.positive
																						}
																						className="p-0.5 leading-none"
																					/>
																				)}
																		</TagGroup>
																	}
																	radius="sm"
																	role="banner"
																	classNames={{
																		base: 'h-5 w-44 ring-offset-0',
																	}}
																/>
															</PopoverTrigger>
														</span>
													</Tooltip>
													<PopoverContent>{rating}</PopoverContent>
												</Popover>
												<div className="flex items-center gap-2 xl:gap-1">
													<Popover showArrow offset={11}>
														<Tooltip showArrow content={cooker}>
															<span className="flex cursor-pointer">
																<PopoverTrigger>
																	<Sprite target="cooker" name={cooker} size={1.5} />
																</PopoverTrigger>
															</span>
														</Tooltip>
														<PopoverContent>{cooker}</PopoverContent>
													</Popover>
													<Popover showArrow offset={8}>
														<Tooltip showArrow content={recipeName} offset={4}>
															<span className="flex cursor-pointer">
																<PopoverTrigger>
																	<Sprite
																		target="recipe"
																		name={recipeName}
																		size={2}
																	/>
																</PopoverTrigger>
															</span>
														</Tooltip>
														<PopoverContent>{recipeName}</PopoverContent>
													</Popover>
													<Plus size={0.75} className="mx-2 md:mx-0 lg:mx-2 xl:mx-0" />
													<Popover showArrow offset={8}>
														<Tooltip showArrow content={beverage} offset={4}>
															<span className="flex cursor-pointer">
																<PopoverTrigger>
																	<Sprite
																		target="beverage"
																		name={beverage}
																		size={2}
																	/>
																</PopoverTrigger>
															</span>
														</Tooltip>
														<PopoverContent>{beverage}</PopoverContent>
													</Popover>
												</div>
											</>
										);
									})()}
									<Plus size={0.75} className="md:mx-0 lg:mx-1 xl:mx-0" />
									{(() => {
										const originalIngredients = instance_recipe.getPropsByName(
											recipe,
											'ingredients'
										);
										const lestExtraIngredientsLength = Math.max(5 - originalIngredients.length, 0);
										const lestExtraIngredients = extraIngredients.slice(
											0,
											lestExtraIngredientsLength
										);
										return (
											<div className="flex items-center gap-x-3 md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
												{originalIngredients.map((name, index) => (
													<Popover key={index} showArrow offset={8}>
														<Tooltip showArrow content={name} offset={4}>
															<span className="flex cursor-pointer">
																<PopoverTrigger>
																	<Sprite target="ingredient" name={name} size={2} />
																</PopoverTrigger>
															</span>
														</Tooltip>
														<PopoverContent>{name}</PopoverContent>
													</Popover>
												))}
												{lestExtraIngredients.length > 0 && (
													<div className="flex items-center gap-x-3 rounded outline outline-2 outline-offset-1 outline-divider md:gap-x-1 lg:gap-x-3 xl:gap-x-1">
														{lestExtraIngredients.map((name, index) => {
															const content = `额外食材【${name}】`;
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
								<div className="flex w-full flex-row-reverse justify-center gap-2 md:w-auto xl:flex-col">
									<Button
										color="primary"
										size="sm"
										variant="flat"
										onPress={() => {
											vibrate();
											customerStore.shared.customer.hasMystiaCooker.set(hasMystiaCooker);
											customerStore.shared.customer.order.set(order);
											customerStore.shared.beverage.name.set(beverage);
											customerStore.shared.recipe.data.set({
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
									<Button
										color="danger"
										size="sm"
										variant="flat"
										onPress={() => {
											vibrate();
											customerStore.persistence.meals[currentCustomerName]?.set(
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
								</div>
							</div>
							{loopIndex < savedCustomerMeal.length - 1 && <Divider />}
						</Fragment>
					)
				)}
			</div>
		</Card>
	);
});
