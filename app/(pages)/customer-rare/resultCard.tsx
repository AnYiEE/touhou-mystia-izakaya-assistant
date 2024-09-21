import {type HTMLAttributes, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import useBreakpoint from 'use-breakpoint';
import {useVibrate} from '@/hooks';

import {Button, Card, Tooltip} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark, faPlus, faQuestion} from '@fortawesome/free-solid-svg-icons';

import Placeholder from './placeholder';
import Price from '@/components/price';
import Sprite from '@/components/sprite';

import {type TIngredientNames} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey} from '@/utils';

interface IPlusProps extends Pick<HTMLAttributes<HTMLSpanElement>, 'className'> {
	size?: number;
}

export const Plus = memo(
	forwardRef<HTMLSpanElement | null, IPlusProps>(function Plus({className, size = 1}, ref) {
		const remString = `${size}rem`;

		return (
			<span
				className={twMerge('mx-1 text-center leading-none', className)}
				style={{
					fontSize: remString,
					width: remString,
				}}
				ref={ref}
			>
				<FontAwesomeIcon icon={faPlus} />
			</span>
		);
	})
);

interface IUnknownItemProps extends Pick<HTMLAttributes<HTMLSpanElement>, 'className' | 'title'> {
	size?: number;
}

export const UnknownItem = memo(
	forwardRef<HTMLSpanElement | null, IUnknownItemProps>(function UnknownItem({className, size = 2, title}, ref) {
		const remString = `${size}rem`;

		return (
			<Tooltip showArrow content={title}>
				<span
					role="img"
					title={title}
					className={twMerge('outline-3 inline-block text-center leading-none outline-double', className)}
					style={{
						fontSize: remString,
						width: remString,
					}}
					ref={ref}
				>
					<FontAwesomeIcon icon={faQuestion} className="rotate-12" />
				</span>
			</Tooltip>
		);
	})
);

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
			[
				...originalIngredients,
				...(currentRecipeData?.extraIngredients ?? []),
				...new Array<null>(5).fill(null),
			].slice(0, 5),
		[currentRecipeData?.extraIngredients, originalIngredients]
	);

	const handleRemoveButtonPress = useCallback(
		(ingredient: TIngredientNames) => {
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
										onKeyDown={(event) => {
											if (checkA11yConfirmKey(event)) {
												handleRemoveButtonPress(ingredient);
											}
										}}
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
											className="absolute flex h-10 w-10 cursor-pointer items-center justify-center bg-foreground bg-opacity-50 text-background opacity-0 transition-opacity hover:opacity-100"
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

interface IResultCardProps {}

export default forwardRef<HTMLDivElement | null, IResultCardProps>(function ResultCard(_props, ref) {
	const {breakpoint: placement} = useBreakpoint(
		{
			left: 426,
			top: -1,
		},
		'top'
	);
	const vibrate = useVibrate();

	const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

	const currentCustomerName = customerStore.shared.customer.data.use()?.name;
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
		!currentCustomerName ||
		!currentBeverageName ||
		!currentRecipeData ||
		!(currentCustomerOrder.beverageTag || hasMystiaCooker) ||
		!(currentCustomerOrder.recipeTag || hasMystiaCooker) ||
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
		if (!currentBeverageName) {
			target.push('酒水');
		}
		if (!currentRecipeData) {
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

	if (!currentBeverageName && !currentRecipeData) {
		if (currentCustomerName && currentSavedMeals[currentCustomerName]?.length) {
			return null;
		}
		return (
			<Placeholder className="pb-8 pt-12 leading-none md:pt-8 xl:pb-4 xl:pt-0" ref={ref}>
				选择一种料理或酒水以继续
			</Placeholder>
		);
	}

	return (
		<Card
			fullWidth
			shadow="sm"
			classNames={{
				base: twJoin(isShowBackgroundImage && 'bg-content1/40 backdrop-blur'),
			}}
			ref={ref}
		>
			<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
				<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
					<div className="flex items-center gap-2">
						{currentRecipeData ? (
							(() => {
								const isisDarkMatterOrNormalMeal = isDarkMatter || !hasMystiaCooker;
								const originalCooker = instance_recipe.getPropsByName(currentRecipeData.name, 'cooker');
								const cooker = isisDarkMatterOrNormalMeal
									? originalCooker
									: (`夜雀${originalCooker}` as const);
								const recipeName = isDarkMatter ? '黑暗物质' : currentRecipeData.name;
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
												onClick={handleCookerClick}
												onKeyDown={(event) => {
													if (checkA11yConfirmKey(event)) {
														handleCookerClick();
													}
												}}
												role={isDarkMatter ? undefined : 'button'}
												tabIndex={isDarkMatter ? undefined : 0}
												aria-label={label}
												className={twJoin(!isDarkMatter && 'cursor-pointer')}
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
						aria-label={`保存套餐，当前${currentRating ? `评级为${currentRating}` : '未评级'}`}
						className={twJoin(
							'flex-col gap-0 text-xs leading-none md:w-auto',
							isSaveButtonDisabled && 'opacity-disabled'
						)}
					>
						<span>保存套餐</span>
						<span>
							<Price>
								{(currentBeverageName
									? instance_beverage.getPropsByName(currentBeverageName, 'price')
									: 0) +
									(currentRecipeData?.name
										? instance_recipe.getPropsByName(
												isDarkMatter ? '黑暗物质' : currentRecipeData.name,
												'price'
											)
										: 0)}
							</Price>
						</span>
					</Button>
				</Tooltip>
			</div>
		</Card>
	);
});
