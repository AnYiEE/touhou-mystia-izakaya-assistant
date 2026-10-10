import { memo, useCallback, useMemo } from 'react';

import Placeholder from '@/design/ui/components/placeholder';

import type { TIngredientId } from '@/domain/data/ingredients/types';

import IngredientTabContentSkeleton from '@/features/catalog/guests/shared/client/components/ingredientTabContentSkeleton';
import IngredientTabItemPresenter from '@/features/catalog/guests/shared/client/components/ingredientTabItemPresenter';
import type { IIngredientTabContentProps } from '@/features/catalog/guests/shared/ingredientTabContracts';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import { specialGuestStore } from '@/features/catalog/guests/special/client/state/store';
import { useVibrate } from '@/features/preferences/client/useVibrate';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

interface IProps extends IIngredientTabContentProps {}

export default memo<IProps>(function IngredientTabContent({
	ingredientTabStyle,
	sortedData,
}) {
	const { t } = useI18n(catalogGuestsMessages);
	const vibrate = useVibrate();

	const currentSpecialGuest = specialGuestStore.shared.guest.id.use();
	const currentMealFood = specialGuestStore.shared.recipe.data.use();
	const { changesById } = specialGuestStore.ingredientScoreChanges.use();

	const foodCatalog = specialGuestStore.instances.recipe.get();

	const currentRecipe = useMemo(
		() =>
			currentMealFood
				? foodCatalog.getRecipeOwnerById(currentMealFood.recipeId)
						.recipe
				: null,
		[currentMealFood, foodCatalog]
	);

	const handleButtonPress = useCallback(() => {
		vibrate();
		specialGuestStore.toggleIngredientTabVisibilityState();
	}, [vibrate]);

	const handleSelect = useCallback(
		(ingredient: TIngredientId) => {
			vibrate();
			specialGuestStore.onIngredientSelectedChange(ingredient);
		},
		[vibrate]
	);

	if (
		currentSpecialGuest === null ||
		currentRecipe === null ||
		currentMealFood === null
	) {
		return null;
	}

	if (checkLengthEmpty(sortedData)) {
		return (
			<Placeholder className="pt-4 md:min-h-40 md:pt-0">
				{t('guests.table.empty')}
			</Placeholder>
		);
	}

	const { ingredients: currentRecipeIngredients } = currentRecipe;

	const isFullFilled =
		currentRecipeIngredients.length +
			currentMealFood.extraIngredients.length >=
		5;

	return (
		<IngredientTabContentSkeleton
			ingredientTabStyle={ingredientTabStyle}
			onToggle={handleButtonPress}
		>
			{sortedData.map(({ id, name }) => {
				const ingredientScoreChange = changesById[id] ?? null;
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
				const tooltipSuffix = isNoChange
					? ''
					: isDarkIngredient
						? t('guests.ingredient.craftDarkMatter', {
								name: t('guests.ingredient.darkMatter'),
							})
						: isLowestRestricted
							? t('guests.ingredient.lowestRestricted')
							: isHighestRestricted
								? t('guests.ingredient.highestRestricted')
								: `${t('guests.ingredient.score', { score })}${
										isOrderTag
											? t(
													'guests.ingredient.orderTagSuffix'
												)
											: ''
									}`;
				const tooltipContent = `${t('guests.ingredient.addTipPrefix', {
					name,
				})}${tooltipSuffix}`;

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
