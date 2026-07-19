'use client';

import { useCallback, useMemo } from 'react';

import { useFilteredData, useSortedData } from '@/hooks';

import Content from './content';
import ItemPage from '@/components/itemPage';
import SideButtonGroup from '@/components/sideButtonGroup';
import SideFilterIconButton, {
	type TSelectConfig,
} from '@/components/sideFilterIconButton';
import SidePinyinSortIconButton, {
	type IPinyinSortConfig,
} from '@/components/sidePinyinSortIconButton';

import { recipesStore as store } from '@/stores';
import { checkLengthEmpty, filterItems } from '@/utilities';
import { hasEquivalentDlcFilters } from '@/utils/availability';

export default function Recipes() {
	const currentPopularTrend = store.shared.popularTrend.use();
	const isFamousShop = store.shared.famousShop.use();

	const instance = store.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs = store.availableAvailabilityDlcs.use();
	const availableContentDlcs = store.availableContentDlcs.use();
	const availableCookers = store.availableCookers.use();
	const availableIngredients = store.availableIngredients.use();
	const availableLevels = store.availableLevels.use();
	const availableNegativeTags = store.availableNegativeTags.use();
	const availablePlaces = store.availablePlaces.use();
	const availablePositiveTags = store.availablePositiveTags.use();

	const pinyinSortState = store.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		store.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs = store.persistence.filters.contentDlcs.use();
	const filterLevels = store.persistence.filters.levels.use();
	const filterCookers = store.persistence.filters.cookers.use();
	const filterIngredients = store.persistence.filters.ingredients.use();
	const filterNoIngredients = store.persistence.filters.noIngredients.use();
	const filterNegativeTags = store.persistence.filters.negativeTags.use();
	const filterNoNegativeTags = store.persistence.filters.noNegativeTags.use();
	const filterPositiveTags = store.persistence.filters.positiveTags.use();
	const filterNoPositiveTags = store.persistence.filters.noPositiveTags.use();
	const filterPlaces = store.persistence.filters.places.use();
	const filterNoPlaces = store.persistence.filters.noPlaces.use();

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
			filterItems(dataWithTrend, [
				{
					field: 'availabilityDlcs',
					match: 'any',
					values: isAvailabilityDlcFilterRedundant
						? []
						: filterAvailabilityDlcs,
				},
				{ field: 'dlc', match: 'in', values: filterContentDlcs },
				{ field: 'level', match: 'in', values: filterLevels },
				{ field: 'cooker', match: 'in', values: filterCookers },
				{
					field: 'ingredients',
					match: 'all',
					values: filterIngredients,
				},
				{
					field: 'ingredients',
					match: 'excludeAny',
					values: filterNoIngredients,
				},
				{
					field: 'negativeTags',
					match: 'all',
					values: filterNegativeTags,
				},
				{
					field: 'negativeTags',
					match: 'excludeAny',
					values: filterNoNegativeTags,
				},
				{
					field: 'positiveTags',
					match: 'all',
					values: filterPositiveTags,
				},
				{
					field: 'positiveTags',
					match: 'excludeAny',
					values: filterNoPositiveTags,
				},
				{ field: 'places', match: 'any', values: filterPlaces },
				{
					field: 'places',
					match: 'excludeAny',
					values: filterNoPlaces,
				},
			]),
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
			setPinyinSortState: store.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: '内容归属',
				selectedKeys: filterContentDlcs,
				setSelectedKeys: store.persistence.filters.contentDlcs.set,
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
								store.persistence.filters.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availablePositiveTags,
				label: '正特性（包含）',
				selectedKeys: filterPositiveTags,
				setSelectedKeys: store.persistence.filters.positiveTags.set,
			},
			{
				items: availablePositiveTags,
				label: '正特性（排除）',
				selectedKeys: filterNoPositiveTags,
				setSelectedKeys: store.persistence.filters.noPositiveTags.set,
			},
			{
				items: availableNegativeTags,
				label: '反特性（包含）',
				selectedKeys: filterNegativeTags,
				setSelectedKeys: store.persistence.filters.negativeTags.set,
			},
			{
				items: availableNegativeTags,
				label: '反特性（排除）',
				selectedKeys: filterNoNegativeTags,
				setSelectedKeys: store.persistence.filters.noNegativeTags.set,
			},
			{
				items: availableIngredients,
				label: '食材（包含）',
				selectedKeys: filterIngredients,
				setSelectedKeys: store.persistence.filters.ingredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableIngredients,
				label: '食材（排除）',
				selectedKeys: filterNoIngredients,
				setSelectedKeys: store.persistence.filters.noIngredients.set,
				spriteTarget: 'ingredient',
			},
			{
				items: availableCookers,
				label: '厨具',
				selectedKeys: filterCookers,
				setSelectedKeys: store.persistence.filters.cookers.set,
				spriteTarget: 'cooker',
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys: store.persistence.filters.levels.set,
			},
			{
				items: availablePlaces,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys: store.persistence.filters.places.set,
			},
			{
				items: availablePlaces,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys: store.persistence.filters.noPlaces.set,
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
			<Content data={sortedData} />
		</ItemPage>
	);
}
