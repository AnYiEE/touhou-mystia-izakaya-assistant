import { memo, useCallback, useMemo } from 'react';

import Placeholder from '@/design/ui/components/placeholder';

import type { TIngredientId } from '@/domain/data/ingredients/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';

import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import IngredientTabContentSkeleton from '@/features/catalog/guests/shared/client/components/ingredientTabContentSkeleton';
import IngredientTabItemPresenter from '@/features/catalog/guests/shared/client/components/ingredientTabItemPresenter';
import type { IIngredientTabContentProps } from '@/features/catalog/guests/shared/ingredientTabContracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';

interface IProps extends IIngredientTabContentProps {}

export default memo<IProps>(function IngredientTabContent({
	ingredientTabStyle,
	sortedData,
}) {
	const vibrate = useVibrate();

	const currentNormalGuest = normalGuestStore.shared.guest.id.use();
	const currentMealFoodData = normalGuestStore.shared.recipe.data.use();
	const { changesById, darkIngredients } =
		normalGuestStore.ingredientScoreChanges.use();

	const foodCatalog = normalGuestStore.instances.recipe.get();

	const currentRecipe = useMemo(
		() =>
			currentMealFoodData
				? foodCatalog.getRecipeOwnerById(currentMealFoodData.recipeId)
						.recipe
				: null,
		[currentMealFoodData, foodCatalog]
	);

	const darkIngredientSet = useMemo(
		() => new Set(darkIngredients),
		[darkIngredients]
	);

	const darkIngredientRows = useMemo(
		() => sortedData.filter(({ id }) => darkIngredientSet.has(id)),
		[darkIngredientSet, sortedData]
	);

	const data = useMemo(
		() => sortedData.filter(({ id }) => !darkIngredientSet.has(id)),
		[darkIngredientSet, sortedData]
	);

	const handleButtonPress = useCallback(() => {
		vibrate();
		normalGuestStore.toggleIngredientTabVisibilityState();
	}, [vibrate]);

	const handleSelect = useCallback(
		(ingredient: TIngredientId) => {
			vibrate();
			normalGuestStore.onIngredientSelectedChange(ingredient);
		},
		[vibrate]
	);

	if (
		currentNormalGuest === null ||
		currentRecipe === null ||
		currentMealFoodData === null
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
			currentMealFoodData.extraIngredients.length >=
		5;
	const darkIngredientSection = checkLengthEmpty(
		darkIngredientRows
	) ? null : (
		<>
			<div className="my-4 flex items-center">
				<div className="h-px w-full bg-foreground-300" />
				<div className="select-none whitespace-nowrap text-small font-light text-foreground-500">
					制作{DARK_MATTER_META_MAP.name}？
				</div>
				<div className="h-px w-full bg-foreground-300" />
			</div>
			<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
				{darkIngredientRows.map(({ id }) => (
					<IngredientTabItemPresenter
						key={id}
						ingredient={id}
						kind="static"
					/>
				))}
			</div>
		</>
	);

	return (
		<IngredientTabContentSkeleton
			afterMainGrid={darkIngredientSection}
			ingredientTabStyle={ingredientTabStyle}
			onToggle={handleButtonPress}
		>
			{data.map(({ id, name }) => {
				const ingredientScoreChange = changesById[id];
				const scoreChange = ingredientScoreChange?.scoreChange ?? 0;

				if (isFullFilled) {
					return (
						<IngredientTabItemPresenter
							key={id}
							className="opacity-40 brightness-50 dark:opacity-80"
							ingredient={id}
							kind="static"
						/>
					);
				}

				const isDown = scoreChange < 0;
				const isUp = scoreChange > 0;
				const isNoChange = scoreChange === 0;

				const color = isUp ? 'success' : isDown ? 'danger' : 'default';
				const score = isUp ? `+${scoreChange}` : `${scoreChange}`;

				const badgeContent = isNoChange ? '' : score;
				const tooltipContent = `点击：加入额外食材【${name}】${isNoChange ? '' : `，匹配度${score}`}`;

				return (
					<IngredientTabItemPresenter
						key={id}
						badgeContent={badgeContent}
						color={color}
						ingredient={id}
						isNoChange={isNoChange}
						kind="interactive"
						onPress={() => {
							handleSelect(id);
						}}
						scoreChange={scoreChange}
						tooltipContent={tooltipContent}
					/>
				);
			})}
		</IngredientTabContentSkeleton>
	);
});
