'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import { FOOD_TAG_MAP } from '@/domain/data/tags/tagFacts';

import { filterFoodData } from '@/features/catalog/items/foods/client/queries/filterFoodData';
import { foodsStore } from '@/features/catalog/items/foods/client/state/store';
import ItemPage from '@/features/catalog/shared/client/components/ItemPage';
import SideButtonGroup from '@/features/catalog/shared/client/components/SideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/features/catalog/shared/client/components/SideFilterIconButton';
import SidePinyinSortIconButton from '@/features/catalog/shared/client/components/SidePinyinSortIconButton';
import { useFilteredData } from '@/features/catalog/shared/client/hooks/useFilteredData';
import { useSortedData } from '@/features/catalog/shared/client/hooks/useSortedData';
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';

import { checkLengthEmpty } from '@/shared/utilities/collections/check';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import FoodsCatalog from './FoodsCatalog';

export default function FoodsCatalogPage() {
	const currentPopularTrend = foodsStore.shared.popularTrend.use();
	const isFamousShop = foodsStore.shared.famousShop.use();

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

	const dataWithTrend = useMemo(
		() =>
			instance.data.map((data) => {
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
						.sort((a, b) =>
							pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
						),
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
					].sort((a, b) =>
						pinyinSort(FOOD_TAG_MAP[a], FOOD_TAG_MAP[b])
					),
					recipes,
				};
			}),
		[currentPopularTrend, instance, isFamousShop]
	);

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
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys: foodsStore.persistence.filters.contentDlcs.set,
				valueType: 'dlc',
			},
			...(isAvailabilityDlcFilterRedundant
				? []
				: [
						{
							items: availableAvailabilityDlcs,
							label: '可获取于',
							selectedKeys: filterAvailabilityDlcs,
							setSelectedKeys:
								foodsStore.persistence.filters.availabilityDlcs
									.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availablePositiveTags,
				label: '正特性（包含）',
				selectedKeys: filterPositiveTags,
				setSelectedKeys:
					foodsStore.persistence.filters.positiveTags.set,
				valueType: 'foodTag',
			},
			{
				items: availablePositiveTags,
				label: '正特性（排除）',
				selectedKeys: filterNoPositiveTags,
				setSelectedKeys:
					foodsStore.persistence.filters.noPositiveTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableNegativeTags,
				label: '反特性（包含）',
				selectedKeys: filterNegativeTags,
				setSelectedKeys:
					foodsStore.persistence.filters.negativeTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableNegativeTags,
				label: '反特性（排除）',
				selectedKeys: filterNoNegativeTags,
				setSelectedKeys:
					foodsStore.persistence.filters.noNegativeTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableIngredients,
				label: '食材（包含）',
				selectedKeys: filterIngredients,
				setSelectedKeys: foodsStore.persistence.filters.ingredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableIngredients,
				label: '食材（排除）',
				selectedKeys: filterNoIngredients,
				setSelectedKeys:
					foodsStore.persistence.filters.noIngredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableCookerTypes,
				label: '厨具',
				selectedKeys: filterCookerTypes,
				setSelectedKeys: foodsStore.persistence.filters.cookerTypes.set,
				spriteTarget: 'cooker',
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: foodsStore.persistence.filters.levels.set,
			},
			{
				items: availableSources,
				label: '地区（包含）',
				selectedKeys: filterSources,
				setSelectedKeys: foodsStore.persistence.filters.places.set,
			},
			{
				items: availableSources,
				label: '地区（排除）',
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
			availableSources,
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
