import {type HTMLAttributes, forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useIsTouchOnlyDevice} from '@/hooks';

import {Button, Card, Tooltip} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark, faPlus, faQuestion} from '@fortawesome/free-solid-svg-icons';

import Placeholder from './placeholder';
import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';

import {type TIngredientNames} from '@/data';
import {useCustomerNormalStore} from '@/stores';
import {checkA11yConfirmKey, removeLastElement} from '@/utils';

interface IPlusProps extends Pick<HTMLAttributes<HTMLSpanElement>, 'className'> {
	size?: number;
}

export const Plus = memo(
	forwardRef<HTMLSpanElement | null, IPlusProps>(function Plus({className, size = 1}, ref) {
		const remString = `${size}rem`;

		return (
			<span
				className={twMerge('mx-1 text-center', className)}
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

const UnknownItem = memo(
	forwardRef<HTMLSpanElement | null, IUnknownItemProps>(function UnknownItem({className, title, size = 2}, ref) {
		const remString = `${size}rem`;

		return (
			<span
				role="img"
				title={title}
				className={twMerge('outline-3 inline-block text-center outline-double', className)}
				style={{
					fontSize: remString,
					width: remString,
				}}
				ref={ref}
			>
				<FontAwesomeIcon icon={faQuestion} className="rotate-12" />
			</span>
		);
	})
);

const IngredientList = memo(function IngredientsList() {
	const store = useCustomerNormalStore();

	const currentRecipe = store.shared.recipe.data.use();

	const instance_recipe = store.instances.recipe.get();

	const originalIngredients = useMemo(
		() => (currentRecipe ? instance_recipe.getPropsByName(currentRecipe.name, 'ingredients') : []),
		[currentRecipe, instance_recipe]
	);

	const filledIngredients = useMemo(
		() =>
			[
				...originalIngredients,
				...(currentRecipe?.extraIngredients ?? []),
				...new Array<null>(5).fill(null),
			].slice(0, 5),
		[currentRecipe?.extraIngredients, originalIngredients]
	);

	const handleDelete = useCallback(
		(ingredient: TIngredientNames) => {
			store.shared.recipe.data.set((prev) => {
				if (prev) {
					prev.extraIngredients = removeLastElement(prev.extraIngredients, ingredient);
				}
			});
			trackEvent(TrackCategory.Unselect, 'Ingredient', ingredient);
		},
		[store.shared.recipe.data]
	);

	return (
		<div className="flex items-center gap-x-3">
			{filledIngredients.map((ingredient, index) =>
				ingredient ? (
					index >= originalIngredients.length ? (
						<span
							key={index}
							onKeyDown={(event) => {
								if (checkA11yConfirmKey(event)) {
									handleDelete(ingredient);
								}
							}}
							tabIndex={0}
							aria-label={`删除${ingredient}`}
							className="flex items-center"
						>
							<span
								onClick={() => {
									handleDelete(ingredient);
								}}
								role="button"
								tabIndex={1}
								title={`删除${ingredient}`}
								className="absolute flex h-10 w-10 cursor-pointer items-center justify-center bg-foreground bg-opacity-50 text-background opacity-0 transition-opacity hover:opacity-100"
							>
								<FontAwesomeIcon icon={faCircleXmark} size="1x" />
							</span>
							<Sprite target="ingredient" name={ingredient} size={2.5} />
						</span>
					) : (
						<Sprite key={index} target="ingredient" name={ingredient} size={2.5} />
					)
				) : (
					<UnknownItem key={index} title="空食材" />
				)
			)}
		</div>
	);
});

interface IResultCardProps {}

export default memo(
	forwardRef<HTMLDivElement | null, IResultCardProps>(function ResultCard(_props, ref) {
		const isTouchOnlyDevice = useIsTouchOnlyDevice();
		const store = useCustomerNormalStore();

		const currentCustomerName = store.shared.customer.name.use();
		const currentBeverageName = store.shared.beverage.name.use();
		const currentRecipe = store.shared.recipe.data.use();
		const currentCustomerPopular = store.shared.customer.popular.use();
		const currentRating = store.shared.customer.rating.use();
		const savedMeal = store.persistence.meals.use();

		const instance_recipe = store.instances.recipe.get();

		const saveButtonTooltipTimer = useRef<NodeJS.Timeout>();
		const [isShowSaveButtonTooltip, setIsShowSaveButtonTooltip] = useState(false);
		const isSaveButtonDisabled =
			!currentCustomerName || !currentBeverageName || !currentRecipe || currentRating === null;

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

		const handleSaveButtonMouseEnter = useCallback(() => {
			if (isSaveButtonDisabled && !isTouchOnlyDevice) {
				setIsShowSaveButtonTooltip(true);
			}
		}, [isTouchOnlyDevice, isSaveButtonDisabled]);

		const handleSaveButtonMouseLeave = useCallback(() => {
			if (!isTouchOnlyDevice) {
				setIsShowSaveButtonTooltip(false);
			}
		}, [isTouchOnlyDevice]);

		const handleSaveButtonPress = useCallback(() => {
			if (isSaveButtonDisabled) {
				if (isTouchOnlyDevice) {
					showTooltip();
				}
				return;
			}

			const {extraIngredients, name: currentRecipeName} = currentRecipe;

			const saveObject = {
				beverage: currentBeverageName,
				extraIngredients,
				popular: currentCustomerPopular,
				rating: currentRating,
				recipe: currentRecipeName,
			} as const;

			store.persistence.meals.set((prev) => {
				if (currentCustomerName in prev) {
					const lastItem = prev[currentCustomerName]?.at(-1);
					const index = lastItem ? lastItem.index + 1 : 0;
					prev[currentCustomerName]?.push({...saveObject, index});
				} else {
					prev[currentCustomerName] = [{...saveObject, index: 0}];
				}
			});

			trackEvent(
				TrackCategory.Click,
				'Save Button',
				`${currentRecipeName} - ${currentBeverageName}${extraIngredients.length > 0 ? ` - ${extraIngredients.join(' ')}` : ''}`
			);
		}, [
			currentBeverageName,
			currentCustomerName,
			currentCustomerPopular,
			currentRating,
			currentRecipe,
			isSaveButtonDisabled,
			isTouchOnlyDevice,
			showTooltip,
			store.persistence.meals,
		]);

		useEffect(() => {
			if (isShowSaveButtonTooltip && !isSaveButtonDisabled) {
				hideTooltip();
			}
		}, [hideTooltip, isSaveButtonDisabled, isShowSaveButtonTooltip]);

		if (!currentBeverageName && !currentRecipe) {
			if (currentCustomerName && savedMeal[currentCustomerName]?.length) {
				return null;
			}
			return (
				<Placeholder className="pb-8 pt-16 md:pt-8 xl:p-0" ref={ref}>
					选择点单料理和酒水以继续
				</Placeholder>
			);
		}

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
					<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
						<div className="flex items-center gap-2">
							{currentRecipe ? (
								<>
									<Sprite
										target="cooker"
										name={instance_recipe.getPropsByName(currentRecipe.name, 'cooker')}
										size={2}
									/>
									<Sprite target="recipe" name={currentRecipe.name} size={2.5} />
								</>
							) : (
								<>
									<UnknownItem title="请选择料理" size={1.5} />
									<UnknownItem title="请选择料理" />
								</>
							)}
							<Plus />
							{currentBeverageName ? (
								<Sprite target="beverage" name={currentBeverageName} size={2.5} />
							) : (
								<UnknownItem title="请选择酒水" />
							)}
						</div>
						<Plus />
						<IngredientList />
					</div>
					<Tooltip
						showArrow
						content={`请选择${currentBeverageName ? '' : '酒水'}${currentRecipe ? '' : '料理'}`}
						isOpen={isShowSaveButtonTooltip}
					>
						<span>
							<Button
								fullWidth
								color="primary"
								disableAnimation={isSaveButtonDisabled}
								size="sm"
								variant="flat"
								onMouseEnter={handleSaveButtonMouseEnter}
								onMouseLeave={handleSaveButtonMouseLeave}
								onPress={handleSaveButtonPress}
								aria-label={`保存套餐，当前${currentRating ? `评级为${currentRating}` : '未评级'}`}
								className={twJoin(
									isSaveButtonDisabled &&
										'cursor-default opacity-disabled data-[hover]:opacity-disabled',
									'md:w-auto'
								)}
							>
								保存套餐
							</Button>
						</span>
					</Tooltip>
				</div>
			</Card>
		);
	})
);
