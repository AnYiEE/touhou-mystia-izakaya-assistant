'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterRecipeData } from '@/features/catalog/items/recipes/client/queries/filterRecipeData';
import { recipesStore } from '@/features/catalog/items/recipes/client/state/store';
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

import RecipeCatalog from './RecipeCatalog';

export default function RecipesCatalogPage() {
	const currentPopularTrend = recipesStore.shared.popularTrend.use();
	const isFamousShop = recipesStore.shared.famousShop.use();

	const instance = recipesStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		recipesStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = recipesStore.availableContentDlcs.use();
	const availableCookers = recipesStore.availableCookers.use();
	const availableIngredients = recipesStore.availableIngredients.use();
	const availableLevels = recipesStore.availableLevels.use();
	const availableNegativeTags = recipesStore.availableNegativeTags.use();
	const availablePlaces = recipesStore.availablePlaces.use();
	const availablePositiveTags = recipesStore.availablePositiveTags.use();

	const pinyinSortState = recipesStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		recipesStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		recipesStore.persistence.filters.contentDlcs.use();
	const filterLevels = recipesStore.persistence.filters.levels.use();
	const filterCookers = recipesStore.persistence.filters.cookers.use();
	const filterIngredients =
		recipesStore.persistence.filters.ingredients.use();
	const filterNoIngredients =
		recipesStore.persistence.filters.noIngredients.use();
	const filterNegativeTags =
		recipesStore.persistence.filters.negativeTags.use();
	const filterNoNegativeTags =
		recipesStore.persistence.filters.noNegativeTags.use();
	const filterPositiveTags =
		recipesStore.persistence.filters.positiveTags.use();
	const filterNoPositiveTags =
		recipesStore.persistence.filters.noPositiveTags.use();
	const filterPlaces = recipesStore.persistence.filters.places.use();
	const filterNoPlaces = recipesStore.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(
		() =>
			instance.data.map((data) => ({
				...data,
				positiveTags: instance.calculateTagsWithTrend(
					instance.composeTagsWithPopularTrend(
						data.ingredients,
						[],
						data.positiveTags,
						[],
						null
					),
					currentPopularTrend,
					isFamousShop
				),
			})) as unknown as typeof instance.data,
		[currentPopularTrend, instance, isFamousShop]
	);

	const filterData = useCallback(
		() =>
			filterRecipeData({
				data: dataWithTrend,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterCookers,
				filterIngredients,
				filterLevels,
				filterNegativeTags,
				filterNoIngredients,
				filterNoNegativeTags,
				filterNoPlaces,
				filterNoPositiveTags,
				filterPlaces,
				filterPositiveTags,
			}),
		[
			dataWithTrend,
			filterAvailabilityDlcs,
			filterCookers,
			filterContentDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPlaces,
			filterNoPositiveTags,
			filterPlaces,
			filterPositiveTags,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: recipesStore.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys:
					recipesStore.persistence.filters.contentDlcs.set,
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
								recipesStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availablePositiveTags,
				label: '正特性（包含）',
				selectedKeys: filterPositiveTags,
				setSelectedKeys:
					recipesStore.persistence.filters.positiveTags.set,
			},
			{
				items: availablePositiveTags,
				label: '正特性（排除）',
				selectedKeys: filterNoPositiveTags,
				setSelectedKeys:
					recipesStore.persistence.filters.noPositiveTags.set,
			},
			{
				items: availableNegativeTags,
				label: '反特性（包含）',
				selectedKeys: filterNegativeTags,
				setSelectedKeys:
					recipesStore.persistence.filters.negativeTags.set,
			},
			{
				items: availableNegativeTags,
				label: '反特性（排除）',
				selectedKeys: filterNoNegativeTags,
				setSelectedKeys:
					recipesStore.persistence.filters.noNegativeTags.set,
			},
			{
				items: availableIngredients,
				label: '食材（包含）',
				selectedKeys: filterIngredients,
				setSelectedKeys:
					recipesStore.persistence.filters.ingredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableIngredients,
				label: '食材（排除）',
				selectedKeys: filterNoIngredients,
				setSelectedKeys:
					recipesStore.persistence.filters.noIngredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableCookers,
				label: '厨具',
				selectedKeys: filterCookers,
				setSelectedKeys: recipesStore.persistence.filters.cookers.set,
				spriteTarget: 'cooker',
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: recipesStore.persistence.filters.levels.set,
			},
			{
				items: availablePlaces,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys: recipesStore.persistence.filters.places.set,
			},
			{
				items: availablePlaces,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys: recipesStore.persistence.filters.noPlaces.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableCookers,
			availableContentDlcs,
			availableIngredients,
			availableLevels,
			availableNegativeTags,
			availablePlaces,
			availablePositiveTags,
			filterAvailabilityDlcs,
			filterCookers,
			filterContentDlcs,
			filterIngredients,
			filterLevels,
			filterNegativeTags,
			filterNoIngredients,
			filterNoNegativeTags,
			filterNoPlaces,
			filterNoPositiveTags,
			filterPlaces,
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
			<RecipeCatalog data={sortedData} />
		</ItemPage>
	);
}
