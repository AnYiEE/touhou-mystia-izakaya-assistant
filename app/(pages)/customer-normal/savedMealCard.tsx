import {Fragment, forwardRef} from 'react';
import {twJoin} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Avatar, Button, Card, Divider, Popover, PopoverContent, PopoverTrigger, Tooltip} from '@nextui-org/react';

import {Plus} from './resultCard';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';

import {customerRatingColorMap} from './constants';
import {customerNormalStore as customerStore, globalStore} from '@/stores';

interface IProps {}

export default forwardRef<HTMLDivElement | null, IProps>(function SavedMealCard(_props, ref) {
	const vibrate = useVibrate();

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentSavedMeals = customerStore.persistence.meals.use();

	const instance_recipe = customerStore.instances.recipe.get();

	if (!currentCustomerName || !currentSavedMeals[currentCustomerName]?.length) {
		return null;
	}

	const savedCustomerMeal = currentSavedMeals[currentCustomerName];

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: twJoin(isShowBackgroundImage && 'bg-content1/40 backdrop-blur'),
			}}
			ref={ref}
		>
			<div className="space-y-3 p-4 xl:space-y-2">
				{savedCustomerMeal.map(({index: mealIndex, beverage, recipe, extraIngredients}, loopIndex) => (
					<Fragment key={loopIndex}>
						<div className="flex flex-col items-center gap-4 md:flex-row">
							<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
								{(() => {
									const rating = customerStore.evaluateSavedMealResult({
										beverageName: beverage,
										customerName: currentCustomerName,
										extraIngredients,
										popular: currentCustomerPopular,
										recipeName: recipe,
									});
									const customerRatingColor = customerRatingColorMap[rating];
									return (
										<Popover showArrow color={customerRatingColor} offset={10} placement="left">
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
															fallback={<div></div>}
															radius="sm"
															role="banner"
															classNames={{
																base: 'h-1 w-6 ring-offset-0 md:h-6 md:w-1',
															}}
														/>
													</PopoverTrigger>
												</span>
											</Tooltip>
											<PopoverContent>{rating}</PopoverContent>
										</Popover>
									);
								})()}
								<div className="flex items-center gap-2">
									{(() => {
										const cooker = instance_recipe.getPropsByName(recipe, 'cooker');
										return (
											<Popover showArrow offset={11}>
												<Tooltip showArrow content={cooker}>
													<span className="flex cursor-pointer">
														<PopoverTrigger>
															<Sprite target="cooker" name={cooker} size={1.5} title="" />
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
									const originalIngredients = instance_recipe.getPropsByName(recipe, 'ingredients');
									const lestExtraIngredientsLength = Math.max(5 - originalIngredients.length, 0);
									const lestExtraIngredients = extraIngredients.slice(0, lestExtraIngredientsLength);
									return (
										<div className="flex items-center gap-x-3">
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
												<div className="flex items-center gap-x-3 rounded outline outline-2 outline-offset-1 outline-divider">
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
							<div className="flex w-full flex-row-reverse justify-center gap-2 md:w-auto">
								<Button
									color="primary"
									size="sm"
									variant="flat"
									onPress={() => {
										vibrate();
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
									className="md:w-auto"
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
									className="md:w-auto"
								>
									删除
								</Button>
							</div>
						</div>
						{loopIndex < savedCustomerMeal.length - 1 && <Divider />}
					</Fragment>
				))}
			</div>
		</Card>
	);
});
