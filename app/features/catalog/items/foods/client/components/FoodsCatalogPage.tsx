'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import { compareMapCanonicalOrder } from '@/domain/places/mapOrdering';

import { filterFoodData } from '@/features/catalog/items/foods/client/queries/filterFoodData';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import { catalogItemsMessages } from '@/features/catalog/items/shared/messages';
import ItemPage from '@/features/catalog/shared/client/components/ItemPage';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import { useCatalogLocalizationRevision } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import { compareFoodTagLabels } from '@/features/catalog/shared/client/localization/tagLabels';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import FoodsCatalog from './FoodsCatalog';

export default function FoodsCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	const currentPopularTrend = foodsStore.shared.popularTrend.use();
	const isFamousShop = foodsStore.shared.famousShop.use();
	const catalogLocalizationRevision = useCatalogLocalizationRevision();

	const instance = foodsStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		foodsStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = foodsStore.availableContentDlcs.use();
	const availableCookerTypes = foodsStore.availableCookerTypes.use();
	const availableIngredients = foodsStore.availableIngredients.use();
	const availableLevels = foodsStore.availableLevels.use();
	const availableNegativeTags = foodsStore.availableNegativeTags.use();
	const availablePositiveTags = foodsStore.availablePositiveTags.use();
	const availableSources = foodsStore.availableSources.use();

	const canonicalAvailableSources = useMemo(
		() =>
			[...availableSources].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableSources]
	);

	const pinyinSortState = foodsStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		foodsStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = foodsStore.persistence.filters.contentDlcs.use();
	const filterLevels = foodsStore.persistence.filters.levels.use();
	const filterCookerTypes = foodsStore.persistence.filters.cookerTypes.use();
	const filterIngredients = foodsStore.persistence.filters.ingredients.use();
	const filterNoIngredients =
		foodsStore.persistence.filters.noIngredients.use();
	const filterNegativeTags =
		foodsStore.persistence.filters.negativeTags.use();
	const filterNoNegativeTags =
		foodsStore.persistence.filters.noNegativeTags.use();
	const filterPositiveTags =
		foodsStore.persistence.filters.positiveTags.use();
	const filterNoPositiveTags =
		foodsStore.persistence.filters.noPositiveTags.use();
	const filterSources = foodsStore.persistence.filters.places.use();
	const filterNoSources = foodsStore.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(() => {
		void catalogLocalizationRevision;
		return instance.data.map((data) => {
			const calculateVariant = (
				variant: (typeof data.recipes)[number]
			) => ({
				...variant,
				positiveTags: instance
					.calculateFoodTagsWithTrend(
						instance.composeFoodTagsWithPopularTrend(
							variant.ingredients,
							[],
							data.positiveTags,
							[],
							currentPopularTrend
						),
						currentPopularTrend,
						isFamousShop
					)
					.sort(compareFoodTagLabels),
			});
			const recipes = data.recipes.map(calculateVariant) as [
				ReturnType<typeof calculateVariant>,
				...Array<ReturnType<typeof calculateVariant>>,
			];

			return {
				...data,
				positiveTags: [
					...new Set(
						recipes.flatMap(({ positiveTags }) => positiveTags)
					),
				].sort(compareFoodTagLabels),
				recipes,
			};
		});
	}, [
		catalogLocalizationRevision,
		currentPopularTrend,
		instance,
		isFamousShop,
	]);

	const filterData = useCallback(
		() =>
			filterFoodData({
				data: dataWithTrend,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterCookerTypes,
				filterIngredients,
				filterLevels,
				filterNegativeTags,
				filterNoIngredients,
				filterNoNegativeTags,
				filterNoPositiveTags,
				filterNoSourceValues: filterNoSources,
				filterPositiveTags,
				filterSourceValues: filterSources,
			}),
		[
			dataWithTrend,
			filterAvailabilityDlcs,
			filterCookerTypes,
			filterContentDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPositiveTags,
			filterNoSources,
			filterPositiveTags,
			filterSources,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: foodsStore.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: t('items.filter.contentDlc'),
				selectedKeys: filterContentDlcs,
				setSelectedKeys: foodsStore.persistence.filters.contentDlcs.set,
				valueType: 'dlc',
			},
			...(isAvailabilityDlcFilterRedundant
				? []
				: [
						{
							items: availableAvailabilityDlcs,
							label: t('items.filter.acquirableAt'),
							selectedKeys: filterAvailabilityDlcs,
							setSelectedKeys:
								foodsStore.persistence.filters.availabilityDlcs
									.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availablePositiveTags,
				label: t('items.filter.foodTagInclude'),
				selectedKeys: filterPositiveTags,
				setSelectedKeys:
					foodsStore.persistence.filters.positiveTags.set,
				valueType: 'foodTag',
			},
			{
				items: availablePositiveTags,
				label: t('items.filter.foodTagExclude'),
				selectedKeys: filterNoPositiveTags,
				setSelectedKeys:
					foodsStore.persistence.filters.noPositiveTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableNegativeTags,
				label: t('items.filter.foodTagNegativeInclude'),
				selectedKeys: filterNegativeTags,
				setSelectedKeys:
					foodsStore.persistence.filters.negativeTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableNegativeTags,
				label: t('items.filter.foodTagNegativeExclude'),
				selectedKeys: filterNoNegativeTags,
				setSelectedKeys:
					foodsStore.persistence.filters.noNegativeTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredients,
				label: t('items.filter.ingredientInclude'),
				selectedKeys: filterIngredients,
				setSelectedKeys: foodsStore.persistence.filters.ingredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableIngredients,
				label: t('items.filter.ingredientExclude'),
				selectedKeys: filterNoIngredients,
				setSelectedKeys:
					foodsStore.persistence.filters.noIngredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableCookerTypes,
				label: t('items.filter.cooker'),
				selectedKeys: filterCookerTypes,
				setSelectedKeys: foodsStore.persistence.filters.cookerTypes.set,
				spriteTarget: 'cooker',
			},
			{
				items: availableLevels,
				label: t('items.filter.level'),
				selectedKeys: filterLevels,
				setSelectedKeys: foodsStore.persistence.filters.levels.set,
			},
			{
				items: canonicalAvailableSources,
				label: t('items.filter.mapInclude'),
				selectedKeys: filterSources,
				setSelectedKeys: foodsStore.persistence.filters.places.set,
			},
			{
				items: canonicalAvailableSources,
				label: t('items.filter.mapExclude'),
				selectedKeys: filterNoSources,
				setSelectedKeys: foodsStore.persistence.filters.noPlaces.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableCookerTypes,
			availableContentDlcs,
			availableIngredients,
			availableLevels,
			availableNegativeTags,
			availablePositiveTags,
			canonicalAvailableSources,
			filterAvailabilityDlcs,
			filterCookerTypes,
			filterContentDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoSources,
			filterNoPositiveTags,
			filterSources,
			filterPositiveTags,
			isAvailabilityDlcFilterRedundant,
			t,
		]
	);

	return (
		<ItemPage
			isEmpty={checkLengthEmpty(sortedData)}
			sideButton={
				<SideButtonGroup>
					<SidePinyinSortIconButton
						pinyinSortConfig={pinyinSortConfig}
					/>
					<SideFilterIconButton selectConfig={selectConfig} />
				</SideButtonGroup>
			}
		>
			<FoodsCatalog data={sortedData} />
		</ItemPage>
	);
}
