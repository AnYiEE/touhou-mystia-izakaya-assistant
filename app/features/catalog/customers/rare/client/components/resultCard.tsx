import { cn } from '@heroui/theme';
import { useCallback, useMemo } from 'react';
import useBreakpoint from 'use-breakpoint';

import { useDesignPreferences } from '@/design/preferences/DesignPreferencesContext';
import Button from '@/design/ui/components/button';
import Card from '@/design/ui/components/card';
import FadeMotionDiv, {
	type IFadeMotionDivProps,
} from '@/design/ui/components/fadeMotionDiv';
import Placeholder from '@/design/ui/components/placeholder';
import Tooltip from '@/design/ui/components/tooltip';
import { useAutoHideTooltip } from '@/design/ui/hooks/useAutoHideTooltip';

import type { TIngredientName } from '@/domain/data/ingredients/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';
import { CUSTOMER_RATING_MAP } from '@/domain/evaluation/labels';

import { customerRareStore } from '@/features/catalog/customers/rare/client/state/store';
import CurrentMealIngredientsList from '@/features/catalog/customers/shared/client/components/currentMealIngredientsList';
import {
	Plus,
	UnknownItemIcon,
} from '@/features/catalog/customers/shared/client/components/resultCardAtoms';
import SlidingSprite from '@/features/catalog/customers/shared/client/components/slidingSprite';
import Price from '@/features/catalog/shared/client/components/Price';
import { useVibrate } from '@/features/preferences/client/useVibrate';
import { suggestedMealsUiStore } from '@/features/recommendations/client/state/suggestedMealsUiStore';

export default function ResultCard() {
	const { breakpoint: placement } = useBreakpoint(
		{ left: 426, top: -1 },
		'top'
	);
	const vibrate = useVibrate();

	const { isHighAppearance } = useDesignPreferences();

	const currentCustomerName = customerRareStore.shared.customer.name.use();
	const currentCustomerOrder = customerRareStore.shared.customer.order.use();
	const currentBeverageName = customerRareStore.shared.beverage.name.use();
	const currentMealPrice = customerRareStore.currentMealPrice.use();
	const currentRecipeData = customerRareStore.shared.recipe.data.use();
	const currentRating = customerRareStore.shared.customer.rating.use();
	const hasMystiaCooker =
		customerRareStore.shared.customer.hasMystiaCooker.use();
	const isDarkMatter = customerRareStore.shared.customer.isDarkMatter.use();
	const savedCustomerMealsWithEvaluation =
		customerRareStore.savedCustomerMealsWithEvaluation.use();
	const unsatisfiedSelectionTip =
		customerRareStore.unsatisfiedSelectionTip.use();

	const instance_recipe = customerRareStore.instances.recipe.get();
	const originalIngredients = useMemo(
		() =>
			currentRecipeData
				? instance_recipe.getPropsByName(
						currentRecipeData.name,
						'ingredients'
					)
				: [],
		[currentRecipeData, instance_recipe]
	);

	const isSaveButtonDisabled =
		currentCustomerName === null ||
		(currentCustomerOrder.beverageTag === null && !hasMystiaCooker) ||
		(currentCustomerOrder.recipeTag === null && !hasMystiaCooker) ||
		currentBeverageName === null ||
		currentRecipeData === null ||
		currentRating === null;
	const { isTooltipOpen: isShowSaveButtonTooltip, showTooltip } =
		useAutoHideTooltip(!isSaveButtonDisabled);

	const handleCookerPress = useCallback(() => {
		if (isDarkMatter) {
			return;
		}
		vibrate();
		customerRareStore.toggleMystiaCooker();
	}, [isDarkMatter, vibrate]);

	const handleRemoveIngredient = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			customerRareStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			customerRareStore.saveMealResult();
		}
	}, [isSaveButtonDisabled, showTooltip, vibrate]);

	const saveButtonTooltip = unsatisfiedSelectionTip.save;

	let content: IFadeMotionDivProps['children'];
	let contentClassName: IFadeMotionDivProps['className'];
	let contentTarget: IFadeMotionDivProps['target'];
	let contentVariant: IFadeMotionDivProps['variant'];

	const isSuggestMealsVisible = suggestedMealsUiStore.visibility.use();
	const hasVisibleSavedMeals =
		(savedCustomerMealsWithEvaluation?.length ?? 0) > 0;

	if (currentBeverageName === null && currentRecipeData === null) {
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
					选择一种料理或酒水以继续
				</Placeholder>
			);
			contentClassName = isSuggestMealsVisible ? '' : 'my-auto';
			contentTarget = 'placeholder';
			contentVariant = 'placeholder';
		}
	} else {
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
				<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
					<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
						<div className="flex items-center gap-2">
							{currentRecipeData ? (
								(() => {
									const isDarkMatterOrNormalMeal =
										// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
										isDarkMatter || !hasMystiaCooker;
									const originalCooker =
										instance_recipe.getPropsByName(
											currentRecipeData.name,
											'cooker'
										);
									const cooker = isDarkMatterOrNormalMeal
										? originalCooker
										: (`夜雀${originalCooker}` as const);
									const recipeName = isDarkMatter
										? DARK_MATTER_META_MAP.name
										: currentRecipeData.name;
									const label = isDarkMatter
										? originalCooker
										: `点击：将此点单标记为使用${hasMystiaCooker ? '非' : ''}【夜雀${originalCooker}】制作`;
									return (
										<>
											<Tooltip showArrow content={label}>
												<SlidingSprite
													target="cooker"
													name={cooker}
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
												content={recipeName}
												offset={3}
											>
												<SlidingSprite
													target="recipe"
													name={recipeName}
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
										content="请选择料理"
										offset={7}
									>
										<SlidingSprite
											target="cooker"
											isFallback
											fallbackKey="empty-recipe-cooker"
											fallback={
												<UnknownItemIcon
													title="请选择料理"
													iconSize={1.5}
													size={2}
												/>
											}
											size={2}
										/>
									</Tooltip>
									<Tooltip
										showArrow
										content="请选择料理"
										offset={3}
									>
										<SlidingSprite
											target="recipe"
											isFallback
											fallbackKey="empty-recipe"
											fallback={
												<UnknownItemIcon
													title="请选择料理"
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
							{currentBeverageName ? (
								<Tooltip
									showArrow
									content={currentBeverageName}
									offset={3}
								>
									<SlidingSprite
										target="beverage"
										name={currentBeverageName}
										size={2.5}
									/>
								</Tooltip>
							) : (
								<Tooltip
									showArrow
									content="请选择酒水"
									offset={3}
								>
									<SlidingSprite
										target="beverage"
										isFallback
										fallbackKey="empty-beverage"
										fallback={
											<UnknownItemIcon
												title="请选择酒水"
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
							extraIngredients={
								currentRecipeData?.extraIngredients ?? []
							}
							onRemoveExtraIngredient={handleRemoveIngredient}
							originalIngredients={originalIngredients}
						/>
					</div>
					<Tooltip
						showArrow
						content={saveButtonTooltip}
						isOpen={isShowSaveButtonTooltip}
						placement={placement}
					>
						<Button
							color="primary"
							disableAnimation={isSaveButtonDisabled}
							size="sm"
							variant="flat"
							onPress={handleSaveButtonPress}
							aria-label={`保存套餐，当前${currentRating === null ? '未评级' : `评级为${CUSTOMER_RATING_MAP[currentRating]}`}`}
							className={cn(
								'flex-col gap-0 text-tiny leading-none !transition motion-reduce:!transition-none md:w-auto',
								{ 'opacity-disabled': isSaveButtonDisabled }
							)}
						>
							<span>保存套餐</span>
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
