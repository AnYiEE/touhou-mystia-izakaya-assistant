'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';

import { filterPartnerData } from '@/features/catalog/items/partners/client/queries/filterPartnerData';
import { partnersStore } from '@/features/catalog/items/partners/client/state/store';
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

import PartnerCatalog from './PartnerCatalog';

export default function PartnersCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	useCatalogLocalizationRevision();
	const instance = partnersStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		partnersStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = partnersStore.availableContentDlcs.use();

	const pinyinSortState = partnersStore.persistence.pinyinSortState.use();

	const filterAvailabilityDlcs =
		partnersStore.persistence.filters.availabilityDlcs.use();
	const filterContentDlcs =
		partnersStore.persistence.filters.contentDlcs.use();

	const filterData = useCallback(
		() =>
			filterPartnerData({
				data: instance.data,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
			}),
		[
			filterAvailabilityDlcs,
			filterContentDlcs,
			instance.data,
			isAvailabilityDlcFilterRedundant,
		]
	);

	const filteredData = useFilteredData(instance, filterData);

	const sortedData = useSortedData(instance, filteredData, pinyinSortState);

	const pinyinSortConfig = useMemo<IPinyinSortConfig>(
		() => ({
			pinyinSortState,
			setPinyinSortState: partnersStore.persistence.pinyinSortState.set,
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
					partnersStore.persistence.filters.contentDlcs.set,
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
								partnersStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			filterAvailabilityDlcs,
			filterContentDlcs,
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
			<PartnerCatalog data={sortedData} />
		</ItemPage>
	);
}
