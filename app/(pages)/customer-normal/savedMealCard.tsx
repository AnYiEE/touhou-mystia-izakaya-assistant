import { Fragment } from 'react';

import { useVibrate, useViewInNewWindow } from '@/hooks';

import { Divider } from '@heroui/divider';

import {
	Avatar,
	Button,
	Card,
	FadeMotionDiv,
	type IFadeMotionDivProps,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import { Plus } from './resultCard';
import {
	type IMoveButtonProps,
	MoveButton,
} from '@/(pages)/customer-rare/savedMealCard';
import { trackEvent } from '@/components/analytics';
import Sprite from '@/components/sprite';

import { CUSTOMER_RATING_MAP } from '@/data';
import { customerNormalStore as customerStore, globalStore } from '@/stores';
import { checkEmpty, copyArray } from '@/utilities';

export default function SavedMealCard() {
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerPopularTrend =
		customerStore.shared.customer.popularTrend.use();
	const currentSavedMeals = customerStore.persistence.meals.use();
	const isFamousShop = customerStore.shared.customer.famousShop.use();

	const instance_recipe = customerStore.instances.recipe.get();

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (
		currentCustomerName === null ||
		currentSavedMeals[currentCustomerName] === undefined ||
		checkEmpty(currentSavedMeals[currentCustomerName])
	) {
		content = null;
		contentTarget = 'null';
	} else {
		const savedCustomerMeal = currentSavedMeals[currentCustomerName];

		const moveMeal = (
			mealIndex: number,
			direction: IMoveButtonProps['direction']
		) => {
			vibrate();

			const newSavedCustomerMeal = copyArray(savedCustomerMeal);
			const currentIndex = newSavedCustomerMeal.findIndex(
				({ index }) => index === mealIndex
			);
			type Meal = (typeof newSavedCustomerMeal)[number];

			switch (direction) {
				case MoveButton.direction.down:
					if (currentIndex >= newSavedCustomerMeal.length - 1) {
						return;
					}
					[
						newSavedCustomerMeal[currentIndex],
						newSavedCustomerMeal[currentIndex + 1],
					] = [
						newSavedCustomerMeal[currentIndex + 1] as Meal,
						newSavedCustomerMeal[currentIndex] as Meal,
					];
					break;
				case MoveButton.direction.up:
					if (currentIndex <= 0) {
						return;
					}
					[
						newSavedCustomerMeal[currentIndex],
						newSavedCustomerMeal[currentIndex - 1],
					] = [
						newSavedCustomerMeal[currentIndex - 1] as Meal,
						newSavedCustomerMeal[currentIndex] as Meal,
					];
					break;
			}

			customerStore.persistence.meals[currentCustomerName]?.set(
				newSavedCustomerMeal
			);
		};

		content = (
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
					{savedCustomerMeal.map(
						(
							{ beverage, index: mealIndex, recipe: recipeData },
							loopIndex
						) => (
							<Fragment key={loopIndex}>
								<div className="relative flex flex-col items-center gap-4 md:static md:flex-row">
									<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
										{(() => {
											const ratingKey =
												customerStore.evaluateSavedMealResult(
													{
														customerName:
															currentCustomerName,
														isFamousShop,
														popularTrend:
															currentCustomerPopularTrend,
														recipeData,
													}
												);
											const rating =
												CUSTOMER_RATING_MAP[ratingKey];
											return (
												<Popover
													showArrow
													color={ratingKey}
													offset={10}
													placement="left"
												>
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
																	color={
																		ratingKey
																	}
																	fallback={
																		<div></div>
																	}
																	radius="sm"
																	role="banner"
																	classNames={{
																		base: 'h-1 w-6 ring-offset-0 md:h-6 md:w-1',
																	}}
																/>
															</PopoverTrigger>
														</span>
													</Tooltip>
													<PopoverContent>
														{rating}
													</PopoverContent>
												</Popover>
											);
										})()}
										<div className="flex items-center gap-2">
											{(() => {
												const cooker =
													instance_recipe.getPropsByName(
														recipeData.name,
														'cooker'
													);
												const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
												return (
													<Tooltip
														showArrow
														content={cookerLabel}
														offset={8}
													>
														<Sprite
															target="cooker"
															name={cooker}
															size={1.5}
															onPress={() => {
																openWindow(
																	'cookers',
																	cooker
																);
															}}
															aria-label={
																cookerLabel
															}
															role="button"
														/>
													</Tooltip>
												);
											})()}
											{(() => {
												const recipeLabel = `点击：在新窗口中查看料理【${recipeData.name}】的详情`;
												return (
													<Tooltip
														showArrow
														content={recipeLabel}
														offset={4}
													>
														<Sprite
															target="recipe"
															name={
																recipeData.name
															}
															size={2}
															onPress={() => {
																openWindow(
																	'recipes',
																	recipeData.name
																);
															}}
															aria-label={
																recipeLabel
															}
															role="button"
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
															<Tooltip
																showArrow
																content={
																	beverageLabel
																}
																offset={4}
															>
																<Sprite
																	target="beverage"
																	name={
																		beverage
																	}
																	size={2}
																	onPress={() => {
																		openWindow(
																			'beverages',
																			beverage
																		);
																	}}
																	aria-label={
																		beverageLabel
																	}
																	role="button"
																/>
															</Tooltip>
														</>
													);
												})()}
										</div>
										<Plus size={0.75} />
										{(() => {
											const originalIngredients =
												instance_recipe.getPropsByName(
													recipeData.name,
													'ingredients'
												);
											const lestExtraIngredientsLength =
												Math.max(
													5 -
														originalIngredients.length,
													0
												);
											const lestExtraIngredients =
												recipeData.extraIngredients.slice(
													0,
													lestExtraIngredientsLength
												);
											return (
												<div className="flex items-center gap-x-3">
													{originalIngredients.map(
														(name, index) => {
															const label = `点击：在新窗口中查看食材【${name}】的详情`;
															return (
																<Tooltip
																	key={index}
																	showArrow
																	content={
																		label
																	}
																	offset={4}
																>
																	<Sprite
																		target="ingredient"
																		name={
																			name
																		}
																		size={2}
																		onPress={() => {
																			openWindow(
																				'ingredients',
																				name
																			);
																		}}
																		aria-label={
																			label
																		}
																		role="button"
																	/>
																</Tooltip>
															);
														}
													)}
													{!checkEmpty(
														lestExtraIngredients
													) && (
														<div className="flex items-center gap-x-3 rounded bg-content2/70 outline outline-2 outline-offset-1 outline-content2">
															{lestExtraIngredients.map(
																(
																	name,
																	index
																) => {
																	const label = `点击：在新窗口中查看额外食材【${name}】的详情`;
																	return (
																		<Tooltip
																			key={
																				index
																			}
																			showArrow
																			content={
																				label
																			}
																			offset={
																				4
																			}
																		>
																			<Sprite
																				target="ingredient"
																				name={
																					name
																				}
																				size={
																					2
																				}
																				onPress={() => {
																					openWindow(
																						'ingredients',
																						name
																					);
																				}}
																				aria-label={
																					label
																				}
																				role="button"
																			/>
																		</Tooltip>
																	);
																}
															)}
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
												'absolute -right-2 -top-1 flex flex-col gap-3 text-tiny text-primary/20 md:right-0.5 md:top-[unset] md:gap-5 xl:gap-4 dark:text-default-100',
												{
													hidden:
														savedCustomerMeal.length <=
														1,
												}
											)}
										>
											<MoveButton
												direction={
													MoveButton.direction.up
												}
												isDisabled={loopIndex === 0}
												onClick={() => {
													moveMeal(
														mealIndex,
														MoveButton.direction.up
													);
												}}
											/>
											<MoveButton
												direction={
													MoveButton.direction.down
												}
												isDisabled={
													loopIndex ===
													savedCustomerMeal.length - 1
												}
												onClick={() => {
													moveMeal(
														mealIndex,
														MoveButton.direction
															.down
													);
												}}
											/>
										</div>
										<Button
											fullWidth
											color="primary"
											size="sm"
											variant="flat"
											onPress={() => {
												vibrate();
												customerStore.shared.beverage.name.set(
													beverage
												);
												customerStore.shared.recipe.data.set(
													recipeData
												);
												trackEvent(
													trackEvent.category.click,
													'Select Button',
													`${recipeData.name}${beverage === null ? '' : ` - ${beverage}`}${checkEmpty(recipeData.extraIngredients) ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
												);
											}}
											className="md:w-auto"
										>
											选择
										</Button>
										<Button
											fullWidth
											color="danger"
											size="sm"
											variant="flat"
											onPress={() => {
												vibrate();
												customerStore.persistence.meals[
													currentCustomerName
												]?.set(
													savedCustomerMeal.filter(
														(meal) =>
															meal.index !==
															mealIndex
													)
												);
												trackEvent(
													trackEvent.category.click,
													'Remove Button',
													`${recipeData.name}${beverage === null ? '' : ` - ${beverage}`}${checkEmpty(recipeData.extraIngredients) ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
												);
											}}
											className="md:w-auto"
										>
											删除
										</Button>
									</div>
								</div>
								{loopIndex < savedCustomerMeal.length - 1 && (
									<Divider />
								)}
							</Fragment>
						)
					)}
				</div>
			</Card>
		);
		contentTarget = 'content';
	}

	return <FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>;
}
