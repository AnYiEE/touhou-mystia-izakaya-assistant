import { cn } from '@heroui/theme';
import { useCallback, useMemo } from 'react';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import FadeMotionDiv, {
	type IFadeMotionDivProps,
} from '@/design/ui/components/fadeMotionDiv';
import Placeholder from '@/design/ui/components/placeholder';
import Tooltip from '@/design/ui/components/tooltip';
import { useAutoHideTooltip } from '@/design/ui/hooks/useAutoHideTooltip';
import { useBreakpoint } from '@/design/ui/hooks/useBreakpoint';

import type { TIngredientId } from '@/domain/data/ingredients/types';
import { GUEST_RATING_MAP } from '@/domain/evaluation/labels';
import { getMealCookerSeries } from '@/domain/meals/getMealCookerSeries';

import CurrentMealIngredientsList from '@/features/catalog/guests/shared/client/components/currentMealIngredientsList';
import {
	Plus,
	UnknownItemIcon,
} from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import SlidingSprite from '@/features/catalog/guests/shared/client/components/slidingSprite';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { formatSelectionTip } from '@/features/catalog/guests/shared/presentation/buildSelectionTip';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import Price from '@/features/catalog/shared/client/components/Price';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { suggestedMealsUiStore } from '@/features/recommendations/client/state/suggestedMealsUiStore';

import { useI18n } from '@/shared/i18n/useI18n';

const EMPTY_INGREDIENT_IDS = [] as const satisfies ReadonlyArray<TIngredientId>;

export default function ResultCard() {
	const { t } = useI18n(catalogGuestsMessages);
	const { breakpoint: placement } = useBreakpoint(
		{ left: 426, top: -1 },
		'top'
	);
	const { isHighAppearance } = useDesignPreferences();
	const vibrate = useVibrate();

	const resultCardClassNames = useMemo(
		() => ({
			base: cn({ 'bg-content1/40 backdrop-blur': isHighAppearance }),
		}),
		[isHighAppearance]
	);

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentGuestOrder = specialGuestStore.shared.guest.order.use();
	const currentBeverage = specialGuestStore.shared.beverage.id.use();
	const currentMealPrice = specialGuestStore.currentMealPrice.use();
	const currentMealFood = specialGuestStore.shared.recipe.data.use();
	const currentRating = specialGuestStore.shared.guest.rating.use();
	const hasMystiaCooker =
		specialGuestStore.shared.guest.hasMystiaCooker.use();
	const isDarkMatter = specialGuestStore.shared.guest.isDarkMatter.use();
	const savedGuestMealsWithEvaluation =
		specialGuestStore.savedGuestMealsWithEvaluation.use();
	const unsatisfiedSelectionTip =
		specialGuestStore.unsatisfiedSelectionTip.use();

	const beverageCatalog = specialGuestStore.instances.beverage.get();
	const cookerCatalog = specialGuestStore.instances.cooker.get();
	const foodCatalog = specialGuestStore.instances.recipe.get();
	const currentBeverageName =
		currentBeverage === null
			? null
			: beverageCatalog.getDisplayPropsById(currentBeverage, 'name');
	const currentRecipeOwner = useMemo(
		() =>
			currentMealFood
				? foodCatalog.getRecipeOwnerById(currentMealFood.recipeId)
				: null,
		[currentMealFood, foodCatalog]
	);
	const originalIngredients =
		currentRecipeOwner?.recipe.ingredients ?? EMPTY_INGREDIENT_IDS;
	const extraIngredients =
		currentMealFood?.extraIngredients ?? EMPTY_INGREDIENT_IDS;

	const isSaveButtonDisabled =
		currentSpecialGuest === null ||
		(currentGuestOrder.beverageTag === null && !hasMystiaCooker) ||
		(currentGuestOrder.foodTag === null && !hasMystiaCooker) ||
		currentBeverage === null ||
		currentMealFood === null ||
		currentRating === null;
	const { isTooltipOpen: isShowSaveButtonTooltip, showTooltip } =
		useAutoHideTooltip(!isSaveButtonDisabled);

	const handleCookerPress = useCallback(() => {
		if (isDarkMatter) {
			return;
		}
		vibrate();
		specialGuestStore.toggleMystiaCooker();
	}, [isDarkMatter, vibrate]);

	const handleRemoveIngredient = useCallback(
		(ingredient: TIngredientId) => {
			vibrate();
			specialGuestStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			specialGuestStore.saveMealResult();
		}
	}, [isSaveButtonDisabled, showTooltip, vibrate]);

	let content: IFadeMotionDivProps['children'];
	let contentClassName: IFadeMotionDivProps['className'];
	let contentTarget: IFadeMotionDivProps['target'];
	let contentVariant: IFadeMotionDivProps['variant'];

	const isSuggestMealsVisible = suggestedMealsUiStore.visibility.use();
	const hasVisibleSavedMeals =
		(savedGuestMealsWithEvaluation?.length ?? 0) > 0;

	if (currentBeverage === null && currentMealFood === null) {
		if (hasVisibleSavedMeals) {
			content = null;
			contentClassName = '';
			contentTarget = 'null';
			contentVariant = 'content';
		} else {
			content = (
				<Placeholder
					className={cn(
						'pb-6 pt-12 md:py-8 xl:pb-2 xl:pt-0',
						isSuggestMealsVisible ? 'pb-12 xl:py-6' : 'pb-2 md:pb-4'
					)}
				>
					{t('guests.resultCard.pickPrompt')}
				</Placeholder>
			);
			contentClassName = isSuggestMealsVisible ? '' : 'my-auto';
			contentTarget = 'placeholder';
			contentVariant = 'placeholder';
		}
	} else {
		content = (
			<Card fullWidth shadow="sm" classNames={resultCardClassNames}>
				<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
					<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
						<div className="flex items-center gap-2">
							{currentRecipeOwner ? (
								(() => {
									const { food, recipe } = currentRecipeOwner;
									const cookerTypeLabel =
										cookerCatalog.getTypeLabelById(
											recipe.cookerType
										);
									const cooker =
										cookerCatalog.getIdByTypeAndSeries(
											recipe.cookerType,
											getMealCookerSeries({
												hasMystiaCooker,
												isDarkMatter:
													isDarkMatter === true,
											})
										);
									const foodName = isDarkMatter
										? t('guests.ingredient.darkMatter')
										: food.name;
									const label = isDarkMatter
										? cookerTypeLabel
										: t(
												hasMystiaCooker
													? 'guests.resultCard.cookerMarkNon'
													: 'guests.resultCard.cookerMark',
												{ type: cookerTypeLabel }
											);
									return (
										<>
											<Tooltip showArrow content={label}>
												<SlidingSprite
													target="cooker"
													recordId={cooker}
													size={2}
													onPress={handleCookerPress}
													role={
														isDarkMatter
															? undefined
															: 'button'
													}
													tabIndex={
														isDarkMatter
															? undefined
															: 0
													}
													aria-label={label}
												/>
											</Tooltip>
											<Tooltip
												showArrow
												content={foodName}
												offset={3}
											>
												<SlidingSprite
													target="food"
													recordId={food.id}
													size={2.5}
												/>
											</Tooltip>
										</>
									);
								})()
							) : (
								<>
									<Tooltip
										showArrow
										content={t(
											'guests.resultCard.selectFood'
										)}
										offset={7}
									>
										<SlidingSprite
											target="cooker"
											isFallback
											fallbackKey="empty-food-cooker"
											fallback={
												<UnknownItemIcon
													title={t(
														'guests.resultCard.selectFood'
													)}
													iconSize={1.5}
													size={2}
												/>
											}
											size={2}
										/>
									</Tooltip>
									<Tooltip
										showArrow
										content={t(
											'guests.resultCard.selectFood'
										)}
										offset={3}
									>
										<SlidingSprite
											target="food"
											isFallback
											fallbackKey="empty-food"
											fallback={
												<UnknownItemIcon
													title={t(
														'guests.resultCard.selectFood'
													)}
													iconSize={2}
													size={2.5}
												/>
											}
											size={2.5}
										/>
									</Tooltip>
								</>
							)}
							<Plus />
							{currentBeverage !== null &&
							currentBeverageName !== null ? (
								<Tooltip
									showArrow
									content={currentBeverageName}
									offset={3}
								>
									<SlidingSprite
										target="beverage"
										recordId={currentBeverage}
										size={2.5}
									/>
								</Tooltip>
							) : (
								<Tooltip
									showArrow
									content={t(
										'guests.resultCard.selectBeverage'
									)}
									offset={3}
								>
									<SlidingSprite
										target="beverage"
										isFallback
										fallbackKey="empty-beverage"
										fallback={
											<UnknownItemIcon
												title={t(
													'guests.resultCard.selectBeverage'
												)}
												iconSize={2}
												size={2.5}
											/>
										}
										size={2.5}
									/>
								</Tooltip>
							)}
						</div>
						<Plus />
						<CurrentMealIngredientsList
							extraIngredients={extraIngredients}
							onRemoveExtraIngredient={handleRemoveIngredient}
							originalIngredients={originalIngredients}
						/>
					</div>
					<Tooltip
						showArrow
						content={formatSelectionTip(
							unsatisfiedSelectionTip.save,
							t
						)}
						isOpen={isShowSaveButtonTooltip}
						placement={placement}
					>
						<Button
							color="primary"
							disableAnimation={isSaveButtonDisabled}
							size="sm"
							variant="flat"
							onPress={handleSaveButtonPress}
							aria-label={t('guests.resultCard.saveMealAria', {
								status:
									currentRating === null
										? t('guests.resultCard.unrated')
										: t('guests.resultCard.ratedAs', {
												rating: GUEST_RATING_MAP[
													currentRating
												],
											}),
							})}
							className={cn(
								'flex-col gap-0 text-tiny leading-none !transition motion-reduce:!transition-none md:w-auto',
								{ 'opacity-disabled': isSaveButtonDisabled }
							)}
						>
							<span>{t('guests.resultCard.saveMeal')}</span>
							<span>
								<Price>{currentMealPrice}</Price>
							</span>
						</Button>
					</Tooltip>
				</div>
			</Card>
		);
		contentClassName = '';
		contentTarget = 'content';
		contentVariant = 'content';
	}

	return (
		<FadeMotionDiv
			target={contentTarget}
			variant={contentVariant}
			className={contentClassName}
		>
			{content}
		</FadeMotionDiv>
	);
}
