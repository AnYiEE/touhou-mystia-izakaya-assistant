import {Fragment} from 'react';

import {useVibrate, useViewInNewWindow} from '@/hooks';

import {Button, Card, Divider, PopoverContent, PopoverTrigger, cn} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowDown, faArrowUp} from '@fortawesome/free-solid-svg-icons';

import {Plus} from './resultCard';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Avatar from '@/components/avatar';
import Popover from '@/components/popover';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {CUSTOMER_RATING_MAP} from '@/data';
import {customerNormalStore as customerStore, globalStore} from '@/stores';

export default function SavedMealCard() {
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentSavedMeals = customerStore.persistence.meals.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const instance_recipe = customerStore.instances.recipe.get();

	if (currentCustomerName === null) {
		return null;
	}

	if (currentSavedMeals[currentCustomerName] === undefined || currentSavedMeals[currentCustomerName].length === 0) {
		return null;
	}

	const savedCustomerMeal = currentSavedMeals[currentCustomerName];

	const moveMeal = (mealIndex: number, direction: 'down' | 'up') => {
		vibrate();

		const newSavedCustomerMeal = [...savedCustomerMeal];
		const currentIndex = newSavedCustomerMeal.findIndex(({index}) => index === mealIndex);
		type Meal = (typeof newSavedCustomerMeal)[number];

		switch (direction) {
			case 'down':
				if (currentIndex >= newSavedCustomerMeal.length - 1) {
					return;
				}
				[newSavedCustomerMeal[currentIndex], newSavedCustomerMeal[currentIndex + 1]] = [
					newSavedCustomerMeal[currentIndex + 1] as Meal,
					newSavedCustomerMeal[currentIndex] as Meal,
				];
				break;
			case 'up':
				if (currentIndex <= 0) {
					return;
				}
				[newSavedCustomerMeal[currentIndex], newSavedCustomerMeal[currentIndex - 1]] = [
					newSavedCustomerMeal[currentIndex - 1] as Meal,
					newSavedCustomerMeal[currentIndex] as Meal,
				];
				break;
		}

		customerStore.persistence.meals[currentCustomerName]?.set(newSavedCustomerMeal);
	};

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: cn({
					'bg-content1/40 backdrop-blur': isHighAppearance,
				}),
			}}
		>
			<div className="space-y-3 p-4 xl:space-y-2">
				{savedCustomerMeal.map(({beverage, extraIngredients, index: mealIndex, recipe}, loopIndex) => (
					<Fragment key={loopIndex}>
						<div className="flex flex-col items-center gap-4 md:flex-row">
							<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
								{(() => {
									const ratingKey = customerStore.evaluateSavedMealResult({
										customerName: currentCustomerName,
										extraIngredients,
										isFamousShop,
										popular: currentCustomerPopular,
										recipeName: recipe,
									});
									const rating = CUSTOMER_RATING_MAP[ratingKey];
									return (
										<Popover showArrow color={ratingKey} offset={10} placement="left">
											<Tooltip showArrow color={ratingKey} content={rating} placement="left">
												<span className="cursor-pointer">
													<PopoverTrigger>
														<Avatar
															isBordered
															showFallback
															color={ratingKey}
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
										const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
										return (
											<Tooltip showArrow content={cookerLabel} offset={8}>
												<Sprite
													target="cooker"
													name={cooker}
													size={1.5}
													onPress={() => {
														openWindow('cookers', cooker);
													}}
													aria-label={cookerLabel}
													role="button"
													tabIndex={0}
													className="cursor-pointer"
												/>
											</Tooltip>
										);
									})()}
									{(() => {
										const recipeLabel = `点击：在新窗口中查看料理【${recipe}】的详情`;
										return (
											<Tooltip showArrow content={recipeLabel} offset={4}>
												<Sprite
													target="recipe"
													name={recipe}
													size={2}
													onPress={() => {
														openWindow('recipes', recipe);
													}}
													aria-label={recipeLabel}
													role="button"
													tabIndex={0}
													className="cursor-pointer"
												/>
											</Tooltip>
										);
									})()}
									{beverage !== null &&
										(() => {
											const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;
											return (
												<>
													<Plus size={0.75} />
													<Tooltip showArrow content={beverageLabel} offset={4}>
														<Sprite
															target="beverage"
															name={beverage}
															size={2}
															onPress={() => {
																openWindow('beverages', beverage);
															}}
															aria-label={beverageLabel}
															role="button"
															tabIndex={0}
															className="cursor-pointer"
														/>
													</Tooltip>
												</>
											);
										})()}
								</div>
								<Plus size={0.75} />
								{(() => {
									const originalIngredients = instance_recipe.getPropsByName(recipe, 'ingredients');
									const lestExtraIngredientsLength = Math.max(5 - originalIngredients.length, 0);
									const lestExtraIngredients = extraIngredients.slice(0, lestExtraIngredientsLength);
									return (
										<div className="flex items-center gap-x-3">
											{originalIngredients.map((name, index) => {
												const label = `点击：在新窗口中查看食材【${name}】的详情`;
												return (
													<Tooltip key={index} showArrow content={label} offset={4}>
														<Sprite
															target="ingredient"
															name={name}
															size={2}
															onPress={() => {
																openWindow('ingredients', name);
															}}
															aria-label={label}
															role="button"
															tabIndex={0}
															className="cursor-pointer"
														/>
													</Tooltip>
												);
											})}
											{lestExtraIngredients.length > 0 && (
												<div className="flex items-center gap-x-3 rounded outline outline-2 outline-offset-1 outline-divider">
													{lestExtraIngredients.map((name, index) => {
														const label = `点击：在新窗口中查看额外食材【${name}】的详情`;
														return (
															<Tooltip key={index} showArrow content={label} offset={4}>
																<Sprite
																	target="ingredient"
																	name={name}
																	size={2}
																	onPress={() => {
																		openWindow('ingredients', name);
																	}}
																	aria-label={label}
																	role="button"
																	tabIndex={0}
																	className="cursor-pointer"
																/>
															</Tooltip>
														);
													})}
												</div>
											)}
										</div>
									);
								})()}
							</div>
							<div className="flex w-full flex-row-reverse items-center justify-center gap-2 md:w-auto">
								<div
									aria-hidden
									className={cn(
										'absolute right-2 flex flex-col gap-3 text-xs text-primary/20 md:right-1 md:gap-5 xl:gap-4 dark:text-default-100',
										{
											hidden: savedCustomerMeal.length <= 1,
										}
									)}
								>
									<Tooltip
										showArrow
										content={loopIndex === 0 ? '已是首项' : '上移此项'}
										placement="left"
										size="sm"
									>
										<FontAwesomeIcon
											icon={faArrowUp}
											size="1x"
											onClick={() => {
												moveMeal(mealIndex, 'up');
											}}
											role="button"
											className={cn(
												'cursor-pointer hover:text-primary/40 dark:hover:text-default-200',
												{
													'cursor-not-allowed hover:text-primary/20': loopIndex === 0,
												}
											)}
										/>
									</Tooltip>
									<Tooltip
										showArrow
										content={loopIndex === savedCustomerMeal.length - 1 ? '已是末项' : '下移此项'}
										placement="left"
										size="sm"
									>
										<FontAwesomeIcon
											icon={faArrowDown}
											size="1x"
											onClick={() => {
												moveMeal(mealIndex, 'down');
											}}
											role="button"
											className={cn(
												'cursor-pointer hover:text-primary/40 dark:hover:text-default-200',
												{
													'cursor-not-allowed hover:text-primary/20':
														loopIndex === savedCustomerMeal.length - 1,
												}
											)}
										/>
									</Tooltip>
								</div>
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
											`${recipe}${beverage === null ? '' : ` - ${beverage}`}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
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
											`${recipe}${beverage === null ? '' : ` - ${beverage}`}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
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
}
