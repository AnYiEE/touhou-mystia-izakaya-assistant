'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import { compareMapCanonicalOrder } from '@/domain/places/mapOrdering';

import { filterBeverageData } from '@/features/catalog/items/beverages/client/queries/filterBeverageData';
import { beveragesStore } from '@/features/catalog/items/beverages/client/state/store';
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
import { type IPinyinSortConfig } from '@/features/catalog/shared/state/pinyinSort';

import { useI18n } from '@/shared/i18n/useI18n';
import { checkLengthEmpty } from '@/shared/utilities/collections/check';

import BeverageCatalog from './BeverageCatalog';

export default function BeveragesCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	useCatalogLocalizationRevision();
	const instance = beveragesStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		beveragesStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = beveragesStore.availableContentDlcs.use();
	const availableLevels = beveragesStore.availableLevels.use();
	const availableMaps = beveragesStore.availableMaps.use();
	const availableTags = beveragesStore.availableTags.use();

	const canonicalAvailableMaps = useMemo(
		() =>
			[...availableMaps].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableMaps]
	);

	const pinyinSortState = beveragesStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		beveragesStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		beveragesStore.persistence.filters.contentDlcs.use();
	const filterLevels = beveragesStore.persistence.filters.levels.use();
	const filterTags = beveragesStore.persistence.filters.tags.use();
	const filterNoTags = beveragesStore.persistence.filters.noTags.use();
	const filterPlaces = beveragesStore.persistence.filters.places.use();
	const filterNoPlaces = beveragesStore.persistence.filters.noPlaces.use();

	const filterData = useCallback(
		() =>
			filterBeverageData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterLevels,
				filterMaps: filterPlaces,
				filterNoMaps: filterNoPlaces,
				filterNoTags,
				filterTags,
			}),
		[
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: beveragesStore.persistence.pinyinSortState.set,
		}),
		[pinyinSortState]
	);

	const selectConfig = useMemo<TSelectConfig>(
		() => [
			{
				items: availableContentDlcs,
				label: t('items.filter.contentDlc'),
				selectedKeys: filterContentDlcs,
				setSelectedKeys:
					beveragesStore.persistence.filters.contentDlcs.set,
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
								beveragesStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableTags,
				label: t('items.filter.beverageTagInclude'),
				selectedKeys: filterTags,
				setSelectedKeys: beveragesStore.persistence.filters.tags.set,
				valueType: 'beverageTag',
			},
			{
				items: availableTags,
				label: t('items.filter.beverageTagExclude'),
				selectedKeys: filterNoTags,
				setSelectedKeys: beveragesStore.persistence.filters.noTags.set,
				valueType: 'beverageTag',
			},
			{
				items: availableLevels,
				label: t('items.filter.level'),
				selectedKeys: filterLevels,
				setSelectedKeys: beveragesStore.persistence.filters.levels.set,
			},
			{
				items: canonicalAvailableMaps,
				label: t('items.filter.mapInclude'),
				selectedKeys: filterPlaces,
				setSelectedKeys: beveragesStore.persistence.filters.places.set,
				valueType: 'map',
			},
			{
				items: canonicalAvailableMaps,
				label: t('items.filter.mapExclude'),
				selectedKeys: filterNoPlaces,
				setSelectedKeys:
					beveragesStore.persistence.filters.noPlaces.set,
				valueType: 'map',
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availableTags,
			canonicalAvailableMaps,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterPlaces,
			filterTags,
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
			<BeverageCatalog data={sortedData} />
		</ItemPage>
	);
}
