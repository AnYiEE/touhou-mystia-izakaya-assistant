import { Fragment } from 'react';

import { usePictureInPicture, useVibrate, useViewInNewWindow } from '@/hooks';

import { Divider } from '@heroui/divider';

import {
	Avatar,
	Card,
	FadeMotionDiv,
	type IFadeMotionDivProps,
	PopoverTrigger,
	Tooltip,
	cn,
} from '@/design/ui/components';

import SavedMealActionRail from '@/(pages)/customer-shared/savedMealActionRail';
import SavedMealIngredientsStrip from '@/(pages)/customer-shared/savedMealIngredientsStrip';
import { swapSavedMeals } from '@/(pages)/customer-shared/swapSavedMeals';
import {
	type IMoveButtonProps,
	MoveButton,
} from '@/(pages)/customer-shared/moveButton';
import RatingAvatarShell from '@/(pages)/customer-shared/ratingAvatarShell';
import { Plus } from '@/(pages)/customer-shared/resultCardAtoms';
import TagGroup from '@/(pages)/customer-shared/tagGroup';
import { trackEvent } from '@/components/analytics';
import Price from '@/components/price';
import Sprite from '@/components/sprite';
import Tags from '@/components/tags';

import {
	BEVERAGE_TAG_STYLE,
	CUSTOMER_RATING_MAP,
	DARK_MATTER_META_MAP,
	RECIPE_TAG_STYLE,
} from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';

export {
	type IMoveButtonProps,
	MoveButton,
} from '@/(pages)/customer-shared/moveButton';

export default function SavedMealCard() {
	const {
		CLASSNAME_EXCLUDE_FROM_PIP,
		PipButton,
		containerRef,
		isOpen: isPipOpen,
		isSupported: isPipSupported,
	} = usePictureInPicture({ offset: { height: -32 }, width: 560 });
	const openWindow = useViewInNewWindow();
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const savedMeals = customerStore.persistence.meals.use();
	const currentCustomerMeals =
		currentCustomerName === null
			? null
			: (savedMeals[currentCustomerName] ?? null);
	const savedCustomerMeals =
		customerStore.savedCustomerMealsWithEvaluation.use();

	const instance_recipe = customerStore.instances.recipe.get();

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (
		currentCustomerName === null ||
		currentCustomerMeals === null ||
		savedCustomerMeals === null
	) {
		content = null;
		contentTarget = 'null';
	} else {
		const moveMeal = (
			index: number,
			direction: IMoveButtonProps['direction']
		) => {
			vibrate();

			const nextIndex =
				direction === MoveButton.direction.down ? index + 1 : index - 1;
			const newData = swapSavedMeals({
				currentMeals: currentCustomerMeals,
				nextVisibleIndex: nextIndex,
				savedMeals: savedCustomerMeals,
				visibleIndex: index,
			});

			if (newData === null) {
				return;
			}

			customerStore.persistence.meals[currentCustomerName]?.set(newData);
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
				<div className="space-y-3 p-4 xl:space-y-2 xl:px-2 xl:py-3">
					{savedCustomerMeals.map(
						(
							{
								dataIndex,
								evaluation: {
									isDarkMatter,
									price,
									rating: ratingKey,
								},
								meal: {
									beverage,
									hasMystiaCooker,
									order: customerOrder,
									recipe: recipeData,
								},
							},
							loopIndex
						) => (
							<Fragment key={dataIndex}>
								<div className="relative flex flex-col items-center gap-4 md:static md:flex-row md:gap-3 lg:gap-4 xl:gap-3">
									<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap md:gap-2 lg:gap-3 xl:gap-2">
										{(() => {
											const isDarkMatterOrNormalMeal =
												isDarkMatter ||
												!hasMystiaCooker;
											const originalCooker =
												instance_recipe.getPropsByName(
													recipeData.name,
													'cooker'
												);
											const cooker =
												isDarkMatterOrNormalMeal
													? originalCooker
													: (`夜雀${originalCooker}` as const);
											const recipeName = isDarkMatter
												? DARK_MATTER_META_MAP.name
												: recipeData.name;
											const rating =
												ratingKey === null
													? '未评级'
													: CUSTOMER_RATING_MAP[
															ratingKey
														];
											const ratingColor =
												ratingKey ?? 'default';
											const beverageLabel = `点击：在新窗口中查看酒水【${beverage}】的详情`;
											const cookerLabel = `点击：在新窗口中查看厨具【${cooker}】的详情`;
											const recipeLabel = `点击：在新窗口中查看料理【${recipeName}】的详情`;
											return (
												<>
													<RatingAvatarShell
														color={ratingColor}
														content={rating}
														placement="left"
														popoverOffset={12}
														trigger={
															<span className="cursor-pointer">
																<PopoverTrigger>
																	<Avatar
																		isBordered
																		showFallback
																		color={
																			ratingColor
																		}
																		fallback={
																			<TagGroup className="h-4 flex-nowrap items-center whitespace-nowrap">
																				{price !==
																					0 && (
																					<Tags.Tag
																						tag={
																							<Price>
																								{
																									price
																								}
																							</Price>
																						}
																						tagStyle={{}}
																						className="p-0.5"
																					/>
																				)}
																				{customerOrder.recipeTag &&
																					isDarkMatterOrNormalMeal && (
																						<Tags.Tag
																							tag={
																								customerOrder.recipeTag
																							}
																							tagStyle={
																								RECIPE_TAG_STYLE.positive
																							}
																							className="p-0.5"
																						/>
																					)}
																				{customerOrder.beverageTag &&
																					isDarkMatterOrNormalMeal && (
																						<Tags.Tag
																							tag={
																								customerOrder.beverageTag
																							}
																							tagStyle={
																								BEVERAGE_TAG_STYLE.positive
																							}
																							className="p-0.5"
																						/>
																					)}
																			</TagGroup>
																		}
																		radius="sm"
																		classNames={{
																			base: 'h-5 w-44 ring-offset-0',
																		}}
																	/>
																</PopoverTrigger>
															</span>
														}
													/>
													<div className="flex items-center gap-2 xl:gap-1">
														<Tooltip
															showArrow
															content={
																cookerLabel
															}
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
														<Tooltip
															showArrow
															content={
																recipeLabel
															}
															offset={4}
														>
															<Sprite
																target="recipe"
																name={
																	recipeName
																}
																size={2}
																onPress={() => {
																	openWindow(
																		'recipes',
																		recipeName
																	);
																}}
																aria-label={
																	recipeLabel
																}
																role="button"
															/>
														</Tooltip>
														<Plus
															size={0.75}
															className="mx-2 md:mx-0 lg:mx-2 xl:mx-0"
														/>
														<Tooltip
															showArrow
															content={
																beverageLabel
															}
															offset={4}
														>
															<Sprite
																target="beverage"
																name={beverage}
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
													</div>
												</>
											);
										})()}
										<Plus
											size={0.75}
											className="md:mx-0 lg:mx-1 xl:mx-0"
										/>
										<SavedMealIngredientsStrip
											className="md:gap-x-1 lg:gap-x-3 xl:gap-x-1"
											extraIngredients={
												recipeData.extraIngredients
											}
											extraIngredientsClassName="md:gap-x-1 lg:gap-x-3 xl:gap-x-1"
											onOpenIngredient={(name) => {
												openWindow('ingredients', name);
											}}
											originalIngredients={instance_recipe.getPropsByName(
												recipeData.name,
												'ingredients'
											)}
										/>
									</div>
									<SavedMealActionRail
										className={cn(
											CLASSNAME_EXCLUDE_FROM_PIP,
											'xl:flex-col'
										)}
										isMoveDownDisabled={
											loopIndex ===
											savedCustomerMeals.length - 1
										}
										isMoveUpDisabled={loopIndex === 0}
										isReorderVisible={
											savedCustomerMeals.length > 1
										}
										onMoveDown={() => {
											moveMeal(
												loopIndex,
												MoveButton.direction.down
											);
										}}
										onMoveUp={() => {
											moveMeal(
												loopIndex,
												MoveButton.direction.up
											);
										}}
										onRemove={() => {
											vibrate();
											const newData =
												currentCustomerMeals.filter(
													(_, index) =>
														index !== dataIndex
												);
											customerStore.persistence.meals[
												currentCustomerName
											]?.set(newData);
											trackEvent(
												trackEvent.category.click,
												'Remove Button',
												`${recipeData.name} - ${beverage}${recipeData.extraIngredients.length === 0 ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
											);
										}}
										onSelect={() => {
											vibrate();
											customerStore.shared.customer.hasMystiaCooker.set(
												hasMystiaCooker
											);
											customerStore.shared.customer.order.set(
												customerOrder
											);
											customerStore.shared.beverage.name.set(
												beverage
											);
											customerStore.shared.recipe.data.set(
												recipeData
											);
											trackEvent(
												trackEvent.category.click,
												'Select Button',
												`${recipeData.name} - ${beverage}${recipeData.extraIngredients.length === 0 ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
											);
										}}
										removeButtonClassName="xl:h-6"
										reorderButtonsClassName="md:left-2 md:right-[unset] md:top-[unset] md:gap-6 xl:gap-9"
										selectButtonClassName="xl:h-6"
									/>
								</div>
								{loopIndex < savedCustomerMeals.length - 1 && (
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

	return isPipSupported ? (
		<div className="group">
			<div
				className={cn('transition-opacity', {
					'pointer-events-none opacity-0': isPipOpen,
				})}
				ref={containerRef}
			>
				<FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>
			</div>
			{content !== null && (
				<PipButton
					onOpen={() => {
						trackEvent(
							trackEvent.category.click,
							'PIP Button',
							`${currentCustomerName}`
						);
					}}
				/>
			)}
		</div>
	) : (
		<FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>
	);
}
