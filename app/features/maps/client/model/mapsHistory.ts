import isObject from 'lodash/isObject.js';

import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import {
	readHistoryEntryValue,
	removeHistoryEntryValue,
	writeHistoryEntryValue,
} from '@/features/appShell/client/navigation/historyEntryState';
import { MAPS_PAGE_PATH } from '@/features/maps/links';

const MAPS_VISIT_HISTORY_KEY = 'mapsVisit';
const OPENED_MAP_ITEM_HISTORY_KEY = 'openedMapItem';

/**
 * @description Where a history entry of the map page sits in one visit: how
 * many map entries precede it, and whether a page of this site precedes those.
 */
export interface IMapsVisit {
	depth: number;
	hasOrigin: boolean;
}

export function readMapsVisit(): IMapsVisit | null {
	const value = readHistoryEntryValue(MAPS_VISIT_HISTORY_KEY);
	if (!isObject(value)) {
		return null;
	}

	const depth = 'depth' in value ? value.depth : undefined;
	const hasOrigin = 'hasOrigin' in value ? value.hasOrigin : undefined;
	return typeof depth === 'number' &&
		Number.isSafeInteger(depth) &&
		depth >= 0 &&
		typeof hasOrigin === 'boolean'
		? { depth, hasOrigin }
		: null;
}

let pendingVisit: { href: string; visit: IMapsVisit } | null = null;

function getNextMapsVisit(): IMapsVisit {
	const isOnMap =
		location.pathname === MAPS_PAGE_PATH ||
		location.pathname.startsWith(`${MAPS_PAGE_PATH}/`);
	const current = isOnMap ? readMapsVisit() : null;
	return isOnMap
		? {
				depth: (current?.depth ?? 0) + 1,
				hasOrigin: current?.hasOrigin ?? false,
			}
		: { depth: 0, hasOrigin: true };
}

/** @description Capture the current entry before the router pushes a map link. */
export function prepareMapsNavigation(href: string) {
	const target = new URL(href, location.href);
	pendingVisit =
		target.href === location.href
			? null
			: { href: target.href, visit: getNextMapsVisit() };
}

/** @description Restore a visit on back/forward, or consume an explicitly opened map link. */
export function initializeMapsVisit(): IMapsVisit {
	const pending = pendingVisit;
	pendingVisit = null;
	const visit =
		pending?.href === location.href
			? pending.visit
			: (readMapsVisit() ?? { depth: 0, hasOrigin: false });
	writeHistoryEntryValue(MAPS_VISIT_HISTORY_KEY, visit);
	return visit;
}

/** @description A map transition gets its own entry; marker selection only replaces the URL. */
export function pushMapsHistoryEntry(href: string) {
	if (new URL(href, location.href).href === location.href) {
		return;
	}
	pendingVisit = null;
	globalThis.history.pushState(
		{ [MAPS_VISIT_HISTORY_KEY]: getNextMapsVisit() },
		'',
		href
	);
}

export type TMapItemProduct = Pick<
	ICollectionPointYieldProduct,
	'productId' | 'productType'
>;

export function getMapItemKey({ productId, productType }: TMapItemProduct) {
	return `${productType}:${productId}`;
}

/** @description The item popover that was open when a link in it left the map entry. */
export interface IOpenedMapItem {
	entityId: string;
	itemKey: string;
}

export function rememberOpenedMapItem(item: IOpenedMapItem) {
	writeHistoryEntryValue(OPENED_MAP_ITEM_HISTORY_KEY, item);
}

/** @description Reads the popover to restore on every visit to this entry. */
export function readOpenedMapItem(): IOpenedMapItem | null {
	const value = readHistoryEntryValue(OPENED_MAP_ITEM_HISTORY_KEY);
	if (value === undefined) {
		return null;
	}

	if (!isObject(value)) {
		return null;
	}

	const entityId = 'entityId' in value ? value.entityId : undefined;
	const itemKey = 'itemKey' in value ? value.itemKey : undefined;
	return typeof entityId === 'string' && typeof itemKey === 'string'
		? { entityId, itemKey }
		: null;
}

export function clearOpenedMapItem() {
	removeHistoryEntryValue(OPENED_MAP_ITEM_HISTORY_KEY);
}
