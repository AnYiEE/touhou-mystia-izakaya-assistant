'use client';

import { useCallback, useMemo } from 'react';

import { hasEquivalentDlcFilters } from '@/domain/availability';
import {
	INGREDIENT_TYPE_MAP,
	compareIngredientTypes,
} from '@/domain/data/ingredients/ingredientFacts';
import type { TIngredientTypeId } from '@/domain/data/ingredients/types';
import { compareMapCanonicalOrder } from '@/domain/places/mapOrdering';

import { filterIngredientData } from '@/features/catalog/items/ingredients/client/queries/filterIngredientData';
import { ingredientsStore } from '@/features/catalog/items/ingredients/client/state/store';
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

import IngredientCatalog from './IngredientCatalog';

function parseIngredientTypeKeys(keys: string[]) {
	const types = keys
		.map((key) => Number(key) as TIngredientTypeId)
		.filter((type) => Object.hasOwn(INGREDIENT_TYPE_MAP, type));

	return types.sort(compareIngredientTypes);
}

export default function IngredientsCatalogPage() {
	const { t } = useI18n(catalogItemsMessages);
	const currentPopularTrend = ingredientsStore.shared.popularTrend.use();
	const isFamousShop = ingredientsStore.shared.famousShop.use();
	const catalogLocalizationRevision = useCatalogLocalizationRevision();

	const instance = ingredientsStore.instance.get();
	const isAvailabilityDlcFilterRedundant = hasEquivalentDlcFilters(
		instance.data
	);

	const availableAvailabilityDlcs =
		ingredientsStore.availableAvailabilityDlcs.use();
	const availableContentDlcs = ingredientsStore.availableContentDlcs.use();
	const availableLevels = ingredientsStore.availableLevels.use();
	const availableMaps = ingredientsStore.availableMaps.use();
	const availableTags = ingredientsStore.availableTags.use();
	const availableTypes = ingredientsStore.availableTypes.use();
	const canonicalAvailableMaps = useMemo(
		() =>
			[...availableMaps].sort((left, right) =>
				compareMapCanonicalOrder(left.value, right.value)
			),
		[availableMaps]
	);
	const availableTypeOptions = useMemo(
		() => availableTypes.map(({ value }) => ({ value: value.toString() })),
		[availableTypes]
	);

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
	const filterTypeKeys = useMemo(
		() => filterTypes.map((type) => type.toString()),
		[filterTypes]
	);
	const filterNoTypeKeys = useMemo(
		() => filterNoTypes.map((type) => type.toString()),
		[filterNoTypes]
	);
	const setFilterTypeKeys = useCallback((keys: string[]) => {
		ingredientsStore.persistence.filters.types.set(
			parseIngredientTypeKeys(keys)
		);
	}, []);
	const setFilterNoTypeKeys = useCallback((keys: string[]) => {
		ingredientsStore.persistence.filters.noTypes.set(
			parseIngredientTypeKeys(keys)
		);
	}, []);
	const filterPlaces = ingredientsStore.persistence.filters.places.use();
	const filterNoPlaces = ingredientsStore.persistence.filters.noPlaces.use();

	const dataWithTrend = useMemo(() => {
		void catalogLocalizationRevision;
		return instance.data.map((data) => ({
			...data,
			tags: instance
				.calculateIngredientTagsWithTrend(
					data.tags,
					currentPopularTrend,
					isFamousShop
				)
				.sort(compareFoodTagLabels),
		})) as unknown as typeof instance.data;
	}, [
		catalogLocalizationRevision,
		currentPopularTrend,
		instance,
		isFamousShop,
	]);

	const filterData = useCallback(
		() =>
			filterIngredientData({
				data: dataWithTrend,
				filterAvailabilityDlcs: isAvailabilityDlcFilterRedundant
					? []
					: filterAvailabilityDlcs,
				filterContentDlcs,
				filterLevels,
				filterMaps: filterPlaces,
				filterNoMaps: filterNoPlaces,
				filterNoTags,
				filterNoTypes,
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
				label: t('items.filter.contentDlc'),
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
							label: t('items.filter.acquirableAt'),
							selectedKeys: filterAvailabilityDlcs,
							setSelectedKeys:
								ingredientsStore.persistence.filters
									.availabilityDlcs.set,
							valueType: 'dlc',
						} satisfies TSelectConfig[number],
					]),
			{
				items: availableTags,
				label: t('items.filter.ingredientTagInclude'),
				selectedKeys: filterTags,
				setSelectedKeys: ingredientsStore.persistence.filters.tags.set,
				valueType: 'foodTag',
			},
			{
				items: availableTags,
				label: t('items.filter.ingredientTagExclude'),
				selectedKeys: filterNoTags,
				setSelectedKeys:
					ingredientsStore.persistence.filters.noTags.set,
				valueType: 'foodTag',
			},
			{
				items: availableTypeOptions,
				label: t('items.filter.ingredientTypeInclude'),
				selectedKeys: filterTypeKeys,
				setSelectedKeys: setFilterTypeKeys,
				valueType: 'ingredientType',
			},
			{
				items: availableTypeOptions,
				label: t('items.filter.ingredientTypeExclude'),
				selectedKeys: filterNoTypeKeys,
				setSelectedKeys: setFilterNoTypeKeys,
				valueType: 'ingredientType',
			},
			{
				items: availableLevels,
				label: t('items.filter.level'),
				selectedKeys: filterLevels,
				setSelectedKeys:
					ingredientsStore.persistence.filters.levels.set,
			},
			{
				items: canonicalAvailableMaps,
				label: t('items.filter.mapInclude'),
				selectedKeys: filterPlaces,
				setSelectedKeys:
					ingredientsStore.persistence.filters.places.set,
				valueType: 'map',
			},
			{
				items: canonicalAvailableMaps,
				label: t('items.filter.mapExclude'),
				selectedKeys: filterNoPlaces,
				setSelectedKeys:
					ingredientsStore.persistence.filters.noPlaces.set,
				valueType: 'map',
			},
		],
		[
			availableAvailabilityDlcs,
			availableContentDlcs,
			availableLevels,
			availableTags,
			availableTypeOptions,
			canonicalAvailableMaps,
			filterAvailabilityDlcs,
			filterContentDlcs,
			filterLevels,
			filterNoPlaces,
			filterNoTags,
			filterNoTypeKeys,
			filterPlaces,
			filterTags,
			filterTypeKeys,
			isAvailabilityDlcFilterRedundant,
			setFilterNoTypeKeys,
			setFilterTypeKeys,
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
			<IngredientCatalog data={sortedData} />
		</ItemPage>
	);
}
