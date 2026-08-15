import { Divider } from '@heroui/divider';
import { cn } from '@heroui/theme';
import { Fragment, useMemo, useRef } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Avatar from '@/design/ui/components/avatar';
import Card from '@/design/ui/components/card';
import FadeMotionDiv, {
	type IFadeMotionDivProps,
} from '@/design/ui/components/fadeMotionDiv';
import { PopoverTrigger } from '@/design/ui/components/popover';
import Tooltip from '@/design/ui/components/tooltip';

import {
	BEVERAGE_TAG_MAP,
	DARK_MATTER_META_MAP,
	FOOD_TAG_MAP,
} from '@/domain/data/tags/tagFacts';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';
import { getMealCookerSeries } from '@/domain/meals/getMealCookerSeries';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import {
	type IMoveButtonProps,
	MoveButton,
} from '@/features/catalog/guests/shared/client/components/moveButton';
import RatingAvatarShell from '@/features/catalog/guests/shared/client/components/ratingAvatarShell';
import { Plus } from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import TagGroup from '@/features/catalog/guests/shared/client/components/tagGroup';
import SavedMealActionRail from '@/features/catalog/guests/shared/client/mealPlanning/savedMealActionRail';
import SavedMealIngredientsStrip from '@/features/catalog/guests/shared/client/mealPlanning/savedMealIngredientsStrip';
import { useSavedMealListKeys } from '@/features/catalog/guests/shared/client/mealPlanning/useSavedMealListKeys';
import { useSavedMealReorderAnimation } from '@/features/catalog/guests/shared/client/mealPlanning/useSavedMealReorderAnimation';
import {
	isMealFoodEqual,
	removeFirstMatchingMeal,
} from '@/features/catalog/guests/shared/mealPlanning/savedMealEquality';
import { swapSavedMeals } from '@/features/catalog/guests/shared/mealPlanning/swapSavedMeals';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import {
	BEVERAGE_TAG_STYLE,
	FOOD_TAG_STYLE,
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
} from '@/features/catalog/guests/shared/client/components/moveButton';

const RATING_AVATAR_CLASS_NAMES = { base: 'h-5 w-44 ring-offset-0' } as const;

export default function SavedMealCard() {
	const { isHighAppearance } = useDesignPreferences();
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

	const cardClassNames = useMemo(
		() => ({
			base: cn({ 'bg-content1/40 backdrop-blur': isHighAppearance }),
		}),
		[isHighAppearance]
	);

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentGuestName = specialGuestStore.currentGuestName.use();
	const savedMeals = specialGuestStore.persistence.meals.use();
	const currentGuestMeals =
		currentSpecialGuest === null
			? null
			: (savedMeals[currentSpecialGuest] ?? null);
	const savedGuestMeals =
		specialGuestStore.savedGuestMealsWithEvaluation.use();

	const { getSavedMealKey, removeSavedMealKey } = useSavedMealListKeys(
		currentSpecialGuest,
		currentGuestMeals
	);
	const pendingRemoveDataRef = useRef<
		Array<{
			meal: NonNullable<typeof currentGuestMeals>[number];
			savedMealKey: string;
		}>
	>([]);

	const beverageCatalog = specialGuestStore.instances.beverage.get();
	const foodCatalog = specialGuestStore.instances.recipe.get();
	const cookerCatalog = specialGuestStore.instances.cooker.get();
	const ingredientCatalog = specialGuestStore.instances.ingredient.get();

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (
		currentSpecialGuest === null ||
		currentGuestName === null ||
		currentGuestMeals === null ||
		savedGuestMeals === null
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
				currentMeals: currentGuestMeals,
				nextVisibleIndex: nextIndex,
				savedMeals: savedGuestMeals,
				visibleIndex: index,
			});

			if (newData === null) {
				return;
			}

			const currentEntry = savedGuestMeals[index];
			const nextEntry = savedGuestMeals[nextIndex];
			if (currentEntry === undefined || nextEntry === undefined) {
				return;
			}

			animateSavedMealSwap(currentEntry.dataIndex, nextEntry.dataIndex);

			specialGuestStore.persistence.meals[currentSpecialGuest]?.set(
				newData
			);
		};

		const removeMeal = async (
			dataIndex: number,
			savedMealKey: string,
			dividerDataIndex: number | undefined,
			nextRowDataIndex: number | undefined,
			mealToRemove: (typeof currentGuestMeals)[number],
			beverage: (typeof currentGuestMeals)[number]['beverage'],
			mealFood: (typeof currentGuestMeals)[number]['food']
		) => {
			pendingRemoveDataRef.current.push({
				meal: mealToRemove,
				savedMealKey,
			});
			vibrate();
			await animateSavedMealRemove(dataIndex, {
				collapseLayout: savedGuestMeals.length > 1,
				dividerDataIndex,
				nextRowDataIndex,
			});
			const latestGuestMeals =
				specialGuestStore.persistence.meals[
					currentSpecialGuest
				]?.get() ?? currentGuestMeals;
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
								meal.order.foodTag ===
									pendingTargetMeal.order.foodTag &&
								isMealFoodEqual(
									meal.food,
									pendingTargetMeal.food
								)
						);
					},
					latestGuestMeals
				);
				specialGuestStore.persistence.meals[currentSpecialGuest]?.set(
					newData
				);
			}
			const { food } = foodCatalog.getRecipeOwnerById(mealFood.recipeId);
			const beverageName = beverageCatalog.getPropsById(beverage, 'name');
			const extraIngredientNames = mealFood.extraIngredients.map((id) =>
				ingredientCatalog.getPropsById(id, 'name')
			);
			trackEvent(
				trackEvent.category.click,
				'Remove Button',
				`${food.name} - ${beverageName}${extraIngredientNames.length === 0 ? '' : ` - ${extraIngredientNames.join(' ')}`}`
			);
		};

		content = (
			<Card fullWidth shadow="sm" classNames={cardClassNames}>
				<div className="space-y-3 p-4 xl:space-y-2 xl:px-2 xl:py-3">
					{savedGuestMeals.map(
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
									food: mealFood,
									hasMystiaCooker,
									order: guestOrder,
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
											const cookerSeries =
												getMealCookerSeries({
													hasMystiaCooker,
													isDarkMatter,
												});
											const isDarkMatterOrNormalMeal =
												cookerSeries === 0;
											const { cookerType } =
												foodCatalog.resolveMealFood(
													mealFood
												);
											const cooker =
												cookerCatalog.getIdByTypeAndSeries(
													cookerType,
													cookerSeries
												);
											const cookerName =
												cookerCatalog.getPropsById(
													cooker,
													'name'
												);
											const { food } =
												foodCatalog.getRecipeOwnerById(
													mealFood.recipeId
												);
											const foodName = isDarkMatter
												? DARK_MATTER_META_MAP.name
												: food.name;
											const displayFood = isDarkMatter
												? foodCatalog.getPropsById(-1)
												: food;
											const beverageName =
												beverageCatalog.getPropsById(
													beverage,
													'name'
												);
											const rating =
												ratingKey === null
													? '未评级'
													: GUEST_RATING_MAP[
															ratingKey
														];
											const ratingColor =
												ratingKey ?? 'default';
											const beverageLabel = `点击：在新窗口中查看酒水【${beverageName}】的详情`;
											const cookerLabel = `点击：在新窗口中查看厨具【${cookerName}】的详情`;
											const foodLabel = `点击：在新窗口中查看料理【${foodName}】的详情`;
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
																						className="p-0.5"
																					/>
																				)}
																				{guestOrder.foodTag !==
																					null &&
																					isDarkMatterOrNormalMeal && (
																						<Tags.Tag
																							tag={
																								FOOD_TAG_MAP[
																									guestOrder
																										.foodTag
																								]
																							}
																							tagStyle={
																								FOOD_TAG_STYLE.positive
																							}
																							className="p-0.5"
																						/>
																					)}
																				{guestOrder.beverageTag !==
																					null &&
																					isDarkMatterOrNormalMeal && (
																						<Tags.Tag
																							tag={
																								BEVERAGE_TAG_MAP[
																									guestOrder
																										.beverageTag
																								]
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
																		classNames={
																			RATING_AVATAR_CLASS_NAMES
																		}
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
																recordId={
																	cooker
																}
																size={1.5}
																onPress={() => {
																	openWindow(
																		'cookers',
																		cooker,
																		cookerName
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
															content={foodLabel}
															offset={4}
														>
															<Sprite
																target="food"
																recordId={
																	displayFood.id
																}
																size={2}
																onPress={() => {
																	openWindow(
																		'foods',
																		displayFood.id,
																		foodName
																	);
																}}
																aria-label={
																	foodLabel
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
																recordId={
																	beverage
																}
																size={2}
																onPress={() => {
																	openWindow(
																		'beverages',
																		beverage,
																		beverageName
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
												mealFood.extraIngredients
											}
											extraIngredientsClassName="md:gap-x-1 lg:gap-x-3 xl:gap-x-1"
											onOpenIngredient={(ingredient) => {
												openWindow(
													'ingredients',
													ingredient,
													ingredientCatalog.getPropsById(
														ingredient,
														'name'
													)
												);
											}}
											originalIngredients={
												foodCatalog.resolveMealFood(
													mealFood
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
											savedGuestMeals.length - 1
										}
										isMoveUpDisabled={loopIndex === 0}
										isReorderVisible={
											savedGuestMeals.length > 1
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
												currentGuestMeals[dataIndex];
											if (mealToRemove === undefined) {
												return;
											}

											const dividerDataIndex =
												loopIndex <
												savedGuestMeals.length - 1
													? dataIndex
													: savedGuestMeals[
															loopIndex - 1
														]?.dataIndex;
											const nextRowDataIndex =
												loopIndex === 0
													? savedGuestMeals[1]
															?.dataIndex
													: undefined;
											void removeMeal(
												dataIndex,
												getSavedMealKey(dataIndex),
												dividerDataIndex,
												nextRowDataIndex,
												mealToRemove,
												beverage,
												mealFood
											);
										}}
										onSelect={() => {
											vibrate();
											specialGuestStore.shared.guest.hasMystiaCooker.set(
												hasMystiaCooker
											);
											specialGuestStore.shared.guest.order.set(
												guestOrder
											);
											specialGuestStore.shared.beverage.id.set(
												beverage
											);
											specialGuestStore.shared.recipe.data.set(
												mealFood
											);
											const { food } =
												foodCatalog.getRecipeOwnerById(
													mealFood.recipeId
												);
											const beverageName =
												beverageCatalog.getPropsById(
													beverage,
													'name'
												);
											const extraIngredientNames =
												mealFood.extraIngredients.map(
													(id) =>
														ingredientCatalog.getPropsById(
															id,
															'name'
														)
												);
											trackEvent(
												trackEvent.category.click,
												'Select Button',
												`${food.name} - ${beverageName}${extraIngredientNames.length === 0 ? '' : ` - ${extraIngredientNames.join(' ')}`}`
											);
										}}
										removeButtonClassName="xl:h-6"
										reorderButtonsClassName="md:left-2 md:right-[unset] md:top-[unset] md:gap-6 xl:gap-9"
										selectButtonClassName="xl:h-6"
									/>
								</div>
								{loopIndex < savedGuestMeals.length - 1 && (
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
							`${currentGuestName}`
						);
					}}
				/>
			)}
		</div>
	) : (
		<FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>
	);
}
