import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twMerge} from 'tailwind-merge';

import {Badge, Button, ScrollShadow} from '@nextui-org/react';

import {TrackCategory, trackEvent} from '@/components/analytics';
import Sprite from '@/components/sprite';

import type {IIngredientsTabStyle} from './types';
import {type TIngredientNames} from '@/data';
import type {TRecipeTag} from '@/data/types';
import type {TIngredientInstance} from '@/methods/food/types';
import {useCustomerRareStore, useGlobalStore} from '@/stores';
import {checkA11yConfirmKey, intersection} from '@/utils';

interface IProps {
	ingredientsTabStyle: IIngredientsTabStyle;
	sortedData: TIngredientInstance['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function IngredientsTabContent({ingredientsTabStyle, sortedData}, ref) {
		const customerStore = useCustomerRareStore();
		const globalStore = useGlobalStore();

		const currentCustomer = customerStore.shared.customer.data.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRecipeData = customerStore.shared.recipe.data.use();

		const currentGlobalPopular = globalStore.persistence.popular.use();

		const instance_rare = customerStore.instances.customer_rare.get();
		const instance_special = customerStore.instances.customer_special.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

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

		const handleSelect = useCallback(
			(ingredient: TIngredientNames) => {
				customerStore.shared.customer.popular.set(currentGlobalPopular);
				customerStore.shared.recipe.data.set((prev) => {
					if (prev && currentRecipe && currentRecipe.ingredients.length + prev.extraIngredients.length < 5) {
						prev.extraIngredients.push(ingredient);
					}
				});
				trackEvent(TrackCategory.Select, 'Ingredient', ingredient);
			},
			[
				currentGlobalPopular,
				currentRecipe,
				customerStore.shared.customer.popular,
				customerStore.shared.recipe.data,
			]
		);

		if (!currentCustomer || !currentRecipeData) {
			return null;
		}

		const {target, name: customerName} = currentCustomer;

		const instance_customer = (
			target === 'customer_rare' ? instance_rare : instance_special
		) as typeof instance_rare;

		const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
			instance_customer.getPropsByName(customerName);

		return (
			<>
				<ScrollShadow
					hideScrollBar
					className={twMerge(
						'transition-height xl:h-[calc(100vh-9.75rem-env(titlebar-area-height,0rem))]',
						ingredientsTabStyle.contentClassName
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
									<div key={index} className="flex flex-col items-center">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="whitespace-nowrap text-xs">{name}</span>
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
								customerPositiveTags,
								customerNegativeTags
							);
							if (
								(customerNegativeTags as TRecipeTag[]).includes('大份') &&
								currentRecipe.ingredients.length + extraIngredients.length === 4
							) {
								scoreChange -= 1;
							}
							if (
								(customerPositiveTags as TRecipeTag[]).includes('大份') &&
								currentRecipe.ingredients.length + extraIngredients.length === 4
							) {
								scoreChange += 1;
							}
							return (
								<div
									key={index}
									onClick={() => {
										handleSelect(name);
									}}
									onKeyDown={(event) => {
										if (checkA11yConfirmKey(event)) {
											handleSelect(name);
										}
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
									<span className="whitespace-nowrap text-xs">{name}</span>
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
									<div key={index} className="flex cursor-not-allowed flex-col items-center">
										<Sprite target="ingredient" name={name} size={3} />
										<span className="whitespace-nowrap text-xs">{name}</span>
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
