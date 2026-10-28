import { faBan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Fragment, type ReactNode, memo, useCallback, useMemo } from 'react';

import LabeledDivider from '@/design/ui/components/labeledDivider';
import Placeholder from '@/design/ui/components/placeholder';

import { groupItemsByContentDlc } from '@/domain/availability/contentDlc';
import { type IngredientCatalog } from '@/domain/catalog/food/IngredientCatalog';
import type { TIngredientId } from '@/domain/data/ingredients/types';

import { normalGuestStore } from '@/features/catalog/guests/normal/client/state/store';
import IngredientTabContentSkeleton from '@/features/catalog/guests/shared/client/components/ingredientTabContentSkeleton';
import IngredientTabItemPresenter from '@/features/catalog/guests/shared/client/components/ingredientTabItemPresenter';
import type { IIngredientTabContentProps } from '@/features/catalog/guests/shared/ingredientTabContracts';
import { catalogGuestsMessages } from '@/features/catalog/guests/shared/messages';
import ContentDlcDivider from '@/features/catalog/shared/client/components/ContentDlcDivider';
import OfficialContentDivider from '@/features/catalog/shared/client/components/OfficialContentDivider';
import type { TItemDataItem } from '@/features/catalog/shared/contracts';
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

	const { mainItems, modSections } = useMemo(
		() => groupItemsByContentDlc(data, ({ dlc }) => dlc),
		[data]
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
				{t('guests.table.empty')}
			</Placeholder>
		);
	}

	const { ingredients: currentRecipeIngredients } = currentRecipe;

	const isFullFilled =
		currentRecipeIngredients.length +
			currentMealFoodData.extraIngredients.length >=
		5;
	const renderIngredient = ({
		id,
		name,
	}: TItemDataItem<IngredientCatalog>): ReactNode => {
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
		const tooltipContent = `${t('guests.ingredient.addTipPrefix', {
			name,
		})}${isNoChange ? '' : t('guests.ingredient.score', { score })}`;

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
	};

	const darkIngredientSection = checkLengthEmpty(
		darkIngredientRows
	) ? null : (
		<>
			<LabeledDivider
				className="mx-2 my-4 gap-1.5"
				icon={
					<FontAwesomeIcon
						aria-hidden
						className="!h-3.5 !w-3.5 shrink-0 text-danger-600"
						icon={faBan}
					/>
				}
			>
				{t('guests.ingredient.craftDarkMatterWarning', {
					name: t('guests.ingredient.darkMatter'),
				})}
			</LabeledDivider>
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
	const modSectionsNode = modSections.map(({ dlc, items }, sectionIndex) => (
		<Fragment key={dlc}>
			{(mainItems.length > 0 || sectionIndex > 0) && (
				<ContentDlcDivider className="mx-2 my-4" dlc={dlc} />
			)}
			<div className="m-2 grid grid-cols-fill-12 justify-around gap-4">
				{items.map(renderIngredient)}
			</div>
		</Fragment>
	));

	return (
		<IngredientTabContentSkeleton
			afterMainGrid={
				<>
					{modSectionsNode}
					{darkIngredientSection}
				</>
			}
			ingredientTabStyle={ingredientTabStyle}
			onToggle={handleButtonPress}
		>
			{modSections.length > 0 && mainItems.length > 0 && (
				<OfficialContentDivider
					key="content-official"
					className="col-span-full w-full"
				/>
			)}
			{mainItems.map(renderIngredient)}
		</IngredientTabContentSkeleton>
	);
});
