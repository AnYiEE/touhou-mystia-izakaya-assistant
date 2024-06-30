import {forwardRef, memo} from 'react';
import clsx from 'clsx';

import {Badge, Button, ScrollShadow} from '@nextui-org/react';

import Placeholder from './placeholder';
import Sprite from '@/components/sprite';

import type {IIngredientsTabStyle} from './types';
import {TIngredientNames} from '@/data';
import type {TIngredientInstance} from '@/methods/food/types';
import {useCustomerRareStore} from '@/stores';
import {getIntersection} from '@/utils';

interface IProps {
	ingredientsTabStyle: IIngredientsTabStyle;
	sortedData: TIngredientInstance['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function IngredientsTabContent({ingredientsTabStyle, sortedData}, ref) {
		const store = useCustomerRareStore();

		const currentCustomer = store.share.customer.data.use();
		const currentRecipeData = store.share.recipe.data.use();

		const instance_ingredient = store.instances.ingredient.get();
		const instance_recipe = store.instances.recipe.get();

		const currentRecipe = currentRecipeData ? instance_recipe.getPropsByName(currentRecipeData.name) : null;

		const darkIngredients = new Set<TIngredientNames>();
		for (const {name, tags} of sortedData) {
			if (getIntersection(tags, currentRecipe?.negativeTags ?? []).length > 0) {
				darkIngredients.add(name);
			}
		}

		sortedData = sortedData.filter(({name}) => !darkIngredients.has(name));

		if (!currentCustomer || !currentRecipeData) {
			store.share.ingredient.filterVisibility.set(false);
			if (currentCustomer) {
				store.share.tab.set('recipe');
			} else {
				store.share.tab.set('customer');
			}
			return (
				<Placeholder className="pt-12 md:pt-[5.5rem] lg:pt-20 xl:pt-0" ref={ref}>
					选择一种料理以继续
				</Placeholder>
			);
		}

		const {target, name: customerName} = currentCustomer;
		const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} = store.instances[
			target as 'customer_rare'
		]
			.get()
			.getPropsByName(customerName);

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={clsx(
						'transition-[height] xl:h-[calc(100vh-9.75rem)]',
						ingredientsTabStyle.contentClassName
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-[repeat(auto-fill,3rem)] justify-around gap-4">
						{sortedData.map(({name, tags}, index) => {
							if (!currentRecipe) {
								return null;
							}
							const {extraIngredients} = currentRecipeData;
							if (currentRecipe.ingredients.length + extraIngredients.length >= 5) {
								return (
									<div key={index} className="flex flex-col items-center">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="break-keep text-xs">{name}</span>
									</div>
								);
							}
							const extraTags: string[] = [];
							for (const extraIngredient of extraIngredients) {
								extraTags.push(...instance_ingredient.getPropsByName(extraIngredient, 'tags'));
							}
							const before = instance_recipe.composeTags(
								currentRecipe.ingredients,
								extraIngredients,
								currentRecipe.positiveTags,
								extraTags
							);
							const after = instance_recipe.composeTags(
								currentRecipe.ingredients,
								extraIngredients,
								currentRecipe.positiveTags,
								[...extraTags, ...tags]
							);
							const scoreChange = instance_recipe.getIngredientScoreChange(
								before,
								after,
								customerPositiveTags,
								customerNegativeTags
							);
							return (
								<div
									key={index}
									onClick={() => {
										store.share.recipe.data.set((prev) => {
											if (
												prev &&
												currentRecipe.ingredients.length + prev.extraIngredients.length < 5
											) {
												prev.extraIngredients.push(name);
											}
										});
									}}
									className="flex cursor-pointer flex-col items-center"
									title={`加入${name}`}
								>
									<Badge
										color={scoreChange > 0 ? 'success' : scoreChange < 0 ? 'danger' : 'default'}
										content={
											scoreChange > 0 ? `+${scoreChange}` : scoreChange < 0 ? scoreChange : ''
										}
										isDot={scoreChange === 0}
										size="sm"
									>
										<Sprite target="ingredient" name={name} size={3} title={`加入${name}`} />
									</Badge>
									<span className="break-keep text-xs">{name}</span>
								</div>
							);
						})}
					</div>
					{darkIngredients.size > 0 && (
						<>
							<div className="my-4 flex items-center">
								<div className="h-px w-full bg-foreground-300"></div>
								<div className="select-none text-nowrap text-sm font-light text-foreground-500">
									制作黑暗料理？
								</div>
								<div className="h-px w-full bg-foreground-300"></div>
							</div>
							<div className="m-2 grid grid-cols-[repeat(auto-fill,2.5rem)] justify-around gap-4 lg:grid-cols-[repeat(auto-fill,3rem)]">
								{[...darkIngredients].map((name, index) => (
									<div key={index} className="flex flex-col items-center">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="break-keep text-xs">{name}</span>
									</div>
								))}
							</div>
						</>
					)}
				</ScrollShadow>
				<div className="absolute flex w-[86%] justify-center md:w-[93%] xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onPress={store.toggleIngredientTabVisibilityState}
						className="h-4 w-4/5 text-default-500"
					>
						{ingredientsTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);
