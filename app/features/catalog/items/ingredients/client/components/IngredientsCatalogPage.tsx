'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterIngredientData } from '@/features/catalog/items/ingredients/client/queries/filterIngredientData';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
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

import IngredientCatalog from './IngredientCatalog';

export default function IngredientsCatalogPage() {
	const currentPopularTrend = ingredientsStore.shared.popularTrend.use();
	const isFamousShop = ingredientsStore.shared.famousShop.use();

	const instance = ingredientsStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		ingredientsStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = ingredientsStore.availableContentDlcs.use();
	const availableLevels = ingredientsStore.availableLevels.use();
	const availablePlaces = ingredientsStore.availablePlaces.use();
	const availableTags = ingredientsStore.availableTags.use();
	const availableTypes = ingredientsStore.availableTypes.use();

	const pinyinSortState = ingredientsStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		ingredientsStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		ingredientsStore.persistence.filters.contentDlcs.use();
	const filterLevels = ingredientsStore.persistence.filters.levels.use();
	const filterTags = ingredientsStore.persistence.filters.tags.use();
	const filterNoTags = ingredientsStore.persistence.filters.noTags.use();
	const filterTypes = ingredientsStore.persistence.filters.types.use();
	const filterNoTypes = ingredientsStore.persistence.filters.noTypes.use();
	const filterPlaces = ingredientsStore.persistence.filters.places.use();
	const filterNoPlaces = ingredientsStore.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(
		() =>
			instance.data.map((data) => ({
				...data,
				tags: instance.calculateTagsWithTrend(
					data.tags,
					currentPopularTrend,
					isFamousShop
				),
			})) as unknown as typeof instance.data,
		[currentPopularTrend, instance, isFamousShop]
	);

	const filterData = useCallback(
		() =>
			filterIngredientData({
				data: dataWithTrend,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterLevels,
				filterNoPlaces,
				filterNoTags,
				filterNoTypes,
				filterPlaces,
				filterTags,
				filterTypes,
			}),
		[
			dataWithTrend,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
			filterTypes,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(dataWithTrend, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState:
				ingredientsStore.persistence.pinyinSortState.set,
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
					ingredientsStore.persistence.filters.contentDlcs.set,
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
								ingredientsStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableTags,
				label: '食材标签（包含）',
				selectedKeys: filterTags,
				setSelectedKeys: ingredientsStore.persistence.filters.tags.set,
			},
			{
				items: availableTags,
				label: '食材标签（排除）',
				selectedKeys: filterNoTags,
				setSelectedKeys:
					ingredientsStore.persistence.filters.noTags.set,
			},
			{
				items: availableTypes,
				label: '食材类别（包含）',
				selectedKeys: filterTypes,
				setSelectedKeys: ingredientsStore.persistence.filters.types.set,
			},
			{
				items: availableTypes,
				label: '食材类别（排除）',
				selectedKeys: filterNoTypes,
				setSelectedKeys:
					ingredientsStore.persistence.filters.noTypes.set,
			},
			{
				items: availableLevels,
				label: '等级',
				selectedKeys: filterLevels,
				setSelectedKeys:
					ingredientsStore.persistence.filters.levels.set,
			},
			{
				items: availablePlaces,
				label: '地区（包含）',
				selectedKeys: filterPlaces,
				setSelectedKeys:
					ingredientsStore.persistence.filters.places.set,
			},
			{
				items: availablePlaces,
				label: '地区（排除）',
				selectedKeys: filterNoPlaces,
				setSelectedKeys:
					ingredientsStore.persistence.filters.noPlaces.set,
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availablePlaces,
			availableTags,
			availableTypes,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypes,
			filterPlaces,
			filterTags,
			filterTypes,
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
			<IngredientCatalog data={sortedData} />
		</ItemPage>
	);
}
