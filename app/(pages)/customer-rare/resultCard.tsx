import {forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx';

import {Button, Card} from '@nextui-org/react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCircleXmark, faPlus, faQuestion} from '@fortawesome/free-solid-svg-icons';

import Placeholder from './placeholder';
import Sprite from '@/components/sprite';

import {useCustomerRareStore} from '@/stores';

interface IPlusProps {
	className?: string;
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

interface IUnknownItemProps {
	className?: string;
	title: string;
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

	const selectedMealRecipe = store.share.selected.recipe.use();

	const ingredients = useMemo(() => selectedMealRecipe?.ingredients ?? [], [selectedMealRecipe?.ingredients]);
	const filledIngredients = useMemo(() => [...ingredients, ...Array<null>(5).fill(null)].slice(0, 5), [ingredients]);

	return (
		<div className="flex items-center gap-x-3">
			{filledIngredients.map((ingredient, index) =>
				ingredient ? (
					ingredient.removeable ? (
						<span className="flex items-center">
							<span
								onClick={() => {
									store.share.selected.recipe.set((prev) => {
										if (prev) {
											prev.ingredients = ingredients.filter(
												(item) => item.index !== ingredient.index
											);
										}
									});
								}}
								className="absolute flex h-10 w-10 cursor-pointer items-center justify-center bg-foreground bg-opacity-50 text-background opacity-0 transition-opacity hover:opacity-100"
								title={`删除${ingredient.name}`}
							>
								<FontAwesomeIcon icon={faCircleXmark} size="1x" />
							</span>
							<Sprite key={index} target="ingredient" name={ingredient.name} size={2.5} />
						</span>
					) : (
						<Sprite key={index} target="ingredient" name={ingredient.name} size={2.5} />
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

		const currentCustomerName = store.share.customer.data.use()?.name;
		const currentBeverage = store.share.beverage.data.use();
		const currentRecipe = store.share.recipe.data.use();
		const currentSelected = store.share.selected.use();
		const savedMeal = store.page.selected.use();

		const handleSaveButtonPress = useCallback(() => {
			if (!currentCustomerName) {
				return;
			}

			const saveObject = {
				recipe: currentSelected.recipe!.name,
				beverage: currentSelected.beverage!,
				ingredients: currentSelected.recipe!.ingredients.filter((ingredient) => ingredient !== null),
				kitchenware: currentSelected.recipe!.kitchenware,
			} as const;

			store.page.selected.set((prev) => {
				if (currentCustomerName in prev) {
					const lastItem = prev[currentCustomerName]!.at(-1);
					const index = lastItem ? lastItem.index + 1 : 0;
					prev[currentCustomerName]!.push({...saveObject, index});
				} else {
					prev[currentCustomerName] = [{index: 0, ...saveObject}];
				}
			});
		}, [currentCustomerName, currentSelected.beverage, currentSelected.recipe, store.page.selected]);

		if (!currentRecipe && !currentBeverage && !currentSelected.recipe && !currentSelected.beverage) {
			if (currentCustomerName && savedMeal[currentCustomerName]?.length) {
				return null;
			}
			return (
				<Placeholder className="pb-8 pt-16 xl:p-0" ref={ref}>
					选择一种料理或酒水以继续
				</Placeholder>
			);
		}

		return (
			<Card fullWidth shadow="sm" ref={ref}>
				<div className="flex flex-col items-center gap-4 p-4 md:flex-row">
					<div className="flex flex-1 flex-col flex-wrap items-center gap-3 md:flex-row md:flex-nowrap">
						<div className="flex items-center gap-2">
							{currentSelected.recipe ? (
								<>
									<Sprite target="kitchenware" name={currentSelected.recipe.kitchenware} size={2} />
									<Sprite target="recipe" name={currentSelected.recipe.name} size={2.5} />
								</>
							) : (
								<>
									<UnknownItem title="请选择料理" size={1.5} />
									<UnknownItem title="请选择料理" />
								</>
							)}
							<Plus />
							{currentSelected.beverage ? (
								<Sprite target="beverage" name={currentSelected.beverage} size={2.5} />
							) : (
								<UnknownItem title="请选择酒水" />
							)}
						</div>
						<Plus />
						<IngredientList />
					</div>
					<Button
						color="primary"
						fullWidth
						isDisabled={!currentSelected.recipe || !currentSelected.beverage}
						size="sm"
						variant="flat"
						onPress={handleSaveButtonPress}
						className="md:w-auto"
					>
						保存套餐
					</Button>
				</div>
			</Card>
		);
	})
);
