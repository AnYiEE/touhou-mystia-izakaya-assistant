import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import useBreakpoint from 'use-breakpoint';
import {useVibrate} from '@/hooks';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark, faPlus, faQuestion} from '@fortawesome/free-solid-svg-icons';

import {Button, Card, Tooltip, cn} from '@/design/ui/components';

import Placeholder from '@/components/placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {CUSTOMER_RATING_MAP, DARK_MATTER_META_MAP, type TIngredientName} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, toArray} from '@/utilities';

interface IPlusProps extends Pick<HTMLSpanElementAttributes, 'className'> {
	size?: number;
}

export const Plus = memo<IPlusProps>(function Plus({className, size = 1}) {
	const remString = `${size}rem`;

	return (
		<span
			className={cn('mx-1 text-center leading-none', className)}
			style={{
				fontSize: remString,
				width: remString,
			}}
		>
			<FontAwesomeIcon icon={faPlus} />
		</span>
	);
});

interface IUnknownItemProps extends Pick<HTMLSpanElementAttributes, 'className' | 'title'> {
	size?: number;
}

export const UnknownItem = memo<IUnknownItemProps>(function UnknownItem({className, size = 2, title}) {
	const remString = `${size}rem`;

	return (
		<Tooltip showArrow content={title} offset={7 + -8 * (size - 2)}>
			<span
				role="img"
				title={title}
				className={cn(
					'outline-3 inline-block rounded-small text-center leading-none outline-double',
					className
				)}
				style={{
					fontSize: remString,
					height: remString,
					width: remString,
				}}
			>
				<FontAwesomeIcon icon={faQuestion} className="rotate-12" />
			</span>
		</Tooltip>
	);
});

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
											className="absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-small bg-foreground/50 text-background opacity-0 transition-opacity hover:opacity-100 motion-reduce:transition-none"
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
	const {breakpoint: placement} = useBreakpoint(
		{
			left: 426,
			top: -1,
		},
		'top'
	);
	const vibrate = useVibrate();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerOrder = customerStore.shared.customer.order.use();
	const currentBeverageName = customerStore.shared.beverage.name.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const currentRating = customerStore.shared.customer.rating.use();
	const currentSavedMeals = customerStore.persistence.meals.use();
	const hasMystiaCooker = customerStore.shared.customer.hasMystiaCooker.use();
	const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();

	const instance_beverage = customerStore.instances.beverage.get();
	const instance_recipe = customerStore.instances.recipe.get();

	const saveButtonTooltipTimer = useRef<NodeJS.Timeout>();
	const [isShowSaveButtonTooltip, setIsShowSaveButtonTooltip] = useState(false);
	const isSaveButtonDisabled =
		currentCustomerName === null ||
		(currentCustomerOrder.beverageTag === null && !hasMystiaCooker) ||
		(currentCustomerOrder.recipeTag === null && !hasMystiaCooker) ||
		currentBeverageName === null ||
		currentRecipeData === null ||
		currentRating === null;

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

	const handleCookerClick = useCallback(() => {
		if (isDarkMatter) {
			return;
		}
		vibrate();
		customerStore.toggleMystiaCooker();
	}, [isDarkMatter, vibrate]);

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

	const saveButtonTooltip = useMemo(() => {
		const target = [];
		if (currentBeverageName === null) {
			target.push('酒水');
		}
		if (currentRecipeData === null) {
			target.push('料理');
		}
		if ((isDarkMatter && hasMystiaCooker) || !hasMystiaCooker) {
			target.push('顾客点单需求');
		}

		let content = target.join('、');
		if (!isDarkMatter && !hasMystiaCooker) {
			content += '或标记为使用“夜雀”系列厨具';
		}

		return `请选择${content}以保存`;
	}, [currentBeverageName, currentRecipeData, hasMystiaCooker, isDarkMatter]);

	if (currentBeverageName === null && currentRecipeData === null) {
		if (currentCustomerName !== null && currentSavedMeals[currentCustomerName]?.length) {
			return null;
		}
		return <Placeholder className="pb-6 pt-12 md:py-8 xl:pb-2 xl:pt-0">选择一种料理或酒水以继续</Placeholder>;
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
							(() => {
								const isDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
								const originalCooker = instance_recipe.getPropsByName(currentRecipeData.name, 'cooker');
								const cooker = isDarkMatterOrNormalMeal
									? originalCooker
									: (`夜雀${originalCooker}` as const);
								const recipeName = isDarkMatter ? DARK_MATTER_META_MAP.name : currentRecipeData.name;
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
												onPress={handleCookerClick}
												role={isDarkMatter ? undefined : 'button'}
												tabIndex={isDarkMatter ? undefined : 0}
												aria-label={label}
												className={cn(
													'!duration-500 ease-out transition-background motion-reduce:transition-none',
													{
														'cursor-pointer': !isDarkMatter,
													}
												)}
											/>
										</Tooltip>
										<Tooltip showArrow content={recipeName} offset={4}>
											<Sprite target="recipe" name={recipeName} size={2.5} />
										</Tooltip>
									</>
								);
							})()
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
							<UnknownItem title="请选择酒水" />
						)}
					</div>
					<Plus />
					<IngredientsList />
				</div>
				<Tooltip showArrow content={saveButtonTooltip} isOpen={isShowSaveButtonTooltip} placement={placement}>
					<Button
						color="primary"
						disableAnimation={isSaveButtonDisabled}
						size="sm"
						variant="flat"
						onPress={handleSaveButtonPress}
						aria-label={`保存套餐，当前${currentRating === null ? '未评级' : `评级为${CUSTOMER_RATING_MAP[currentRating]}`}`}
						className={cn(
							'flex-col gap-0 text-tiny leading-none !transition motion-reduce:!transition-none md:w-auto',
							{
								'opacity-disabled': isSaveButtonDisabled,
							}
						)}
					>
						<span>保存套餐</span>
						<span>
							<Price>
								{(currentBeverageName
									? instance_beverage.getPropsByName(currentBeverageName, 'price')
									: 0) +
									(currentRecipeData?.name
										? isDarkMatter
											? DARK_MATTER_META_MAP.price
											: instance_recipe.getPropsByName(currentRecipeData.name, 'price')
										: 0)}
							</Price>
						</span>
					</Button>
				</Tooltip>
			</div>
		</Card>
	);
}
