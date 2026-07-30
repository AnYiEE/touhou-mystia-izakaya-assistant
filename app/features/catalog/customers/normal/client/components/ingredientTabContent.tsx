import { memo, useCallback, useMemo } from 'react';

import Placeholder from '@/design/ui/components/placeholder';

import type { TIngredientName } from '@/domain/data/ingredients/types';
import { DARK_MATTER_META_MAP } from '@/domain/data/tags/tagFacts';

import { customerNormalStore } from '@/features/catalog/customers/normal/client/state/store';
import IngredientTabContentSkeleton from '@/features/catalog/customers/shared/client/components/ingredientTabContentSkeleton';
import IngredientTabItemPresenter from '@/features/catalog/customers/shared/client/components/ingredientTabItemPresenter';
import type { IIngredientTabContentProps } from '@/features/catalog/customers/shared/ingredientTabContracts';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { toSet } from '@/shared/utilities/collections/convert';

interface IProps extends IIngredientTabContentProps {}

export default memo<IProps>(function IngredientTabContent({
	ingredientTabStyle,
	sortedData,
}) {
	const vibrate = useVibrate();

	const currentCustomerName = customerNormalStore.shared.customer.name.use();
	const currentRecipeData = customerNormalStore.shared.recipe.data.use();
	const { changesByName, darkIngredientNames } =
		customerNormalStore.ingredientScoreChanges.use();

	const instance_recipe = customerNormalStore.instances.recipe.get();

	const currentRecipe = useMemo(
		() =>
			currentRecipeData
				? instance_recipe.resolveMealRecipe(currentRecipeData)
				: null,
		[currentRecipeData, instance_recipe]
	);

	const darkIngredients = useMemo(
		() => toSet(darkIngredientNames),
		[darkIngredientNames]
	);

	const darkIngredientRows = useMemo(
		() => sortedData.filter(({ name }) => darkIngredients.has(name)),
		[darkIngredients, sortedData]
	);

	const data = useMemo(
		() => sortedData.filter(({ name }) => !darkIngredients.has(name)),
		[darkIngredients, sortedData]
	);

	const handleButtonPress = useCallback(() => {
		vibrate();
		customerNormalStore.toggleIngredientTabVisibilityState();
	}, [vibrate]);

	const handleSelect = useCallback(
		(ingredient: TIngredientName) => {
			vibrate();
			customerNormalStore.onIngredientSelectedChange(ingredient);
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

	const { baseIngredients: currentRecipeIngredients } = currentRecipe;

	const isFullFilled =
		currentRecipeIngredients.length +
			currentRecipeData.extraIngredients.length >=
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
				{darkIngredientRows.map(({ name }, index) => (
					<IngredientTabItemPresenter
						key={index}
						kind="static"
						name={name}
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
			{data.map(({ name }, index) => {
				const ingredientScoreChange = changesByName[name];
				const scoreChange = ingredientScoreChange?.scoreChange ?? 0;

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

				const color = isUp ? 'success' : isDown ? 'danger' : 'default';
				const score = isUp ? `+${scoreChange}` : `${scoreChange}`;

				const badgeContent = isNoChange ? '' : score;
				const tooltipContent = `点击：加入额外食材【${name}】${isNoChange ? '' : `，匹配度${score}`}`;

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
