import {memo, useCallback, useMemo} from 'react';
import {curry, curryRight} from 'lodash';
import {twJoin, twMerge} from 'tailwind-merge';

import {useVibrate} from '@/hooks';

import {Badge, Button, ScrollShadow} from '@nextui-org/react';

import Placeholder from '@/components/placeholder';
import Sprite from '@/components/sprite';
import Tooltip from '@/components/tooltip';

import {checkIngredientEasterEgg} from './evaluateMeal';
import type {IIngredientsTabStyle} from './types';
import {
	DARK_MATTER_NAME,
	TAG_LARGE_PARTITION,
	TAG_POPULAR_NEGATIVE,
	TAG_POPULAR_POSITIVE,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';
import {customerRareStore as customerStore, globalStore} from '@/stores';
import {type Ingredient, type Recipe, checkA11yConfirmKey, intersection, toValueWithKey, union} from '@/utils';
import type {TItemData, TItemDataItem} from '@/utils/types';

interface IProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<Ingredient>;
}

export default memo<IProps>(function IngredientTabContent({ingredientTabStyle, sortedData}) {
	const vibrate = useVibrate();

	const currentCustomerName = customerStore.shared.customer.name.use();
	const currentCustomerPopular = customerStore.shared.customer.popular.use();
	const currentRecipeData = customerStore.shared.recipe.data.use();
	const isDarkMatter = customerStore.shared.customer.isDarkMatter.use();

	const isHighAppearance = globalStore.persistence.highAppearance.use();

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

	const handleButtonPress = useCallback(() => {
		vibrate();
		customerStore.toggleIngredientTabVisibilityState();
	}, [vibrate]);

	const handleSelect = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			customerStore.onIngredientSelectedChange(ingredient);
		},
		[vibrate]
	);

	if (currentCustomerName === null || currentRecipeData === null) {
		return null;
	}

	if (sortedData.length === 0) {
		return <Placeholder className="pt-4 md:min-h-40 md:pt-0">数据为空</Placeholder>;
	}

	const {negativeTags: customerNegativeTags, positiveTags: customerPositiveTags} =
		instance_customer.getPropsByName(currentCustomerName);

	const {extraIngredients: currentRecipeExtraIngredients} = currentRecipeData;

	// Checked `currentRecipe` is not null above.
	const _nonNullableRecipe = currentRecipe as TItemDataItem<Recipe>;

	const {ingredients: currentRecipeIngredients, positiveTags: currentRecipePositiveTags} = _nonNullableRecipe;
	const currentRecipeAllIngredients = union(currentRecipeIngredients, currentRecipeExtraIngredients);

	const isFullFilled = currentRecipeIngredients.length + currentRecipeExtraIngredients.length >= 5;
	const isLargePartitionTagNext = currentRecipeIngredients.length + currentRecipeExtraIngredients.length === 4;
	const shouldCalculateLargePartitionTag =
		isLargePartitionTagNext && currentCustomerPopular.tag === TAG_LARGE_PARTITION;

	const calculateIngredientTagsWithPopular = curryRight(instance_ingredient.calculateTagsWithPopular)(
		currentCustomerPopular
	);
	const calculateRecipeTagsWithPopular = curryRight(instance_recipe.calculateTagsWithPopular)(currentCustomerPopular);
	const composeRecipeTagsWithPopular = curry(instance_recipe.composeTagsWithPopular)(
		currentRecipeIngredients,
		currentRecipeExtraIngredients,
		currentRecipePositiveTags,
		curry.placeholder,
		currentCustomerPopular
	);

	const currentRecipeExtraIngredientsTags = currentRecipeExtraIngredients.flatMap((extraIngredient) =>
		instance_ingredient.getPropsByName(extraIngredient, 'tags')
	);
	const currentRecipeExtraIngredientsTagsWithPopular = calculateIngredientTagsWithPopular(
		currentRecipeExtraIngredientsTags
	);
	const currentRecipeComposedTags = composeRecipeTagsWithPopular(currentRecipeExtraIngredientsTagsWithPopular);
	const currentRecipeTagsWithPopular = union(calculateRecipeTagsWithPopular(currentRecipeComposedTags));

	return (
		<>
			<ScrollShadow
				hideScrollBar
				className={twMerge(
					'px-2 transition-all xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					ingredientTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
					{sortedData.map(({name, tags}, index) => {
						if (isFullFilled) {
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

						const tagsWithPopular = calculateIngredientTagsWithPopular(tags);
						const allTagsWithPopular = union(currentRecipeTagsWithPopular, tagsWithPopular);

						const before = composeRecipeTagsWithPopular(currentRecipeTagsWithPopular as TIngredientTag[]);
						const after = composeRecipeTagsWithPopular(allTagsWithPopular as TIngredientTag[]);

						let scoreChange = instance_recipe.getIngredientScoreChange(
							before,
							after,
							customerNegativeTags,
							customerPositiveTags
						);

						// The customer like or dislike the large partition tag.
						scoreChange -= Number(
							isLargePartitionTagNext &&
								(customerNegativeTags as TRecipeTag[]).includes(TAG_LARGE_PARTITION)
						);
						scoreChange += Number(
							isLargePartitionTagNext &&
								(customerPositiveTags as TRecipeTag[]).includes(TAG_LARGE_PARTITION)
						);

						// The current popular tag is the large partition tag and the customer has popular tags.
						scoreChange -= Number(
							shouldCalculateLargePartitionTag &&
								(customerNegativeTags as TRecipeTag[]).includes(TAG_POPULAR_NEGATIVE) &&
								currentCustomerPopular.isNegative
						);
						scoreChange -= Number(
							shouldCalculateLargePartitionTag &&
								(customerNegativeTags as TRecipeTag[]).includes(TAG_POPULAR_POSITIVE) &&
								!currentCustomerPopular.isNegative
						);
						scoreChange += Number(
							shouldCalculateLargePartitionTag &&
								(customerPositiveTags as TRecipeTag[]).includes(TAG_POPULAR_NEGATIVE) &&
								currentCustomerPopular.isNegative
						);
						scoreChange += Number(
							shouldCalculateLargePartitionTag &&
								(customerPositiveTags as TRecipeTag[]).includes(TAG_POPULAR_POSITIVE) &&
								!currentCustomerPopular.isNegative
						);

						// The customer has a ingredient-based easter agg.
						const {ingredient: easterEggIngredient, score: easterEggScore} = checkIngredientEasterEgg({
							currentCustomerName,
							currentIngredients: union([...currentRecipeAllIngredients, name]),
						});
						if (
							name === easterEggIngredient &&
							!currentRecipeAllIngredients.includes(easterEggIngredient)
						) {
							// The initial score of the Easter egg is 0.
							// If it remains 0 after calculation, it means that the highest rating is restricted;
							// otherwise, it restricts the lowest rating.
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
						const isHLowestRestricted = scoreChange === Infinity;
						const isHightestRestricted = scoreChange === -Infinity;

						const color = isUp ? 'success' : isDown ? 'danger' : 'default';
						const score = isUp ? `+${scoreChange}` : `${scoreChange}`;

						const badgeContent = isDarkIngredient
							? '!!'
							: isHLowestRestricted
								? '++'
								: isHightestRestricted
									? '--'
									: isNoChange
										? ''
										: score;
						const tooltipContent = `点击：加入额外食材【${name}】${isNoChange ? '' : `，${isDarkIngredient ? `制作【${DARK_MATTER_NAME}】` : isHLowestRestricted ? '最低评级受限' : isHightestRestricted ? '最高评级受限' : `匹配度${score}`}`}`;

						return (
							<Tooltip
								key={index}
								showArrow
								closeDelay={0}
								color={color}
								content={tooltipContent}
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
									aria-label={tooltipContent}
									className={twJoin(
										'group flex cursor-pointer flex-col items-center transition',
										isNoChange &&
											'opacity-40 brightness-50 hover:opacity-100 hover:brightness-100 dark:opacity-80 dark:hover:opacity-100'
									)}
								>
									<Badge
										color={color}
										content={badgeContent}
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
					className={twJoin('h-4 w-4/5 text-default-300', isHighAppearance && 'backdrop-blur')}
				>
					{ingredientTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});

export type {IProps as IIngredientTabContentProps};
