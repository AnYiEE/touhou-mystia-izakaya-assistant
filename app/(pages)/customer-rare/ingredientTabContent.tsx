import { memo, useCallback, useMemo } from 'react';
import { curry, curryRight, debounce } from 'lodash';

import { useVibrate } from '@/hooks';

import {
	Badge,
	Button,
	ScrollShadow,
	Tooltip,
	cn,
} from '@/design/ui/components';

import Placeholder from '@/components/placeholder';
import PressElement from '@/components/pressElement';
import Sprite from '@/components/sprite';

import type { IIngredientsTabStyle } from './types';
import {
	DARK_MATTER_META_MAP,
	DYNAMIC_TAG_MAP,
	type TIngredientName,
	type TIngredientTag,
	type TRecipeTag,
} from '@/data';
import { customerRareStore as store } from '@/stores';
import {
	checkA11yConfirmKey,
	checkLengthEmpty,
	intersection,
	toArray,
	toGetItemWithKey,
	toSet,
	union,
} from '@/utilities';
import { type Ingredient } from '@/utils';
import type { TItemData, TRecipe } from '@/utils/types';

interface IProps {
	ingredientTabStyle: IIngredientsTabStyle;
	sortedData: TItemData<Ingredient>;
}

export default memo<IProps>(function IngredientTabContent({
	ingredientTabStyle,
	sortedData,
}) {
	const vibrate = useVibrate();

	const currentCustomerName = store.shared.customer.name.use();
	const currentCustomerOrderRecipeTag =
		store.shared.customer.order.use().recipeTag;
	const currentCustomerPopularTrend =
		store.shared.customer.popularTrend.use();
	const currentRecipeData = store.shared.recipe.data.use();
	const isDarkMatter = store.shared.customer.isDarkMatter.use();
	const isFamousShop = store.shared.customer.famousShop.use();

	const instance_customer = store.instances.customer.get();
	const instance_ingredient = store.instances.ingredient.get();
	const instance_recipe = store.instances.recipe.get();

	const currentRecipe = useMemo(
		() =>
			currentRecipeData
				? instance_recipe.getPropsByName(currentRecipeData.name)
				: null,
		[currentRecipeData, instance_recipe]
	);

	const darkIngredients = useMemo(
		() =>
			toSet(
				sortedData
					.filter(
						({ tags }) =>
							!checkLengthEmpty(
								intersection(
									tags,
									currentRecipe?.negativeTags ?? []
								)
							)
					)
					.map(toGetItemWithKey('name'))
			),
		[currentRecipe?.negativeTags, sortedData]
	);

	const handleButtonPress = useCallback(() => {
		vibrate();
		store.toggleIngredientTabVisibilityState();
	}, [vibrate]);

	const handleSelect = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			store.onIngredientSelectedChange(ingredient);
		},
		[vibrate]
	);

	if (currentCustomerName === null || currentRecipeData === null) {
		return null;
	}

	if (checkLengthEmpty(sortedData)) {
		return (
			<Placeholder className="pt-4 md:min-h-40 md:pt-0">
				数据为空
			</Placeholder>
		);
	}

	const {
		negativeTags: customerNegativeTags,
		positiveTags: customerPositiveTags,
	} = instance_customer.getPropsByName(currentCustomerName);

	const { extraIngredients: currentRecipeExtraIngredients } =
		currentRecipeData;

	// Checked `currentRecipe` is not null above.
	const _nonNullableRecipe = currentRecipe as TRecipe;

	const {
		ingredients: currentRecipeIngredients,
		positiveTags: currentRecipePositiveTags,
	} = _nonNullableRecipe;
	const currentRecipeAllIngredients = union(
		currentRecipeIngredients,
		currentRecipeExtraIngredients
	);

	const isFullFilled =
		currentRecipeIngredients.length +
			currentRecipeExtraIngredients.length >=
		5;
	const isLargePartitionTagNext =
		currentRecipeIngredients.length +
			currentRecipeExtraIngredients.length ===
		4;
	const shouldCalculateLargePartitionTag =
		isLargePartitionTagNext &&
		currentCustomerPopularTrend.tag === DYNAMIC_TAG_MAP.largePartition;

	const calculateIngredientTagsWithTrend = curryRight(
		instance_ingredient.calculateTagsWithTrend
	)(currentCustomerPopularTrend, isFamousShop);
	const calculateRecipeTagsWithTrend = curryRight(
		instance_recipe.calculateTagsWithTrend
	)(currentCustomerPopularTrend, isFamousShop);
	const composeRecipeTagsWithPopularTrend = curry(
		instance_recipe.composeTagsWithPopularTrend
	)(
		currentRecipeIngredients,
		currentRecipeExtraIngredients,
		currentRecipePositiveTags,
		curry.placeholder,
		currentCustomerPopularTrend
	);

	const currentRecipeExtraIngredientsTags =
		currentRecipeExtraIngredients.flatMap((extraIngredient) =>
			instance_ingredient.getPropsByName(extraIngredient, 'tags')
		);
	const currentRecipeExtraIngredientsTagsWithTrend =
		calculateIngredientTagsWithTrend(currentRecipeExtraIngredientsTags);
	const currentRecipeComposedTags = composeRecipeTagsWithPopularTrend(
		currentRecipeExtraIngredientsTagsWithTrend
	);
	const currentRecipeTagsWithTrend = union(
		calculateRecipeTagsWithTrend(currentRecipeComposedTags)
	);

	return (
		<>
			<ScrollShadow
				className={cn(
					'px-2 transition-all motion-reduce:transition-none xl:max-h-[calc(var(--safe-h-dvh)-10.25rem-env(titlebar-area-height,0rem))]',
					ingredientTabStyle.classNames.content
				)}
			>
				<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
					{sortedData.map(({ name, tags }, index) => {
						if (isFullFilled) {
							return (
								<div
									key={index}
									className="flex cursor-not-allowed flex-col items-center opacity-40 brightness-50 dark:opacity-80"
								>
									<Sprite
										target="ingredient"
										name={name}
										size={3}
									/>
									<span className="whitespace-nowrap text-center text-tiny">
										{name}
									</span>
								</div>
							);
						}

						const tagsWithTrend = calculateIngredientTagsWithTrend(
							tags
						) as TRecipeTag[];
						const allTagsWithTrend = union(
							currentRecipeTagsWithTrend,
							tagsWithTrend
						);

						const before = composeRecipeTagsWithPopularTrend(
							currentRecipeTagsWithTrend as TIngredientTag[]
						);
						const after = composeRecipeTagsWithPopularTrend(
							allTagsWithTrend as TIngredientTag[]
						);

						let scoreChange =
							instance_recipe.getIngredientScoreChange(
								before,
								after,
								customerPositiveTags,
								customerNegativeTags
							);

						// The customer like or dislike the large partition tag.
						scoreChange -= Number(
							isLargePartitionTagNext &&
								(customerNegativeTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.largePartition
								) &&
								!before.includes(DYNAMIC_TAG_MAP.largePartition)
						);
						scoreChange += Number(
							isLargePartitionTagNext &&
								(customerPositiveTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.largePartition
								) &&
								!before.includes(DYNAMIC_TAG_MAP.largePartition)
						);

						// The current popular tag is the large partition tag and the customer has popular tags.
						scoreChange -= Number(
							shouldCalculateLargePartitionTag &&
								(customerNegativeTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.popularNegative
								) &&
								currentCustomerPopularTrend.isNegative
						);
						scoreChange -= Number(
							shouldCalculateLargePartitionTag &&
								(customerNegativeTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.popularPositive
								) &&
								!currentCustomerPopularTrend.isNegative
						);
						scoreChange += Number(
							shouldCalculateLargePartitionTag &&
								(customerPositiveTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.popularNegative
								) &&
								currentCustomerPopularTrend.isNegative
						);
						scoreChange += Number(
							shouldCalculateLargePartitionTag &&
								(customerPositiveTags as TRecipeTag[]).includes(
									DYNAMIC_TAG_MAP.popularPositive
								) &&
								!currentCustomerPopularTrend.isNegative
						);

						const isDarkIngredient = darkIngredients.has(name);

						// The customer has a ingredient-based easter agg.
						const {
							ingredient: easterEggIngredient,
							score: easterEggScore,
						} = instance_customer.checkIngredientEasterEgg({
							currentCustomerName,
							currentIngredients: union(
								toArray(currentRecipeAllIngredients, name)
							),
							currentRecipeName:
								isDarkIngredient || isDarkMatter
									? DARK_MATTER_META_MAP.name
									: currentRecipeData.name,
						});
						if (
							name === easterEggIngredient &&
							!currentRecipeAllIngredients.includes(
								easterEggIngredient
							)
						) {
							// The initial score of the Easter egg is 0.
							// If it remains 0 after calculation, it means that the highest rating is restricted;
							// otherwise, it restricts the lowest rating.
							scoreChange =
								easterEggScore === 0 ? -Infinity : Infinity;
						}

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
						const isOrderTag =
							currentCustomerOrderRecipeTag !== null &&
							tagsWithTrend.includes(
								currentCustomerOrderRecipeTag
							) &&
							after.includes(currentCustomerOrderRecipeTag) &&
							!before.includes(currentCustomerOrderRecipeTag);

						const color = isOrderTag
							? 'secondary'
							: isUp
								? 'success'
								: isDown
									? 'danger'
									: 'default';
						const score = isUp
							? `+${scoreChange}`
							: `${scoreChange}`;

						const badgeContent = isDarkIngredient
							? '!!'
							: isHLowestRestricted
								? '++'
								: isHightestRestricted
									? '--'
									: isNoChange
										? ''
										: score;
						const tooltipContent = `点击：加入额外食材【${name}】${isNoChange ? '' : `，${isDarkIngredient ? `制作【${DARK_MATTER_META_MAP.name}】` : isHLowestRestricted ? '最低评级受限' : isHightestRestricted ? '最高评级受限' : `匹配度${score}${isOrderTag ? '（点单需求）' : ''}`}`}`;

						return (
							<Tooltip
								key={index}
								disableBlur
								showArrow
								closeDelay={0}
								color={color}
								content={tooltipContent}
								offset={scoreChange > 1 ? 10 : 7}
								size="sm"
							>
								<PressElement
									as="div"
									onPress={() => {
										handleSelect(name);
									}}
									role="button"
									tabIndex={0}
									aria-label={tooltipContent}
									className={cn(
										'group flex cursor-pointer flex-col items-center transition motion-reduce:transition-none',
										{
											'opacity-40 brightness-50 hover:opacity-100 hover:brightness-100 dark:opacity-80 dark:hover:opacity-100':
												isNoChange,
										}
									)}
								>
									<Badge
										color={color}
										content={badgeContent}
										isInvisible={isNoChange}
										size="sm"
										classNames={{
											badge: cn('font-mono', {
												'brightness-125':
													scoreChange > 2,
												'scale-125 font-medium':
													scoreChange > 1,
											}),
											base: 'group-hover:drop-shadow-md',
										}}
									>
										<Sprite
											target="ingredient"
											name={name}
											size={3}
											className="transition group-hover:scale-105 motion-reduce:transition-none"
										/>
									</Badge>
									<span className="whitespace-nowrap text-center text-tiny text-default-800 transition-colors group-hover:text-default-900 motion-reduce:transition-none">
										{name}
									</span>
								</PressElement>
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
					onClick={handleButtonPress}
					onKeyDown={debounce(checkA11yConfirmKey(handleButtonPress))}
					aria-label={ingredientTabStyle.ariaLabel}
					className="h-4 w-4/5 text-default-400"
				>
					{ingredientTabStyle.buttonNode}
				</Button>
			</div>
		</>
	);
});

export type { IProps as IIngredientTabContentProps };
