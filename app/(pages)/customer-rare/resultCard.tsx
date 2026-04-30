import { useCallback, useMemo } from 'react';

import useBreakpoint from 'use-breakpoint';
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
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {
	CUSTOMER_RATING_MAP,
	DARK_MATTER_META_MAP,
	type TIngredientName,
} from '@/data';
import { customerRareStore as customerStore, globalStore } from '@/stores';

export default function ResultCard() {
	const { breakpoint: placement } = useBreakpoint(
		{ left: 426, top: -1 },
		'top'
	);
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentMealPrice = customerStore.currentMealPrice.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();
	const savedCustomerMealsWithEvaluation =
		customerStore.savedCustomerMealsWithEvaluation.use();
	const unsatisfiedSelectionTip = customerStore.unsatisfiedSelectionTip.use();

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
		customerStore.toggleMystiaCooker();
	}, [isDarkMatter, vibrate]);

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

	const saveButtonTooltip = unsatisfiedSelectionTip.save;

	let content: IFadeMotionDivProps['children'];
	let contentClassName: IFadeMotionDivProps['className'];
	let contentTarget: IFadeMotionDivProps['target'];
	let contentVariant: IFadeMotionDivProps['variant'];

	const isSuggestMealsVisible =
		customerStore.shared.suggestMeals.visibility.use();
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
												<Sprite
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
													className={cn(
														'!duration-500 ease-out transition-background motion-reduce:transition-none',
														{
															'cursor-pointer':
																!isDarkMatter,
														}
													)}
												/>
											</Tooltip>
											<Tooltip
												showArrow
												content={recipeName}
												offset={4}
											>
												<Sprite
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
								<UnknownItem title="请选择酒水" />
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
