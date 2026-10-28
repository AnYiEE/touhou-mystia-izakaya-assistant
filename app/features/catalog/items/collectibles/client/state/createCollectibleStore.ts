import { store } from '@davstack/store';

import { filterAvailableItemsByHiddenDlcs } from '@/domain/availability';
import { type BadgeCatalog } from '@/domain/catalog/items/BadgeCatalog';
import { type FishingCollectibleCatalog } from '@/domain/catalog/items/FishingCollectibleCatalog';
import { type GeneralItemCatalog } from '@/domain/catalog/items/GeneralItemCatalog';
import { type RecordItemCatalog } from '@/domain/catalog/items/RecordItemCatalog';
import type { TDlc } from '@/domain/data/shared/types';
import {
	getMapLabelByDisplayLabel,
	getMerchantLabelByDisplayLabel,
} from '@/domain/places/localizedLabels';

import { getActiveLocalizationLocale } from '@/features/catalog/shared/client/localization/activeLocalizationLocale';
import { registerCatalogLocalizationRevisionMirror } from '@/features/catalog/shared/client/localization/catalogLocalizationRevision';
import type { TItemDataItem } from '@/features/catalog/shared/contracts';
import {
	createCatalogPersistenceShape,
	toAllowedValueSet,
} from '@/features/catalog/shared/state/catalogPersistenceShape';
import { createNamesCache } from '@/features/catalog/shared/state/createNamesCache';
import { PINYIN_SORT_STATE_MAP } from '@/features/catalog/shared/state/pinyinSort';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { toGetValueCollection } from '@/shared/utilities/objects/convertCollection';
import { compareLocalizedName } from '@/shared/utilities/search/localeNameMatch';
import { numberSort } from '@/shared/utilities/sort/numberSort';

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
		shared: {
			catalogLocalizationRevision: 0,
			hiddenItems: { dlcs: new Set<TDlc>() },
		},
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
					currentStore.shared.catalogLocalizationRevision.use(),
					currentStore.persistence.pinyinSortState.use()
				) as string[]
			)
				.filter((name) => visibleNames.has(name))
				.map(toGetValueCollection);
		},
		availableSources: () => {
			const hiddenDlcs = currentStore.shared.hiddenItems.dlcs.use();
			currentStore.shared.catalogLocalizationRevision.use();
			return [
				...new Set(
					getVisibleData(hiddenDlcs).flatMap((item) =>
						getSources(item)
					)
				),
			]
				.map((value) => ({
					name: getMerchantLabelByDisplayLabel(
						getMapLabelByDisplayLabel(value)
					),
					value,
				}))
				.sort((left, right) =>
					compareLocalizedName(
						left.name,
						right.name,
						getActiveLocalizationLocale()
					)
				);
		},
	}));

	collectibleStore.shared.hiddenItems.dlcs.onChange(() => {
		collectibleStore.persistence.filters.set(
			persistenceShape.createDefault().filters
		);
	});

	registerCatalogLocalizationRevisionMirror((revision) => {
		collectibleStore.shared.catalogLocalizationRevision.set(revision);
	});

	return { getSources, store: collectibleStore };
}
