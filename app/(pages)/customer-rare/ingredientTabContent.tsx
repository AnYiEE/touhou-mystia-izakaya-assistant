import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Badge, Button, ScrollShadow, Tooltip} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import {checkIngredientEasterEgg} from './evaluateMeal';
import type {IIngredientsTabStyle} from './types';
import {type TIngredientNames} from '@/data';
import type {TRecipeTag} from '@/data/types';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {type Ingredient, checkA11yConfirmKey, intersection, toValueWithKey} from '@/utils';

interface IProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: Ingredient['data'];
}

export default memo(
	forwardRef<HTMLDivElement | null, IProps>(function IngredientTabContent({ingredientTabStyle, sortedData}, ref) {
		const vibrate = useVibrate();

		const currentCustomerData = customerStore.shared.customer.data.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRecipeData = customerStore.shared.recipe.data.use();
		const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();

		const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

		const instance_rare = customerStore.instances.customer_rare.get();
		const instance_special = customerStore.instances.customer_special.get();
		const instance_ingredient = customerStore.instances.ingredient.get();
		const instance_recipe = customerStore.instances.recipe.get();

		const data = useMemo(
			() => sortedData.filter(({name}) => !instance_ingredient.blockedIngredients.has(name)),
			[instance_ingredient.blockedIngredients, sortedData]
		);

		const currentRecipe = useMemo(
			() => (currentRecipeData ? instance_recipe.getPropsByName(currentRecipeData.name) : null),
			[currentRecipeData, instance_recipe]
		);

		const darkIngredients = useMemo(
			() =>
				new Set(
					data
						.filter(({tags}) => intersection(tags, currentRecipe?.negativeTags ?? []).length > 0)
						.map(toValueWithKey('name'))
				),
			[currentRecipe?.negativeTags, data]
		);

		const handleButtonPress = useCallback(() => {
			vibrate();
			customerStore.toggleIngredientTabVisibilityState();
		}, [vibrate]);

		const handleSelect = useCallback(
			(ingredient: TIngredientNames) => {
				vibrate();
				customerStore.onIngredientSelectedChange(ingredient);
			},
			[vibrate]
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
						'px-2 transition-all xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
						ingredientTabStyle.classNames.content
					)}
					ref={ref}
				>
					<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
						{data.map(({name, tags}, index) => {
							if (!currentRecipe) {
								return null;
							}
							const {extraIngredients} = currentRecipeData;
							if (currentRecipe.ingredients.length + extraIngredients.length >= 5) {
								return (
									<div
										key={index}
										className="flex cursor-not-allowed flex-col items-center opacity-40 brightness-50 dark:opacity-80"
									>
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
							const allIngredients = [...currentRecipe.ingredients, ...extraIngredients];
							const {ingredient: easterEggIngredient, score: easterEggScore} = checkIngredientEasterEgg({
								currentCustomerName,
								currentIngredients: [...allIngredients, name],
							});
							if (name === easterEggIngredient && !allIngredients.includes(easterEggIngredient)) {
								scoreChange = easterEggScore === 0 ? -Infinity : Infinity;
							}
							const isDarkIngredient = darkIngredients.has(name);
							if (isDarkIngredient) {
								scoreChange = -Infinity;
							}
							if (isDarkMatter) {
								scoreChange = 0;
							}
							const isDown = scoreChange < 0;
							const isUp = scoreChange > 0;
							const isNoChange = scoreChange === 0;
							const isHighest = scoreChange === Infinity;
							const isLowest = scoreChange === -Infinity;
							const color = isUp ? 'success' : isDown ? 'danger' : 'default';
							const score = isUp ? `+${scoreChange}` : `${scoreChange}`;
							const label = `点击：加入额外食材【${name}】${isNoChange ? '' : `，${isDarkIngredient ? '制作【黑暗物质】' : isHighest ? '最低评级受限' : isLowest ? '最高评级受限' : `匹配度${score}`}`}`;
							return (
								<Tooltip
									key={index}
									showArrow
									closeDelay={0}
									color={color}
									content={label}
									offset={scoreChange > 1 ? 10 : 7}
									size="sm"
								>
									<div
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
										aria-label={label}
										className={twJoin(
											'group flex cursor-pointer flex-col items-center transition',
											isNoChange &&
												'opacity-40 brightness-50 hover:opacity-100 hover:brightness-100 dark:opacity-80 dark:hover:opacity-100'
										)}
									>
										<Badge
											color={color}
											content={
												isDarkIngredient
													? '!!'
													: isHighest
														? '++'
														: isLowest
															? '--'
															: isNoChange
																? ''
																: score
											}
											isInvisible={isNoChange}
											size="sm"
											classNames={{
												badge: twJoin(
													'font-mono',
													scoreChange > 1 && 'scale-125 font-medium',
													scoreChange > 2 && 'brightness-125'
												),
												base: 'group-hover:drop-shadow-md',
											}}
										>
											<Sprite
												target="ingredient"
												name={name}
												size={3}
												className="transition group-hover:scale-105"
											/>
										</Badge>
										<span className="whitespace-nowrap text-center text-xs group-hover:font-bold">
											{name}
										</span>
									</div>
								</Tooltip>
							);
						})}
					</div>
				</ScrollShadow>
				<div className="flex justify-center xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onPress={handleButtonPress}
						aria-label={ingredientTabStyle.ariaLabel}
						className={twJoin('h-4 w-4/5 text-default-300', isShowBackgroundImage && 'backdrop-blur')}
					>
						{ingredientTabStyle.buttonNode}
					</Button>
				</div>
			</>
		);
	})
);

export type {IProps as IIngredientTabContentProps};
