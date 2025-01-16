import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {useVibrate} from '@/hooks';

import {Card} from '@nextui-org/card';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark} from '@fortawesome/free-solid-svg-icons';

import {Button, Tooltip, cn} from '@/design/ui/components';

import {Plus, UnknownItem} from '@/(pages)/customer-rare/resultCard';
import Placeholder from '@/components/placeholder';
import Sprite from '@/components/sprite';

import {CUSTOMER_RATING_MAP, type TIngredientName} from '@/data';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, toArray} from '@/utilities';

export {Plus} from '@/(pages)/customer-rare/resultCard';

function IngredientsList() {
	const vibrate = useVibrate();

	const currentRecipeData = customerStore.shared.recipe.data.use();

	const instance_recipe = customerStore.instances.recipe.get();

	const originalIngredients = useMemo(
		() => (currentRecipeData ? instance_recipe.getPropsByName(currentRecipeData.name, 'ingredients') : []),
		[currentRecipeData, instance_recipe]
	);

	const filledIngredients = useMemo(
		() =>
			toArray<(TIngredientName | null)[]>(
				originalIngredients,
				currentRecipeData?.extraIngredients ?? [],
				new Array<null>(5).fill(null)
			).slice(0, 5),
		[currentRecipeData?.extraIngredients, originalIngredients]
	);

	const handleRemoveButtonPress = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			customerStore.removeMealIngredient(ingredient);
		},
		[vibrate]
	);

	return (
		<div className="flex items-center gap-x-3">
			{filledIngredients.map((ingredient, index) =>
				ingredient ? (
					index >= originalIngredients.length ? (
						(() => {
							const label = `点击：删除额外食材【${ingredient}】`;
							return (
								<Tooltip key={index} showArrow content={label} offset={4}>
									<span
										onKeyDown={checkA11yConfirmKey(() => {
											handleRemoveButtonPress(ingredient);
										})}
										tabIndex={0}
										aria-label={label}
										className="flex items-center"
									>
										<span
											onClick={() => {
												handleRemoveButtonPress(ingredient);
											}}
											role="button"
											tabIndex={1}
											title={ingredient}
											className="absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-small bg-foreground bg-opacity-50 text-background opacity-0 transition-opacity hover:opacity-100"
										>
											<FontAwesomeIcon icon={faCircleXmark} size="1x" />
										</span>
										<Sprite target="ingredient" name={ingredient} size={2.5} />
									</span>
								</Tooltip>
							);
						})()
					) : (
						<Tooltip key={index} showArrow content={ingredient} offset={4}>
							<Sprite target="ingredient" name={ingredient} size={2.5} />
						</Tooltip>
					)
				) : (
					<UnknownItem key={index} title="空食材" />
				)
			)}
		</div>
	);
}

export default function ResultCard() {
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const currentSavedMeals = customerStore.persistence.meals.use();

	const instance_recipe = customerStore.instances.recipe.get();

	const saveButtonTooltipTimer = useRef<NodeJS.Timeout>();
	const [isShowSaveButtonTooltip, setIsShowSaveButtonTooltip] = useState(false);
	const isSaveButtonDisabled = currentCustomerName === null || currentRecipeData === null || currentRating === null;

	const hideTooltip = useCallback(() => {
		setIsShowSaveButtonTooltip(false);
		clearTimeout(saveButtonTooltipTimer.current);
	}, []);

	const showTooltip = useCallback(() => {
		setIsShowSaveButtonTooltip(true);
		clearTimeout(saveButtonTooltipTimer.current);
		saveButtonTooltipTimer.current = setTimeout(() => {
			hideTooltip();
		}, 3000);
	}, [hideTooltip]);

	const handleSaveButtonPress = useCallback(() => {
		if (isSaveButtonDisabled) {
			showTooltip();
		} else {
			vibrate();
			customerStore.saveMealResult();
		}
	}, [isSaveButtonDisabled, showTooltip, vibrate]);

	useEffect(() => {
		if (isShowSaveButtonTooltip && !isSaveButtonDisabled) {
			hideTooltip();
		}
	}, [hideTooltip, isSaveButtonDisabled, isShowSaveButtonTooltip]);

	if (currentBeverageName === null && currentRecipeData === null) {
		if (currentCustomerName !== null && currentSavedMeals[currentCustomerName]?.length) {
			return null;
		}
		return <Placeholder className="pb-6 pt-12 md:py-8 xl:pb-2 xl:pt-0">选择点单料理以继续</Placeholder>;
	}

	return (
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
									name={instance_recipe.getPropsByName(currentRecipeData.name, 'cooker')}
									size={2}
								/>
								<Tooltip showArrow content={currentRecipeData.name} offset={4}>
									<Sprite target="recipe" name={currentRecipeData.name} size={2.5} />
								</Tooltip>
							</>
						) : (
							<>
								<UnknownItem title="请选择料理" size={1.5} />
								<UnknownItem title="请选择料理" />
							</>
						)}
						<Plus />
						{currentBeverageName ? (
							<Tooltip showArrow content={currentBeverageName} offset={4}>
								<Sprite target="beverage" name={currentBeverageName} size={2.5} />
							</Tooltip>
						) : (
							<UnknownItem title="可选择酒水" />
						)}
					</div>
					<Plus />
					<IngredientsList />
				</div>
				<Tooltip showArrow content="请选择点单料理以保存" isOpen={isShowSaveButtonTooltip}>
					<Button
						color="primary"
						disableAnimation={isSaveButtonDisabled}
						size="sm"
						variant="flat"
						onPress={handleSaveButtonPress}
						aria-label={`保存套餐，当前${currentRating === null ? '未评级' : `评级为${CUSTOMER_RATING_MAP[currentRating]}`}`}
						className={cn('!transition md:w-auto', {
							'opacity-disabled': isSaveButtonDisabled,
						})}
					>
						保存套餐
					</Button>
				</Tooltip>
			</div>
		</Card>
	);
}
