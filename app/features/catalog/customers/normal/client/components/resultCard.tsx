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

import type { TIngredientName } from '@/domain/data/ingredients/types';
import { CUSTOMER_RATING_MAP } from '@/domain/evaluation/labels';

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import CurrentMealIngredientsList from '@/features/catalog/customers/shared/client/components/currentMealIngredientsList';
import {
	Plus,
	UnknownItemIcon,
} from '@/features/catalog/customers/shared/client/components/resultCardAtoms';
import SlidingSprite from '@/features/catalog/customers/shared/client/components/slidingSprite';
import { useVibrate } from '@/features/preferences/client/useVibrate';

export { Plus } from '@/features/catalog/customers/shared/client/components/resultCardAtoms';

export default function ResultCard() {
	const vibrate = useVibrate();

	const { isHighAppearance } = useDesignPreferences();

	const currentCustomerName = customerNormalStore.shared.customer.name.use();
	const currentBeverageName = customerNormalStore.shared.beverage.name.use();
	const currentRecipeData = customerNormalStore.shared.recipe.data.use();
	const currentRating = customerNormalStore.shared.customer.rating.use();
	const savedCustomerMealsWithEvaluation =
		customerNormalStore.savedCustomerMealsWithEvaluation.use();

	const instance_recipe = customerNormalStore.instances.recipe.get();

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
		currentRecipeData === null ||
		currentRating === null;
	const { isTooltipOpen: isShowSaveButtonTooltip, showTooltip } =
		useAutoHideTooltip(!isSaveButtonDisabled);

	const handleRemoveIngredient = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			customerNormalStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			customerNormalStore.saveMealResult();
		}
	}, [isSaveButtonDisabled, showTooltip, vibrate]);

	let content: IFadeMotionDivProps['children'];
	let contentClassName: IFadeMotionDivProps['className'];
	let contentTarget: IFadeMotionDivProps['target'];
	let contentVariant: IFadeMotionDivProps['variant'];
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
				<Placeholder className="pb-6 pt-12 md:py-8 xl:pb-2 xl:pt-0">
					选择点单料理以继续
				</Placeholder>
			);
			contentClassName = 'my-auto';
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
								<>
									<SlidingSprite
										target="cooker"
										name={instance_recipe.getPropsByName(
											currentRecipeData.name,
											'cooker'
										)}
										size={2}
									/>
									<Tooltip
										showArrow
										content={currentRecipeData.name}
										offset={3}
									>
										<SlidingSprite
											target="recipe"
											name={currentRecipeData.name}
											size={2.5}
										/>
									</Tooltip>
								</>
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
									content="可选择酒水"
									offset={3}
								>
									<SlidingSprite
										target="beverage"
										isFallback
										fallbackKey="empty-beverage"
										fallback={
											<UnknownItemIcon
												title="可选择酒水"
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
						content="请选择点单料理以保存"
						isOpen={isShowSaveButtonTooltip}
					>
						<Button
							color="primary"
							disableAnimation={isSaveButtonDisabled}
							size="sm"
							variant="flat"
							onPress={handleSaveButtonPress}
							aria-label={`保存套餐，当前${currentRating === null ? '未评级' : `评级为${CUSTOMER_RATING_MAP[currentRating]}`}`}
							className={cn(
								'!transition motion-reduce:!transition-none md:w-auto',
								{ 'opacity-disabled': isSaveButtonDisabled }
							)}
						>
							保存套餐
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
