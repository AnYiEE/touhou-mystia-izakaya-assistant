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

import { CookerCatalog } from '@/domain/catalog/items/CookerCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';
import { getEvaluationLabelByKey } from '@/domain/evaluation/localizedLabels';

import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import CurrentMealIngredientsList from '@/features/catalog/guests/shared/client/components/currentMealIngredientsList';
import {
	Plus,
	UnknownItemIcon,
} from '@/features/catalog/guests/shared/client/components/resultCardAtoms';
import SlidingSprite from '@/features/catalog/guests/shared/client/components/slidingSprite';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';

export { Plus } from '@/features/catalog/guests/shared/client/components/resultCardAtoms';

const cookerCatalog = CookerCatalog.getInstance();
const EMPTY_INGREDIENT_IDS = [] as const satisfies ReadonlyArray<TIngredientId>;

export default function NormalGuestResultCard() {
	const { t } = useI18n(catalogGuestsMessages);
	const { isHighAppearance } = useDesignPreferences();
	const vibrate = useVibrate();

	const resultCardClassNames = useMemo(
		() => ({
			base: cn({ 'bg-content1/40 backdrop-blur': isHighAppearance }),
		}),
		[isHighAppearance]
	);

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();
	const currentBeverage = normalGuestStore.shared.beverage.id.use();
	const currentMealFoodData = normalGuestStore.shared.recipe.data.use();
	const currentRating = normalGuestStore.shared.guest.rating.use();
	const savedGuestMealsWithEvaluation =
		normalGuestStore.savedGuestMealsWithEvaluation.use();

	const foodCatalog = normalGuestStore.instances.recipe.get();
	const beverageCatalog = normalGuestStore.instances.beverage.get();
	const currentBeverageName =
		currentBeverage === null
			? null
			: beverageCatalog.getDisplayPropsById(currentBeverage, 'name');

	const currentRecipeOwner = useMemo(
		() =>
			currentMealFoodData
				? foodCatalog.getRecipeOwnerById(currentMealFoodData.recipeId)
				: null,
		[currentMealFoodData, foodCatalog]
	);
	const currentFood = currentRecipeOwner?.food ?? null;
	const currentRecipe = currentRecipeOwner?.recipe ?? null;
	const currentExtraIngredients = useMemo(
		() => currentMealFoodData?.extraIngredients ?? [],
		[currentMealFoodData]
	);
	const currentCookerLabel =
		currentRecipe === null
			? null
			: cookerCatalog.getTypeLabelById(currentRecipe.cookerType);
	const currentCooker =
		currentRecipe === null
			? null
			: cookerCatalog.getIdByTypeAndSeries(currentRecipe.cookerType, 0);

	const isSaveButtonDisabled =
		currentNormalGuest === null ||
		currentMealFoodData === null ||
		currentRating === null;
	const { isTooltipOpen: isShowSaveButtonTooltip, showTooltip } =
		useAutoHideTooltip(!isSaveButtonDisabled);

	const handleRemoveIngredient = useCallback(
		(ingredient: TIngredientId) => {
			vibrate();
			normalGuestStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			normalGuestStore.saveMealResult();
		}
	}, [isSaveButtonDisabled, showTooltip, vibrate]);

	let content: IFadeMotionDivProps['children'];
	let contentClassName: IFadeMotionDivProps['className'];
	let contentTarget: IFadeMotionDivProps['target'];
	let contentVariant: IFadeMotionDivProps['variant'];
	const hasVisibleSavedMeals =
		(savedGuestMealsWithEvaluation?.length ?? 0) > 0;

	if (currentBeverage === null && currentMealFoodData === null) {
		if (hasVisibleSavedMeals) {
			content = null;
			contentClassName = '';
			contentTarget = 'null';
			contentVariant = 'content';
		} else {
			content = (
				<Placeholder className="pb-6 pt-12 md:py-8 xl:pb-2 xl:pt-0">
					{t('guests.resultCard.pickOrderedFoodPrompt')}
				</Placeholder>
			);
			contentClassName = 'my-auto';
			contentTarget = 'placeholder';
			contentVariant = 'placeholder';
		}
	} else {
		content = (
			<Card fullWidth shadow="sm" classNames={resultCardClassNames}>
				<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
					<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
						<div className="flex items-center gap-2">
							{currentFood !== null &&
							currentCooker !== null &&
							currentCookerLabel !== null ? (
								<>
									<SlidingSprite
										target="cooker"
										recordId={currentCooker}
										size={2}
									/>
									<Tooltip
										showArrow
										content={currentFood.name}
										offset={3}
									>
										<SlidingSprite
											target="food"
											recordId={currentFood.id}
											size={2.5}
										/>
									</Tooltip>
								</>
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
										'guests.resultCard.optionalBeverage'
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
													'guests.resultCard.optionalBeverage'
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
							extraIngredients={currentExtraIngredients}
							onRemoveExtraIngredient={handleRemoveIngredient}
							originalIngredients={
								currentRecipe?.ingredients ??
								EMPTY_INGREDIENT_IDS
							}
						/>
					</div>
					<Tooltip
						showArrow
						content={t('guests.resultCard.pickOrderedFoodToSave')}
						isOpen={isShowSaveButtonTooltip}
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
												rating: getEvaluationLabelByKey(
													currentRating
												),
											}),
							})}
							className={cn(
								'!transition motion-reduce:!transition-none md:w-auto',
								{ 'opacity-disabled': isSaveButtonDisabled }
							)}
						>
							{t('guests.resultCard.saveMeal')}
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
