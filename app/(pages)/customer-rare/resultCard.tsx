import {type HTMLAttributes, forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx/lite';

import {Button, Card, Tooltip} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark, faPlus, faQuestion} from '@fortawesome/free-solid-svg-icons';

import Placeholder from './placeholder';
import Sprite from '@/components/sprite';

import {type TIngredientNames} from '@/data';
import {useCustomerRareStore} from '@/stores';
import {checkA11yConfirmKey, removeLastElement} from '@/utils';

interface IPlusProps extends Pick<HTMLAttributes<HTMLSpanElement>, 'className'> {
	size?: number;
}

export const Plus = memo(
	forwardRef<HTMLSpanElement | null, IPlusProps>(function Plus({className, size = 1}, ref) {
		const remString = `${size}rem`;

		return (
			<span
				className={clsx('mx-1 text-center', className)}
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
				className={clsx('outline-3 inline-block text-center outline-double', className)}
				style={{
					fontSize: remString,
					width: remString,
				}}
				title={title}
				ref={ref}
			>
				<FontAwesomeIcon icon={faQuestion} className="rotate-12" />
			</span>
		);
	})
);

const IngredientList = memo(function IngredientsList() {
	const store = useCustomerRareStore();

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
		const store = useCustomerRareStore();

		const currentCustomerName = store.shared.customer.data.use()?.name;
		const currentBeverageName = store.shared.beverage.name.use();
		const currentRecipe = store.shared.recipe.data.use();
		const hasMystiaCooker = store.shared.customer.hasMystiaCooker.use();
		const currentOrder = store.shared.customer.order.use();
		const currentCustomerPopular = store.shared.customer.popular.use();
		const currentRating = store.shared.customer.rating.use();
		const savedMeal = store.persistence.meals.use();

		const instance_beverage = store.instances.beverage.get();
		const instance_recipe = store.instances.recipe.get();

		const isSaveButtonDisabled =
			!currentBeverageName ||
			!currentRecipe ||
			!currentOrder.beverageTag ||
			!(currentOrder.recipeTag || hasMystiaCooker);

		const handleSaveButtonPress = useCallback(() => {
			if (!currentCustomerName || !currentBeverageName || !currentRecipe) {
				return;
			}

			const saveObject = {
				beverage: currentBeverageName,
				extraIngredients: currentRecipe.extraIngredients,
				hasMystiaCooker,
				order: currentOrder,
				popular: currentCustomerPopular,
				price:
					instance_beverage.getPropsByName(currentBeverageName).price +
					instance_recipe.getPropsByName(currentRecipe.name).price, // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rating: currentRating!,
				recipe: currentRecipe.name,
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
		}, [
			currentBeverageName,
			currentCustomerName,
			currentCustomerPopular,
			currentOrder,
			currentRating,
			currentRecipe,
			hasMystiaCooker,
			instance_beverage,
			instance_recipe,
			store.persistence.meals,
		]);

		if (!currentBeverageName && !currentRecipe) {
			if (currentCustomerName && savedMeal[currentCustomerName]?.length) {
				return null;
			}
			return (
				<Placeholder className="pb-8 pt-16 md:pt-8 xl:p-0" ref={ref}>
					选择一种料理或酒水以继续
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
									<Tooltip
										showArrow
										content={`单击：将此点单标记为使用${hasMystiaCooker ? '非' : ''}夜雀系列厨具制作`}
									>
										<Sprite
											target="cooker"
											name={instance_recipe.getPropsByName(currentRecipe.name, 'cooker')}
											size={2}
											onClick={() => {
												store.shared.customer.hasMystiaCooker.set((prev) => !prev);
											}}
											onKeyDown={(event) => {
												if (checkA11yConfirmKey(event)) {
													store.shared.customer.hasMystiaCooker.set((prev) => !prev);
												}
											}}
											role="button"
											tabIndex={0}
											aria-label={`单击：将此点单标记为使用${hasMystiaCooker ? '非' : ''}夜雀系列厨具制作`}
											className={clsx(
												'cursor-pointer',
												hasMystiaCooker &&
													'rounded-full ring-4 ring-warning-400 dark:ring-warning-200'
											)}
										/>
									</Tooltip>
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
						content={`请选择${currentBeverageName ? '' : '酒水、'}${currentRecipe ? '' : '料理、'}客人点单需求`}
						isDisabled={!isSaveButtonDisabled}
					>
						<span>
							<Button
								color="primary"
								fullWidth
								isDisabled={isSaveButtonDisabled}
								size="sm"
								variant="flat"
								onPress={handleSaveButtonPress}
								aria-label={`保存套餐，当前评级为${currentRating}`}
								className="md:w-auto"
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
