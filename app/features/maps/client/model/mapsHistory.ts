import isObject from 'lodash/isObject.js';

import { type ICollectionPointYieldProduct } from '@/domain/data/places/collectionYieldFacts';

import {
	readHistoryEntryValue,
	removeHistoryEntryValue,
	writeHistoryEntryValue,
} from '@/features/appShell/client/navigation/historyEntryState';

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
	return typeof depth === 'number' && typeof hasOrigin === 'boolean'
		? { depth, hasOrigin }
		: null;
}

export function writeMapsVisit(visit: IMapsVisit) {
	writeHistoryEntryValue(MAPS_VISIT_HISTORY_KEY, visit);
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

/** @description Reads and forgets the remembered popover, so it opens once. */
export function takeOpenedMapItem(): IOpenedMapItem | null {
	const value = readHistoryEntryValue(OPENED_MAP_ITEM_HISTORY_KEY);
	if (value === undefined) {
		return null;
	}

	removeHistoryEntryValue(OPENED_MAP_ITEM_HISTORY_KEY);
	if (!isObject(value)) {
		return null;
	}

	const entityId = 'entityId' in value ? value.entityId : undefined;
	const itemKey = 'itemKey' in value ? value.itemKey : undefined;
	return typeof entityId === 'string' && typeof itemKey === 'string'
		? { entityId, itemKey }
		: null;
}
