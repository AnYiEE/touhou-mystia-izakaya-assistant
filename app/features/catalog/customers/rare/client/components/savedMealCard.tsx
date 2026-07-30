import { Divider } from '@heroui/divider';
import { cn } from '@heroui/theme';
import { Fragment, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Avatar from '@/design/ui/components/avatar';
import Card from '@/design/ui/components/card';
import FadeMotionDiv, {
	type IFadeMotionDivProps,
} from '@/design/ui/components/fadeMotionDiv';
import { PopoverTrigger } from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import { CUSTOMER_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import {
	type IMoveButtonProps,
	MoveButton,
} from '@/features/catalog/customers/shared/client/components/moveButton';
import RatingAvatarShell from '@/features/catalog/customers/shared/client/components/ratingAvatarShell';
import { Plus } from '@/features/catalog/customers/shared/client/components/resultCardAtoms';
import TagGroup from '@/features/catalog/customers/shared/client/components/tagGroup';
import SavedMealActionRail from '@/features/catalog/customers/shared/client/mealPlanning/savedMealActionRail';
import SavedMealIngredientsStrip from '@/features/catalog/customers/shared/client/mealPlanning/savedMealIngredientsStrip';
import { useSavedMealListKeys } from '@/features/catalog/customers/shared/client/mealPlanning/useSavedMealListKeys';
import { useSavedMealReorderAnimation } from '@/features/catalog/customers/shared/client/mealPlanning/useSavedMealReorderAnimation';
import {
	isMealRecipeEqual,
	removeFirstMatchingMeal,
} from '@/features/catalog/customers/shared/mealPlanning/savedMealEquality';
import { swapSavedMeals } from '@/features/catalog/customers/shared/mealPlanning/swapSavedMeals';
import {
	BEVERAGE_TAG_STYLE,
	RECIPE_TAG_STYLE,
} from '@/features/catalog/presentation/tagStyles';
import Price from '@/features/catalog/shared/client/components/Price';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import Tags from '@/features/catalog/shared/client/components/Tags';
import { usePictureInPicture } from '@/features/itemSharing/client/hooks/usePictureInPicture';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { useVibrate } from '@/features/preferences/client/useVibrate';

export {
	type IMoveButtonProps,
	MoveButton,
} from '@/features/catalog/customers/shared/client/components/moveButton';

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

	const {
		animateSavedMealRemove,
		animateSavedMealSwap,
		registerSavedMealContent,
		registerSavedMealRow,
	} = useSavedMealReorderAnimation();

	const { isHighAppearance } = useDesignPreferences();

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const savedMeals = customerRareStore.persistence.meals.use();
	const currentCustomerMeals =
		currentCustomerName === null
			? null
			: (savedMeals[currentCustomerName] ?? null);
	const savedCustomerMeals =
		customerRareStore.savedCustomerMealsWithEvaluation.use();

	const { getSavedMealKey, removeSavedMealKey } = useSavedMealListKeys(
		currentCustomerName,
		currentCustomerMeals
	);
	const pendingRemoveDataRef = useRef<
		Array<{
			meal: NonNullable<typeof currentCustomerMeals>[number];
			savedMealKey: string;
		}>
	>([]);

	const instance_recipe = customerRareStore.instances.recipe.get();

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

			const currentEntry = savedCustomerMeals[index];
			const nextEntry = savedCustomerMeals[nextIndex];
			if (currentEntry === undefined || nextEntry === undefined) {
				return;
			}

			animateSavedMealSwap(currentEntry.dataIndex, nextEntry.dataIndex);

			customerRareStore.persistence.meals[currentCustomerName]?.set(
				newData
			);
		};

		const removeMeal = async (
			dataIndex: number,
			savedMealKey: string,
			dividerDataIndex: number | undefined,
			nextRowDataIndex: number | undefined,
			mealToRemove: (typeof currentCustomerMeals)[number],
			beverage: (typeof currentCustomerMeals)[number]['beverage'],
			recipeData: (typeof currentCustomerMeals)[number]['recipe']
		) => {
			pendingRemoveDataRef.current.push({
				meal: mealToRemove,
				savedMealKey,
			});
			vibrate();
			await animateSavedMealRemove(dataIndex, {
				collapseLayout: savedCustomerMeals.length > 1,
				dividerDataIndex,
				nextRowDataIndex,
			});
			const latestCustomerMeals =
				customerRareStore.persistence.meals[
					currentCustomerName
				]?.get() ?? currentCustomerMeals;
			const pendingRemoveData = pendingRemoveDataRef.current.splice(0);
			if (pendingRemoveData.length > 0) {
				const newData = pendingRemoveData.reduce(
					(meals, { meal: targetMeal, savedMealKey: pendingKey }) => {
						removeSavedMealKey(pendingKey);
						return removeFirstMatchingMeal(
							meals,
							targetMeal,
							(meal, pendingTargetMeal) =>
								meal.beverage === pendingTargetMeal.beverage &&
								meal.hasMystiaCooker ===
									pendingTargetMeal.hasMystiaCooker &&
								meal.order.beverageTag ===
									pendingTargetMeal.order.beverageTag &&
								meal.order.recipeTag ===
									pendingTargetMeal.order.recipeTag &&
								isMealRecipeEqual(
									meal.recipe,
									pendingTargetMeal.recipe
								)
						);
					},
					latestCustomerMeals
				);
				customerRareStore.persistence.meals[currentCustomerName]?.set(
					newData
				);
			}
			trackEvent(
				trackEvent.category.click,
				'Remove Button',
				`${recipeData.name} - ${beverage}${recipeData.extraIngredients.length === 0 ? '' : ` - ${recipeData.extraIngredients.join(' ')}`}`
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
							<Fragment key={getSavedMealKey(dataIndex)}>
								<div
									ref={registerSavedMealRow(dataIndex)}
									className="relative flex flex-col items-center gap-4 md:static md:flex-row md:gap-3 lg:gap-4 xl:gap-3"
								>
									<div
										ref={registerSavedMealContent(
											dataIndex
										)}
										className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap md:gap-2 lg:gap-3 xl:gap-2"
									>
										{(() => {
											const isDarkMatterOrNormalMeal =
												isDarkMatter ||
												!hasMystiaCooker;
											const originalCooker =
												instance_recipe.resolveMealRecipe(
													recipeData
												).cooker;
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
											originalIngredients={
												instance_recipe.resolveMealRecipe(
													recipeData
												).baseIngredients
											}
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
											const mealToRemove =
												currentCustomerMeals[dataIndex];
											if (mealToRemove === undefined) {
												return;
											}

											const dividerDataIndex =
												loopIndex <
												savedCustomerMeals.length - 1
													? dataIndex
													: savedCustomerMeals[
															loopIndex - 1
														]?.dataIndex;
											const nextRowDataIndex =
												loopIndex === 0
													? savedCustomerMeals[1]
															?.dataIndex
													: undefined;
											void removeMeal(
												dataIndex,
												getSavedMealKey(dataIndex),
												dividerDataIndex,
												nextRowDataIndex,
												mealToRemove,
												beverage,
												recipeData
											);
										}}
										onSelect={() => {
											vibrate();
											customerRareStore.shared.customer.hasMystiaCooker.set(
												hasMystiaCooker
											);
											customerRareStore.shared.customer.order.set(
												customerOrder
											);
											customerRareStore.shared.beverage.name.set(
												beverage
											);
											customerRareStore.shared.recipe.data.set(
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
