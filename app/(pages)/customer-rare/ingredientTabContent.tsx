import { memo, useCallback, useMemo } from 'react';

import { useVibrate } from '@/hooks';

import Placeholder from '@/components/placeholder';

import IngredientTabContentSkeleton from '@/(pages)/customer-shared/ingredientTabContentSkeleton';
import IngredientTabItemPresenter from '@/(pages)/customer-shared/ingredientTabItemPresenter';

import type { IIngredientTabContentProps } from '@/(pages)/customer-shared/ingredientTabContentTypes';
import { DARK_MATTER_META_MAP, type TIngredientName } from '@/data';
import { customerRareStore as store } from '@/stores';
import { checkLengthEmpty } from '@/utilities';

interface IProps extends IIngredientTabContentProps {}

export default memo<IProps>(function IngredientTabContent({
	ingredientTabStyle,
	sortedData,
}) {
	const vibrate = useVibrate();

	const currentCustomerName = store.shared.customer.name.use();
	const currentRecipeData = store.shared.recipe.data.use();
	const { changesByName } = store.ingredientScoreChanges.use();

	const instance_recipe = store.instances.recipe.get();

	const currentRecipe = useMemo(
		() =>
			currentRecipeData
				? instance_recipe.getPropsByName(currentRecipeData.name)
				: null,
		[currentRecipeData, instance_recipe]
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

	if (
		currentCustomerName === null ||
		currentRecipe === null ||
		currentRecipeData === null
	) {
		return null;
	}

	if (checkLengthEmpty(sortedData)) {
		return (
			<Placeholder className="pt-4 md:min-h-40 md:pt-0">
				数据为空
			</Placeholder>
		);
	}

	const { ingredients: currentRecipeIngredients } = currentRecipe;

	const isFullFilled =
		currentRecipeIngredients.length +
			currentRecipeData.extraIngredients.length >=
		5;

	return (
		<IngredientTabContentSkeleton
			ingredientTabStyle={ingredientTabStyle}
			onToggle={handleButtonPress}
		>
			{sortedData.map(({ name }, index) => {
				const ingredientScoreChange = changesByName[name] ?? null;
				const restriction =
					ingredientScoreChange?.restriction ?? 'none';
				const scoreChange = ingredientScoreChange?.scoreChange ?? 0;
				const isDarkIngredient =
					ingredientScoreChange?.isDarkIngredient ?? false;
				const isOrderTag = ingredientScoreChange?.isOrderTag ?? false;
				const isHighestRestricted = restriction === 'highestRestricted';
				const isLowestRestricted = restriction === 'lowestRestricted';

				if (isFullFilled) {
					return (
						<IngredientTabItemPresenter
							key={index}
							className="opacity-40 brightness-50 dark:opacity-80"
							kind="static"
							name={name}
						/>
					);
				}

				const isDown = scoreChange < 0;
				const isUp = scoreChange > 0;
				const isNoChange = scoreChange === 0;

				const color = isOrderTag
					? 'secondary'
					: isUp
						? 'success'
						: isDown
							? 'danger'
							: 'default';
				const score = isUp ? `+${scoreChange}` : `${scoreChange}`;

				const badgeContent = isDarkIngredient
					? '!!'
					: isLowestRestricted
						? '++'
						: isHighestRestricted
							? '--'
							: isNoChange
								? ''
								: score;
				const tooltipContent = `点击：加入额外食材【${name}】${isNoChange ? '' : `，${isDarkIngredient ? `制作【${DARK_MATTER_META_MAP.name}】` : isLowestRestricted ? '最低评级受限' : isHighestRestricted ? '最高评级受限' : `匹配度${score}${isOrderTag ? '（点单需求）' : ''}`}`}`;

				return (
					<IngredientTabItemPresenter
						key={index}
						badgeContent={badgeContent}
						color={color}
						isNoChange={isNoChange}
						kind="interactive"
						name={name}
						onPress={() => {
							handleSelect(name);
						}}
						scoreChange={scoreChange}
						tooltipContent={tooltipContent}
					/>
				);
			})}
		</IngredientTabContentSkeleton>
	);
});
