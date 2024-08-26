import {forwardRef, memo, useMemo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Badge, Button, ScrollShadow} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import type {IIngredientsTabStyle} from './types';
import type {TRecipeTag} from '@/data/types';
import type {TIngredientInstance} from '@/methods/food/types';
import {customerRareStore as store} from '@/stores';
import {checkA11yConfirmKey, intersection} from '@/utils';

interface IProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TIngredientInstance['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function IngredientTabContent({ingredientTabStyle, sortedData}, ref) {
		const currentCustomerData = store.shared.customer.data.use();
		const currentCustomerPopular = store.shared.customer.popular.use();
		const currentRecipeData = store.shared.recipe.data.use();

		const instance_rare = store.instances.customer_rare.get();
		const instance_special = store.instances.customer_special.get();
		const instance_ingredient = store.instances.ingredient.get();
		const instance_recipe = store.instances.recipe.get();

		const currentRecipe = useMemo(
			() => (currentRecipeData ? instance_recipe.getPropsByName(currentRecipeData.name) : null),
			[currentRecipeData, instance_recipe]
		);

		const darkIngredients = useMemo(
			() =>
				new Set(
					sortedData
						.filter(({tags}) => intersection(tags, currentRecipe?.negativeTags ?? []).length > 0)
						.map(({name}) => name)
				),
			[currentRecipe?.negativeTags, sortedData]
		);

		sortedData = useMemo(
			() => sortedData.filter(({name}) => !darkIngredients.has(name)),
			[darkIngredients, sortedData]
		);

		if (!currentCustomerData || !currentRecipeData) {
			return null;
		}

		const {target, name: currentCustomerName} = currentCustomerData;

		const instance_customer = (
			target === 'customer_rare' ? instance_rare : instance_special
		) as typeof instance_rare;

		const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
			instance_customer.getPropsByName(currentCustomerName);

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={twMerge(
						'transition-height xl:h-[calc(100vh-9.75rem-env(titlebar-area-height,0rem))]',
						ingredientTabStyle.classNames.content
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
						{sortedData.map(({name, tags}, index) => {
							if (!currentRecipe) {
								return null;
							}
							const {extraIngredients} = currentRecipeData;
							if (currentRecipe.ingredients.length + extraIngredients.length >= 5) {
								return (
									<div key={index} className="grid">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="whitespace-nowrap text-center text-xs">{name}</span>
									</div>
								);
							}
							const extraTags = extraIngredients.flatMap((extraIngredient) =>
								instance_ingredient.getPropsByName(extraIngredient, 'tags')
							);
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
								customerNegativeTags,
								customerPositiveTags
							);
							const isLargePartitionTagNext =
								currentRecipe.ingredients.length + extraIngredients.length === 4;
							scoreChange -= Number(
								isLargePartitionTagNext && (customerNegativeTags as TRecipeTag[]).includes('大份')
							);
							scoreChange += Number(
								isLargePartitionTagNext && (customerPositiveTags as TRecipeTag[]).includes('大份')
							);
							const shouldCalculateLargePartitionTag =
								isLargePartitionTagNext && currentCustomerPopular.tag === '大份';
							scoreChange -= Number(
								shouldCalculateLargePartitionTag &&
									(customerNegativeTags as TRecipeTag[]).includes('流行厌恶') &&
									currentCustomerPopular.isNegative
							);
							scoreChange -= Number(
								shouldCalculateLargePartitionTag &&
									(customerNegativeTags as TRecipeTag[]).includes('流行喜爱') &&
									!currentCustomerPopular.isNegative
							);
							scoreChange += Number(
								shouldCalculateLargePartitionTag &&
									(customerPositiveTags as TRecipeTag[]).includes('流行厌恶') &&
									currentCustomerPopular.isNegative
							);
							scoreChange += Number(
								shouldCalculateLargePartitionTag &&
									(customerPositiveTags as TRecipeTag[]).includes('流行喜爱') &&
									!currentCustomerPopular.isNegative
							);
							return (
								<div
									key={index}
									onClick={() => {
										store.onIngredientSelectedChange(name);
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											store.onIngredientSelectedChange(name);
										}
									}}
									role="button"
									tabIndex={0}
									aria-label={`加入${name}，匹配度${scoreChange}`}
									title={`加入${name}`}
									className="grid cursor-pointer transition hover:scale-105 hover:drop-shadow-md"
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
									<span className="whitespace-nowrap text-center text-xs">{name}</span>
								</div>
							);
						})}
					</div>
					{darkIngredients.size > 0 && (
						<>
							<div className="my-4 flex items-center">
								<div className="h-px w-full bg-foreground-300"></div>
								<div className="select-none whitespace-nowrap text-sm font-light text-foreground-500">
									制作黑暗料理？
								</div>
								<div className="h-px w-full bg-foreground-300"></div>
							</div>
							<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
								{[...darkIngredients].map((name, index) => (
									<div key={index} className="grid cursor-not-allowed">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="whitespace-nowrap text-center text-xs">{name}</span>
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
						aria-label={ingredientTabStyle.ariaLabel}
						className="h-4 w-4/5 text-default-500"
					>
						{ingredientTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);

export type {IProps as IIngredientTabContentProps};
