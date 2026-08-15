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

import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';

import { trackEvent } from '@/features/analytics/client/trackEvent';
import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import {
	type IMoveButtonProps,
	MoveButton,
} from '@/features/catalog/guests/shared/client/components/moveButton';
import RatingAvatarShell from '@/features/catalog/guests/shared/client/components/ratingAvatarShell';
import { Plus } from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import SavedMealActionRail from '@/features/catalog/guests/shared/client/mealPlanning/savedMealActionRail';
import SavedMealIngredientsStrip from '@/features/catalog/guests/shared/client/mealPlanning/savedMealIngredientsStrip';
import { useSavedMealListKeys } from '@/features/catalog/guests/shared/client/mealPlanning/useSavedMealListKeys';
import { useSavedMealReorderAnimation } from '@/features/catalog/guests/shared/client/mealPlanning/useSavedMealReorderAnimation';
import {
	isMealFoodEqual,
	removeFirstMatchingMeal,
} from '@/features/catalog/guests/shared/mealPlanning/savedMealEquality';
import { swapSavedMeals } from '@/features/catalog/guests/shared/mealPlanning/swapSavedMeals';
import Sprite from '@/features/catalog/shared/client/components/Sprite';
import { usePictureInPicture } from '@/features/itemSharing/client/hooks/usePictureInPicture';
import { useViewInNewWindow } from '@/features/itemSharing/client/hooks/useViewInNewWindow';
import { useVibrate } from '@/features/preferences/client/useVibrate';

const cookerCatalog = CookerCatalog.getInstance();
const RATING_AVATAR_CLASS_NAMES = {
	base: 'h-1 w-6 ring-offset-0 md:h-6 md:w-1',
} as const;

export default function NormalGuestSavedMealCard() {
	const { isHighAppearance } = useDesignPreferences();
	const {
		CLASSNAME_EXCLUDE_FROM_PIP,
		PipButton,
		containerRef,
		isOpen: isPipOpen,
		isSupported: isPipSupported,
	} = usePictureInPicture({ offset: { height: 32 }, width: 468 });
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

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();
	const savedMeals = normalGuestStore.persistence.meals.use();
	const currentGuestMeals =
		currentNormalGuest === null
			? null
			: (savedMeals[currentNormalGuest] ?? null);
	const savedGuestMeals =
		normalGuestStore.savedGuestMealsWithEvaluation.use();

	const { getSavedMealKey, removeSavedMealKey } = useSavedMealListKeys(
		currentNormalGuest,
		currentGuestMeals
	);
	const pendingRemoveDataRef = useRef<
		Array<{
			meal: NonNullable<typeof currentGuestMeals>[number];
			savedMealKey: string;
		}>
	>([]);

	const foodCatalog = normalGuestStore.instances.recipe.get();
	const beverageCatalog = normalGuestStore.instances.beverage.get();
	const normalGuestCatalog = normalGuestStore.instances.guest.get();
	const ingredientCatalog = normalGuestStore.instances.ingredient.get();
	const currentGuestName =
		currentNormalGuest === null
			? null
			: normalGuestCatalog.getPropsById(currentNormalGuest, 'name');

	let content: IFadeMotionDivProps['children'];
	let contentTarget: IFadeMotionDivProps['target'];

	if (
		currentNormalGuest === null ||
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

			normalGuestStore.persistence.meals[currentNormalGuest]?.set(
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
			foodData: (typeof currentGuestMeals)[number]['food']
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
				normalGuestStore.persistence.meals[currentNormalGuest]?.get() ??
				currentGuestMeals;
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
								isMealFoodEqual(
									meal.food,
									pendingTargetMeal.food
								)
						);
					},
					latestGuestMeals
				);
				normalGuestStore.persistence.meals[currentNormalGuest]?.set(
					newData
				);
			}
			const foodName = foodCatalog.getRecipeOwnerById(foodData.recipeId)
				.food.name;
			const beverageName =
				beverage === null
					? null
					: beverageCatalog.getPropsById(beverage, 'name');
			const extraIngredientNames = foodData.extraIngredients.map(
				(ingredient) =>
					ingredientCatalog.getPropsById(ingredient, 'name')
			);
			trackEvent(
				trackEvent.category.click,
				'Remove Button',
				`${foodName}${beverageName === null ? '' : ` - ${beverageName}`}${extraIngredientNames.length === 0 ? '' : ` - ${extraIngredientNames.join(' ')}`}`
			);
		};

		content = (
			<Card fullWidth shadow="sm" classNames={cardClassNames}>
				<div className="space-y-3 p-4 xl:space-y-2">
					{savedGuestMeals.map(
						(
							{
								dataIndex,
								evaluation: ratingKey,
								meal: { beverage, food: foodData },
							},
							loopIndex
						) => (
							<Fragment key={getSavedMealKey(dataIndex)}>
								<div
									ref={registerSavedMealRow(dataIndex)}
									className="relative flex flex-col items-center gap-4 md:static md:flex-row"
								>
									<div
										ref={registerSavedMealContent(
											dataIndex
										)}
										className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap"
									>
										{(() => {
											const rating =
												GUEST_RATING_MAP[ratingKey];
											return (
												<RatingAvatarShell
													color={ratingKey}
													content={rating}
													placement="left"
													popoverOffset={10}
													trigger={
														<span className="cursor-pointer">
															<PopoverTrigger>
																<Avatar
																	isBordered
																	showFallback
																	color={
																		ratingKey
																	}
																	fallback={
																		<div />
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
											);
										})()}
										<div className="flex items-center gap-2">
											{(() => {
												const { recipe } =
													foodCatalog.getRecipeOwnerById(
														foodData.recipeId
													);
												const cookerTypeLabel =
													cookerCatalog.getTypeLabelById(
														recipe.cookerType
													);
												const baseCooker =
													cookerCatalog.getIdByTypeAndSeries(
														recipe.cookerType,
														0
													);
												const cookerLabel = `点击：在新窗口中查看厨具【${cookerTypeLabel}】的详情`;
												return (
													<Tooltip
														showArrow
														content={cookerLabel}
														offset={8}
													>
														<Sprite
															target="cooker"
															recordId={
																baseCooker
															}
															size={1.5}
															onPress={() => {
																openWindow(
																	'cookers',
																	baseCooker,
																	cookerTypeLabel
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
												const { food } =
													foodCatalog.getRecipeOwnerById(
														foodData.recipeId
													);
												const foodName = food.name;
												const foodLabel = `点击：在新窗口中查看料理【${foodName}】的详情`;
												return (
													<Tooltip
														showArrow
														content={foodLabel}
														offset={4}
													>
														<Sprite
															target="food"
															recordId={food.id}
															size={2}
															onPress={() => {
																openWindow(
																	'foods',
																	food.id,
																	foodName
																);
															}}
															aria-label={
																foodLabel
															}
															role="button"
														/>
													</Tooltip>
												);
											})()}
											{beverage !== null &&
												(() => {
													const beverageName =
														beverageCatalog.getPropsById(
															beverage,
															'name'
														);
													const beverageLabel = `点击：在新窗口中查看酒水【${beverageName}】的详情`;
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
														</>
													);
												})()}
										</div>
										<Plus size={0.75} />
										<SavedMealIngredientsStrip
											extraIngredients={
												foodData.extraIngredients
											}
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
												foodCatalog.getRecipeOwnerById(
													foodData.recipeId
												).recipe.ingredients
											}
										/>
									</div>
									<SavedMealActionRail
										className={CLASSNAME_EXCLUDE_FROM_PIP}
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
												foodData
											);
										}}
										onSelect={() => {
											vibrate();
											normalGuestStore.shared.beverage.id.set(
												beverage
											);
											normalGuestStore.shared.recipe.data.set(
												foodData
											);
											const foodName =
												foodCatalog.getRecipeOwnerById(
													foodData.recipeId
												).food.name;
											const beverageName =
												beverage === null
													? null
													: beverageCatalog.getPropsById(
															beverage,
															'name'
														);
											const extraIngredientNames =
												foodData.extraIngredients.map(
													(ingredient) =>
														ingredientCatalog.getPropsById(
															ingredient,
															'name'
														)
												);
											trackEvent(
												trackEvent.category.click,
												'Select Button',
												`${foodName}${beverageName === null ? '' : ` - ${beverageName}`}${extraIngredientNames.length === 0 ? '' : ` - ${extraIngredientNames.join(' ')}`}`
											);
										}}
										reorderButtonsClassName="md:right-0.5 md:top-[unset] md:gap-5 xl:gap-4"
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
						if (currentGuestName === null) {
							return;
						}
						trackEvent(
							trackEvent.category.click,
							'PIP Button',
							currentGuestName
						);
					}}
				/>
			)}
		</div>
	) : (
		<FadeMotionDiv target={contentTarget}>{content}</FadeMotionDiv>
	);
}
