import { useCallback, useMemo } from 'react';

import { useAutoHideTooltip, useVibrate } from '@/hooks';

import {
	Button,
	Card,
	FadeMotionDiv,
	type IFadeMotionDivProps,
	Tooltip,
	cn,
} from '@/design/ui/components';

import CurrentMealIngredientsList from '@/(pages)/customer-shared/currentMealIngredientsList';
import { Plus, UnknownItem } from '@/(pages)/customer-shared/resultCardAtoms';
import Placeholder from '@/components/placeholder';
import Sprite from '@/components/sprite';

import { CUSTOMER_RATING_MAP, type TIngredientName } from '@/data';
import { customerNormalStore as customerStore, globalStore } from '@/stores';

export { Plus } from '@/(pages)/customer-shared/resultCardAtoms';

export default function ResultCard() {
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const savedCustomerMealsWithEvaluation =
		customerStore.savedCustomerMealsWithEvaluation.use();

	const instance_recipe = customerStore.instances.recipe.get();

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
			customerStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			customerStore.saveMealResult();
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
									<Sprite
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
										offset={4}
									>
										<Sprite
											target="recipe"
											name={currentRecipeData.name}
											size={2.5}
										/>
									</Tooltip>
								</>
							) : (
								<>
									<UnknownItem
										title="请选择料理"
										size={1.5}
									/>
									<UnknownItem title="请选择料理" />
								</>
							)}
							<Plus />
							{currentBeverageName ? (
								<Tooltip
									showArrow
									content={currentBeverageName}
									offset={4}
								>
									<Sprite
										target="beverage"
										name={currentBeverageName}
										size={2.5}
									/>
								</Tooltip>
							) : (
								<UnknownItem title="可选择酒水" />
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
