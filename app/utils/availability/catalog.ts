import { type TDlc } from '@/data';

import { deriveAllAvailabilityEntries } from './derive';
import type {
	IAvailabilityAuditEntry,
	IAvailabilityItemData,
	IAvailabilityPath,
	TAvailabilityCategory,
} from './types';

interface IDlcFilterItem {
	availabilityDlcs: ReadonlyArray<TDlc>;
	dlc: TDlc;
}

const DLC_FILTER_EQUIVALENCE_CACHE = new WeakMap<
	ReadonlyArray<IDlcFilterItem>,
	boolean
>();

function createAvailabilityEntryKey(
	category: TAvailabilityCategory,
	id: number
) {
	return `${category}:${id}`;
}

const availabilityEntries = deriveAllAvailabilityEntries();
const availabilityEntryMap = new Map<string, IAvailabilityAuditEntry>();

availabilityEntries.forEach((entry) => {
	const key = createAvailabilityEntryKey(entry.category, entry.id);
	if (availabilityEntryMap.has(key)) {
		throw new Error(`可获取性资料键重复：${key}`);
	}
	availabilityEntryMap.set(key, entry);
});

export function getAvailabilityEntry(
	category: TAvailabilityCategory,
	id: number
) {
	const key = createAvailabilityEntryKey(category, id);
	const entry = availabilityEntryMap.get(key);
	if (entry === undefined) {
		throw new Error(`找不到可获取性资料：${key}`);
	}
	return entry;
}

export function projectAvailabilityDlcs(
	paths: ReadonlyArray<IAvailabilityPath>
) {
	const dlcs = new Set<TDlc>();

	paths.forEach(({ requiredDlcs }) => {
		const namedDlcs = requiredDlcs.filter((dlc) => dlc !== 0);
		if (namedDlcs.length === 0) {
			dlcs.add(0);
		} else if (namedDlcs.length === 1) {
			dlcs.add(namedDlcs[0] as TDlc);
		}
	});

	return [...dlcs].sort((left, right) => left - right);
}

export function hasEquivalentDlcFilters(data: ReadonlyArray<IDlcFilterItem>) {
	const cachedResult = DLC_FILTER_EQUIVALENCE_CACHE.get(data);
	if (cachedResult !== undefined) {
		return cachedResult;
	}

	const result = data.every(
		({ availabilityDlcs, dlc }) =>
			availabilityDlcs.length === 1 && availabilityDlcs[0] === dlc
	);
	DLC_FILTER_EQUIVALENCE_CACHE.set(data, result);

	return result;
}

export function attachAvailabilityData<T extends { id: number; name: string }>(
	category: TAvailabilityCategory,
	data: ReadonlyArray<T>
): Array<T & IAvailabilityItemData> {
	return data.map((item) => {
		const entry = getAvailabilityEntry(category, item.id);
		if (entry.name !== item.name) {
			throw new Error(`可获取性资料名称不匹配：${category}:${item.id}`);
		}

		return {
			...item,
			availabilityDlcs: projectAvailabilityDlcs(entry.availabilityPaths),
			availabilityPaths: entry.availabilityPaths,
		};
	});
}

export function isAvailableWithHiddenDlcs(
	paths: ReadonlyArray<IAvailabilityPath>,
	hiddenDlcs: ReadonlySet<TDlc>
) {
	return paths.some(({ requiredDlcs }) =>
		requiredDlcs.every((dlc) => dlc === 0 || !hiddenDlcs.has(dlc))
	);
}

export function filterAvailableItemsByHiddenDlcs<
	T extends IAvailabilityItemData,
>(data: ReadonlyArray<T>, hiddenDlcs: ReadonlySet<TDlc>) {
	return data.filter((item) =>
		isAvailableWithHiddenDlcs(item.availabilityPaths, hiddenDlcs)
	);
}
