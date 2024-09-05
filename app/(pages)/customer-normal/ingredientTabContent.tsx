import {forwardRef, memo, useCallback, useMemo} from 'react';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Badge, Button, ScrollShadow, Tooltip} from '@nextui-org/react';

import Sprite from '@/components/sprite';

import {type IIngredientTabContentProps} from '@/(pages)/customer-rare/ingredientTabContent';
import {type TIngredientNames} from '@/data';
import type {TRecipeTag} from '@/data/types';
import {customerNormalStore as customerStore, globalStore} from '@/stores';
import {checkA11yConfirmKey, intersection, toValueWithKey} from '@/utils';

export default memo(
	forwardRef<HTMLDivElement | null, IIngredientTabContentProps>(function IngredientsTabContent(
		{ingredientTabStyle, sortedData},
		ref
	) {
		const vibrate = useVibrate();

		const currentCustomerName = customerStore.shared.customer.name.use();
		const currentCustomerPopular = customerStore.shared.customer.popular.use();
		const currentRecipeData = customerStore.shared.recipe.data.use();

		const isShowBackgroundImage = globalStore.persistence.backgroundImage.use();

		const instance_customer = customerStore.instances.customer.get();
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
						.map(toValueWithKey('name'))
				),
			[currentRecipe?.negativeTags, sortedData]
		);

		sortedData = useMemo(
			() => sortedData.filter(({name}) => !darkIngredients.has(name)),
			[darkIngredients, sortedData]
		);

		const handleSelect = useCallback(
			(ingredient: TIngredientNames) => {
				vibrate();
				customerStore.onIngredientSelectedChange(ingredient);
			},
			[vibrate]
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
					className={twMerge(
						'transition-all xl:max-h-[calc(var(--safe-h-dvh)-9.75rem-env(titlebar-area-height,0rem))]',
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
							const isDown = scoreChange < 0;
							const isUp = scoreChange > 0;
							const isNoChange = scoreChange === 0;
							const color = isUp ? 'success' : isDown ? 'danger' : 'default';
							const score = isUp ? `+${scoreChange}` : `${scoreChange}`;
							const label = `点击：加入额外食材【${name}】${isNoChange ? '' : `，匹配度${score}`}`;
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
											content={isNoChange ? '' : score}
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
										<span className="whitespace-nowrap text-center text-xs">{name}</span>
									</div>
								))}
							</div>
						</>
					)}
				</ScrollShadow>
				<div className="flex justify-center xl:hidden">
					<Button
						isIconOnly
						size="sm"
						variant="flat"
						onPress={customerStore.toggleIngredientTabVisibilityState}
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
