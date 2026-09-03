import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import type { BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';
import type { FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import type { GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import type { RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import type { TDlc } from '@/domain/data/shared/types';

import type { TItemDataItem } from '@/features/catalog/shared/contracts';
import {
	createCatalogPersistenceShape,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { numberSort } from '@/shared/utilities/sort/numberSort';
import { pinyinSort } from '@/shared/utilities/sort/pinyinSort';

import '@/infrastructure/state/enableImmerMapSet';

export type TCollectibleCatalog =
	| BadgeCatalog
	| FishingCollectibleCatalog
	| GeneralItemCatalog
	| RecordItemCatalog;

export function createCollectibleStore<TCatalog extends TCollectibleCatalog>({
	getSources,
	instance,
	storageName,
}: {
	getSources: (item: TItemDataItem<TCatalog>) => string[];
	instance: TCatalog;
	storageName: string;
}) {
	const persistenceShape = createCatalogPersistenceShape({
		allowedValues: {
			availabilityDlcs: toAllowedValueSet(
				instance.data.flatMap((item) => item.availabilityDlcs)
			),
			contentDlcs: toAllowedValueSet(
				instance.data.map((item) => item.dlc)
			),
			sources: toAllowedValueSet(
				instance.data.flatMap((item) => getSources(item))
			),
		},
		createDefaultFilters(): {
			availabilityDlcs: string[];
			contentDlcs: string[];
			sources: string[];
		} {
			return { availabilityDlcs: [], contentDlcs: [], sources: [] };
		},
		filterKinds: {
			availabilityDlcs: 'string',
			contentDlcs: 'string',
			sources: 'string',
		},
		pinyinSortState: PINYIN_SORT_STATE_MAP.none,
	});

	const state = {
		instance,
		persistence: persistenceShape.createDefault(),
		shared: { hiddenItems: { dlcs: new Set<TDlc>() } },
	};
	const getNames = createNamesCache(instance);
	const getVisibleData = (hiddenDlcs: ReadonlySet<TDlc>) =>
		filterAvailableItemsByHiddenDlcs(
			instance.data as ReadonlyArray<TItemDataItem<TCatalog>>,
			hiddenDlcs
		);

	const collectibleStore = store(state, {
		middlewares: [
			createPersistMiddleware<typeof state>({
				name: storageName,
				normalize: persistenceShape.normalize,
				partialize: (currentStore) =>
					({
						persistence: currentStore.persistence,
					}) as typeof currentStore,
				version: 0,
			}),
		],
	}).computed((currentStore) => ({
		availableAvailabilityDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...new Set(
					getVisibleData(hiddenDlcs).flatMap(
						({ availabilityDlcs }) => availabilityDlcs
					)
				),
			]
				.map(toGetValueCollection)
				.sort(numberSort);
		},
		availableContentDlcs: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...new Set(getVisibleData(hiddenDlcs).map(({ dlc }) => dlc)),
			]
				.map(toGetValueCollection)
				.sort(numberSort);
		},
		availableNames: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			const visibleNames = new Set<string>(
				getVisibleData(hiddenDlcs).map(({ name }) => name)
			);
			return (
				getNames(
					currentStore.persistence.pinyinSortState.use()
				) as string[]
			)
				.filter((name) => visibleNames.has(name))
				.map(toGetValueCollection);
		},
		availableSources: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			return [
				...new Set(
					getVisibleData(hiddenDlcs).flatMap((item) =>
						getSources(item)
					)
				),
			]
				.toSorted(pinyinSort)
				.map((value) => ({ value }));
		},
	}));

	collectibleStore.shared.hiddenItems.dlcs.onChange(() => {
		collectibleStore.persistence.filters.set(
			persistenceShape.createDefault().filters
		);
	});

	return { getSources, store: collectibleStore };
}
