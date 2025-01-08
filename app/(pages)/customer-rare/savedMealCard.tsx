import {Fragment, memo} from 'react';

import {useVibrate, useViewInNewWindow} from '@/hooks';

import {Card, Divider, PopoverContent, PopoverTrigger} from '@nextui-org/react';
import {FontAwesomeIcon, type FontAwesomeIconProps} from '@fortawesome/react-fontawesome';
import {faArrowDown, faArrowUp} from '@fortawesome/free-solid-svg-icons';

import {cn} from '@/design/ui/components';

import {Plus} from './resultCard';
import TagGroup from './tagGroup';
import {trackEvent} from '@/components/analytics';
import Avatar from '@/components/avatar';
import Button from '@/components/button';
import Popover from '@/components/popover';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';
import Tooltip from '@/components/tooltip';

import {BEVERAGE_TAG_STYLE, CUSTOMER_RATING_MAP, DARK_MATTER_NAME, RECIPE_TAG_STYLE} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';

enum MoveButtonDirection {
	Down,
	Up,
}

export interface IMoveButtonProps extends Pick<FontAwesomeIconProps, 'onClick'> {
	direction: MoveButtonDirection;
	isDisabled: boolean;
}

const MoveButtonComponent = memo<IMoveButtonProps>(function MoveButton({direction, isDisabled, onClick}) {
	return (
		<Tooltip
			showArrow
			content={
				direction === MoveButtonDirection.Down
					? isDisabled
						? '已是末项'
						: '下移此项'
					: isDisabled
						? '已是首项'
						: '上移此项'
			}
			placement="left"
			size="sm"
		>
			<FontAwesomeIcon
				icon={direction === MoveButtonDirection.Down ? faArrowDown : faArrowUp}
				size="1x"
				onClick={onClick}
				role="button"
				className={cn('cursor-pointer transition-colors hover:text-primary/40 dark:hover:text-default-200', {
					'cursor-not-allowed hover:text-primary/20': isDisabled,
				})}
			/>
		</Tooltip>
	);
});

export const MoveButton = MoveButtonComponent as typeof MoveButtonComponent & {
	direction: typeof MoveButtonDirection;
};

MoveButton.direction = MoveButtonDirection;

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

	const moveMeal = (mealIndex: number, direction: IMoveButtonProps['direction']) => {
		vibrate();

		const newSavedCustomerMeal = [...savedCustomerMeal];
		const currentIndex = newSavedCustomerMeal.findIndex(({index}) => index === mealIndex);
		type Meal = (typeof newSavedCustomerMeal)[number];

		switch (direction) {
			case MoveButton.direction.Down:
				if (currentIndex >= newSavedCustomerMeal.length - 1) {
					return;
				}
				[newSavedCustomerMeal[currentIndex], newSavedCustomerMeal[currentIndex + 1]] = [
					newSavedCustomerMeal[currentIndex + 1] as Meal,
					newSavedCustomerMeal[currentIndex] as Meal,
				];
				break;
			case MoveButton.direction.Up:
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
			<div className="space-y-3 p-4 xl:space-y-2 xl:px-2 xl:py-3">
				{savedCustomerMeal.map(
					({beverage, extraIngredients, hasMystiaCooker, index: mealIndex, order, recipe}, loopIndex) => (
						<Fragment key={loopIndex}>
							<div className="flex flex-col items-center gap-4 md:flex-row md:gap-3 lg:gap-4 xl:gap-3">
								<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap md:gap-2 lg:gap-3 xl:gap-2">
									{(() => {
										const {
											isDarkMatter,
											price,
											rating: ratingKey,
										} = customerStore.evaluateSavedMealResult({
											beverageName: beverage,
											customerName: currentCustomerName,
											extraIngredients,
											hasMystiaCooker,
											isFamousShop,
											order,
											popular: currentCustomerPopular,
											recipeName: recipe,
										});
										const isDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
										const originalCooker = instance_recipe.getPropsByName(recipe, 'cooker');
										const cooker = isDarkMatterOrNormalMeal
											? originalCooker
											: (`夜雀${originalCooker}` as const);
										const recipeName = isDarkMatter ? DARK_MATTER_NAME : recipe;
										const rating = CUSTOMER_RATING_MAP[ratingKey];
										const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;
										const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
										const recipeLabel = `点击：在新窗口中查看料理【${recipeName}】的详情`;
										return (
											<>
												<Popover showArrow color={ratingKey} offset={12} placement="left">
													<Tooltip
														showArrow
														color={ratingKey}
														content={rating}
														placement="left"
													>
														<span className="cursor-pointer">
															<PopoverTrigger>
																<Avatar
																	isBordered
																	showFallback
																	color={ratingKey}
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
																					className="p-0.5"
																				/>
																			)}
																			{order.recipeTag &&
																				isDarkMatterOrNormalMeal && (
																					<Tags.Tag
																						tag={order.recipeTag}
																						tagStyle={
																							RECIPE_TAG_STYLE.positive
																						}
																						className="p-0.5"
																					/>
																				)}
																			{order.beverageTag &&
																				isDarkMatterOrNormalMeal && (
																					<Tags.Tag
																						tag={order.beverageTag}
																						tagStyle={
																							BEVERAGE_TAG_STYLE.positive
																						}
																						className="p-0.5"
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
														/>
													</Tooltip>
													<Tooltip showArrow content={recipeLabel} offset={4}>
														<Sprite
															target="recipe"
															name={recipeName}
															size={2}
															onPress={() => {
																openWindow('recipes', recipeName);
															}}
															aria-label={recipeLabel}
															role="button"
														/>
													</Tooltip>
													<Plus size={0.75} className="mx-2 md:mx-0 lg:mx-2 xl:mx-0" />
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
														/>
													</Tooltip>
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
															/>
														</Tooltip>
													);
												})}
												{lestExtraIngredients.length > 0 && (
													<div className="flex items-center gap-x-3 rounded bg-default-100/50 outline outline-2 outline-offset-1 outline-default-100 md:gap-x-1 lg:gap-x-3 xl:gap-x-1 dark:bg-default-200/50 dark:outline-default-200">
														{lestExtraIngredients.map((name, index) => {
															const label = `点击：在新窗口中查看额外食材【${name}】的详情`;
															return (
																<Tooltip
																	key={index}
																	showArrow
																	content={label}
																	offset={4}
																>
																	<Sprite
																		target="ingredient"
																		name={name}
																		size={2}
																		onPress={() => {
																			openWindow('ingredients', name);
																		}}
																		aria-label={label}
																		role="button"
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
								<div className="flex w-full flex-row-reverse items-center justify-center gap-2 md:w-auto xl:flex-col">
									<div
										aria-hidden
										className={cn(
											'absolute right-2 flex flex-col gap-3 text-tiny text-primary/20 md:left-2 md:right-[unset] md:gap-6 xl:gap-9 dark:text-default-100',
											{
												hidden: savedCustomerMeal.length <= 1,
											}
										)}
									>
										<MoveButton
											direction={MoveButton.direction.Up}
											isDisabled={loopIndex === 0}
											onClick={() => {
												moveMeal(mealIndex, MoveButton.direction.Up);
											}}
										/>
										<MoveButton
											direction={MoveButton.direction.Down}
											isDisabled={loopIndex === savedCustomerMeal.length - 1}
											onClick={() => {
												moveMeal(mealIndex, MoveButton.direction.Down);
											}}
										/>
									</div>
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
												trackEvent.category.Click,
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
												trackEvent.category.Click,
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
}
