import { store } from '@davstack/store';
import { decompressFromUTF16 } from 'lz-string';

import {
	DEFAULT_HIDDEN_DAY_MAP_LAYERS,
	type TDayMapEntity,
	type TDayMapLayer,
} from '@/features/maps/client/model/dayMapEntities';
import { DAY_MAP_LAYER_COLORS } from '@/features/maps/client/model/mapStyles';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';
import { safeStorage } from '@/infrastructure/browser/storage/safeStorage';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { MAP_VIEW_STORE_VERSION } from './storeVersion';

const MAP_VIEW_PERSISTENCE_NAME = 'page-maps-view-storage';
const COMPRESS_PREFIX = '__LZ__';
export const MAP_SIDEBAR_COLLAPSED_BOOT_KEY =
	'page-maps-view-sidebar-collapsed';

interface IMapViewPreferences {
	hiddenLayers: TDayMapLayer[];
	isSidebarCollapsed: boolean;
	isTaskLayerVisible: boolean;
}

interface IMapViewStoreState {
	persistence: IMapViewPreferences;
	shared: {
		collapsedLayers: TDayMapLayer[];
		ignoredPreferencesHiddenLayers: TDayMapLayer[] | null;
		isHydrated: boolean;
		query: string;
	};
}

function isDayMapLayer(value: unknown): value is TDayMapLayer {
	return (
		typeof value === 'string' && Object.hasOwn(DAY_MAP_LAYER_COLORS, value)
	);
}

function normalizePreferences(value: unknown): IMapViewPreferences {
	const record = isObjectTagRecord(value) ? value : {};
	const hiddenLayers = Array.isArray(record['hiddenLayers'])
		? record['hiddenLayers'].filter(isDayMapLayer)
		: [...DEFAULT_HIDDEN_DAY_MAP_LAYERS];

	return {
		hiddenLayers: [...new Set(hiddenLayers)].filter(
			(layer) => layer !== 'task'
		),
		isSidebarCollapsed: record['isSidebarCollapsed'] === true,
		isTaskLayerVisible: record['isTaskLayerVisible'] === true,
	};
}

/** @description Lets the loading skeleton match the saved shell state before asynchronous store hydration completes. */
export function readBootSidebarCollapsed() {
	const bootValue = safeStorage.getItem(MAP_SIDEBAR_COLLAPSED_BOOT_KEY);
	if (bootValue === 'true') {
		return true;
	}
	if (bootValue === 'false') {
		return false;
	}

	const stored = safeStorage.getItem(MAP_VIEW_PERSISTENCE_NAME);
	if (stored === null) {
		return false;
	}

	const serialized = stored.startsWith(COMPRESS_PREFIX)
		? decompressFromUTF16(stored.slice(COMPRESS_PREFIX.length))
		: stored;
	try {
		const envelope: unknown = JSON.parse(serialized);
		if (
			!isObjectTagRecord(envelope) ||
			envelope['version'] !== MAP_VIEW_STORE_VERSION.initial
		) {
			return false;
		}
		const stateValue = envelope['state'];
		const persistence = isObjectTagRecord(stateValue)
			? stateValue['persistence']
			: undefined;
		const isCollapsed =
			isObjectTagRecord(persistence) &&
			persistence['isSidebarCollapsed'] === true;
		safeStorage.setItem(
			MAP_SIDEBAR_COLLAPSED_BOOT_KEY,
			String(isCollapsed)
		);
		return isCollapsed;
	} catch {
		return false;
	}
}

const state: IMapViewStoreState = {
	persistence: {
		hiddenLayers: [...DEFAULT_HIDDEN_DAY_MAP_LAYERS].filter(
			(layer) => layer !== 'task'
		),
		isSidebarCollapsed: false,
		isTaskLayerVisible: false,
	},
	shared: {
		collapsedLayers: [],
		ignoredPreferencesHiddenLayers: null,
		isHydrated: false,
		query: '',
	},
};

const mapViewStoreBase = store(state, {
	middlewares: [
		createPersistMiddleware<
			typeof state,
			Pick<typeof state, 'persistence'>
		>({
			name: MAP_VIEW_PERSISTENCE_NAME,
			normalize: normalizePreferences,
			onRehydrateStorage: () => () => {
				mapViewStoreBase.shared.isHydrated.set(true);
				safeStorage.setItem(
					MAP_SIDEBAR_COLLAPSED_BOOT_KEY,
					String(
						mapViewStoreBase.persistence.isSidebarCollapsed.get()
					)
				);
			},
			partialize: (currentStore) => ({
				persistence: currentStore.persistence,
			}),
			version: MAP_VIEW_STORE_VERSION.initial,
		}),
	],
});

/**
 * @description Local-only map reading preferences. Deliberately has no
 * account-sync or cross-tab middleware.
 */
export const mapViewStore = mapViewStoreBase.actions((currentStore) => ({
	resetQuery() {
		currentStore.shared.query.set('');
	},

	initializeIgnoredPreferencesLayers() {
		currentStore.shared.ignoredPreferencesHiddenLayers.set([
			...DEFAULT_HIDDEN_DAY_MAP_LAYERS,
		]);
	},

	commitIgnoredPreferences() {
		const ignoredLayers =
			currentStore.shared.ignoredPreferencesHiddenLayers.get() ?? [
				...DEFAULT_HIDDEN_DAY_MAP_LAYERS,
			];
		currentStore.persistence.hiddenLayers.set(
			ignoredLayers.filter((layer) => layer !== 'task')
		);
		currentStore.persistence.isTaskLayerVisible.set(
			!ignoredLayers.includes('task')
		);
		currentStore.shared.ignoredPreferencesHiddenLayers.set(null);
	},

	revealForEntity(entity: TDayMapEntity | null) {
		if (entity === null) {
			return;
		}
		if (entity.layer === 'task') {
			currentStore.persistence.isTaskLayerVisible.set(true);
		}
		const hiddenLayers = currentStore.persistence.hiddenLayers.get();
		if (hiddenLayers.includes(entity.layer)) {
			currentStore.persistence.hiddenLayers.set(
				hiddenLayers.filter((layer) => layer !== entity.layer)
			);
		}
		const collapsedLayers = currentStore.shared.collapsedLayers.get();
		if (collapsedLayers.includes(entity.layer)) {
			currentStore.shared.collapsedLayers.set(
				collapsedLayers.filter((layer) => layer !== entity.layer)
			);
		}
	},

	toggleLayer(layer: TDayMapLayer) {
		if (layer === 'task') {
			const isVisible = currentStore.persistence.isTaskLayerVisible.get();
			currentStore.persistence.isTaskLayerVisible.set(!isVisible);
			return;
		}
		const hiddenLayers = currentStore.persistence.hiddenLayers.get();
		currentStore.persistence.hiddenLayers.set(
			hiddenLayers.includes(layer)
				? hiddenLayers.filter((item) => item !== layer)
				: [...hiddenLayers, layer]
		);
	},

	toggleLayerGroup(layer: TDayMapLayer) {
		const collapsedLayers = currentStore.shared.collapsedLayers.get();
		currentStore.shared.collapsedLayers.set(
			collapsedLayers.includes(layer)
				? collapsedLayers.filter((item) => item !== layer)
				: [...collapsedLayers, layer]
		);
	},

	setIgnoredPreferencesHiddenLayers(layers: TDayMapLayer[] | null) {
		currentStore.shared.ignoredPreferencesHiddenLayers.set(layers);
	},

	setQuery(query: string) {
		currentStore.shared.query.set(query);
	},

	toggleSidebar() {
		const isCollapsed = currentStore.persistence.isSidebarCollapsed.get();
		const nextIsCollapsed = !isCollapsed;
		currentStore.persistence.isSidebarCollapsed.set(nextIsCollapsed);
		safeStorage.setItem(
			MAP_SIDEBAR_COLLAPSED_BOOT_KEY,
			String(nextIsCollapsed)
		);
	},
}));
