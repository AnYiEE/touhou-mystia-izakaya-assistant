import {forwardRef, memo, useCallback, useMemo} from 'react';
import clsx from 'clsx';
import {intersection} from 'lodash';

import {Badge, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {IIngredientsTabStyle} from './types';
import {type TIngredientNames} from '@/data';
import type {TIngredientTag, TRecipeTag} from '@/data/types';
import type {TIngredientInstance} from '@/methods/food/types';
import {useCustomerNormalStore, useGlobalStore} from '@/stores';

interface IProps {
	ingredientsTabStyle: IIngredientsTabStyle;
	sortedData: TIngredientInstance['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function IngredientsTabContent({ingredientsTabStyle, sortedData}, ref) {
		const customerStore = useCustomerNormalStore();
		const globalStore = useGlobalStore();

		const currentCustomerName = customerStore.shared.customer.name.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRecipeData = customerStore.shared.recipe.data.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();

		const instance_customer = customerStore.instances.customer.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const currentRecipe = useMemo(
			() => (currentRecipeData ? instance_recipe.getPropsByName(currentRecipeData.name) : null),
			[currentRecipeData, instance_recipe]
		);

		const darkIngredients = useMemo(() => {
			const _darkIngredients = new Set<TIngredientNames>();
			for (const {name, tags} of sortedData) {
				if (intersection(tags, currentRecipe?.negativeTags ?? []).length > 0) {
					_darkIngredients.add(name);
				}
			}
			return _darkIngredients;
		}, [currentRecipe?.negativeTags, sortedData]);

		sortedData = useMemo(
			() => sortedData.filter(({name}) => !darkIngredients.has(name)),
			[darkIngredients, sortedData]
		);

		const onSelected = useCallback(
			(ingredient: TIngredientNames) => {
				customerStore.shared.customer.popular.set(currentGlobalPopular);
				customerStore.shared.recipe.data.set((prev) => {
					if (prev && currentRecipe && currentRecipe.ingredients.length + prev.extraIngredients.length < 5) {
						prev.extraIngredients.push(ingredient);
					}
				});
			},
			[
				currentGlobalPopular,
				currentRecipe,
				customerStore.shared.customer.popular,
				customerStore.shared.recipe.data,
			]
		);

		if (!currentCustomerName || !currentRecipeData) {
			return null;
		}

		const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
			instance_customer.getPropsByName(currentCustomerName);

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={clsx(
						'transition-[height] xl:h-[calc(100vh-9.75rem-env(titlebar-area-height,0rem))]',
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
										<span className="text-nowrap break-keep text-xs">{name}</span>
									</div>
								);
							}
							const extraTags: TIngredientTag[] = [];
							for (const extraIngredient of extraIngredients) {
								extraTags.push(...instance_ingredient.getPropsByName(extraIngredient, 'tags'));
							}
							const extraTagsWithPopular = instance_ingredient.calculateTagsWithPopular(
								extraTags,
								currentCustomerPopular
							);
							const before = instance_recipe.composeTags(
								currentRecipe.ingredients,
								extraIngredients,
								currentRecipe.positiveTags,
								extraTagsWithPopular
							);
							const tagsWithPopular = instance_ingredient.calculateTagsWithPopular(
								tags,
								currentCustomerPopular
							);
							const after = instance_recipe.composeTags(
								currentRecipe.ingredients,
								extraIngredients,
								currentRecipe.positiveTags,
								[...extraTagsWithPopular, ...tagsWithPopular]
							);
							let scoreChange = instance_recipe.getIngredientScoreChange(
								before,
								after,
								customerPositiveTags,
								customerNegativeTags
							);
							if (
								(customerNegativeTags as TRecipeTag[]).includes('大份') &&
								currentRecipe.ingredients.length + extraIngredients.length === 4
							) {
								scoreChange -= 1;
							}
							return (
								<div
									key={index}
									onClick={() => {
										onSelected(name);
									}}
									role="button"
									tabIndex={0}
									aria-label={`加入${name}，匹配度${scoreChange}`}
									title={`加入${name}`}
									className="flex cursor-pointer flex-col items-center transition hover:scale-105"
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
									<span className="text-nowrap break-keep text-xs">{name}</span>
								</div>
							);
						})}
					</div>
					{darkIngredients.size > 0 && (
						<>
							<div className="my-4 flex items-center">
								<div className="h-px w-full bg-foreground-300"></div>
								<div className="select-none text-nowrap break-keep text-sm font-light text-foreground-500">
									制作黑暗料理？
								</div>
								<div className="h-px w-full bg-foreground-300"></div>
							</div>
							<div className="m-2 grid grid-cols-[repeat(auto-fill,3rem)] justify-around gap-4">
								{[...darkIngredients].map((name, index) => (
									<div key={index} className="flex cursor-not-allowed flex-col items-center">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="text-nowrap break-keep text-xs">{name}</span>
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
						onPress={customerStore.toggleIngredientTabVisibilityState}
						aria-label={ingredientsTabStyle.ariaLabel}
						className="h-4 w-4/5 text-default-500"
					>
						{ingredientsTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);
