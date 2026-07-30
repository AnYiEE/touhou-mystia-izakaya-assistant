import { sha1 } from 'js-sha1';

import type { IDirtyQueueEntry } from '@/features/account/sync/types';

function sortJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortJsonValue);
	}
	if (value !== null && typeof value === 'object') {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((result, key) => {
				const object = value as Record<string, unknown>;
				if (object[key] !== undefined) {
					result[key] = sortJsonValue(object[key]);
				}
				return result;
			}, {});
	}

	return value;
}

function createSnapshotStableJson(data: unknown) {
	const sortedData = sortJsonValue(data);
	if (
		sortedData === undefined ||
		typeof sortedData === 'function' ||
		typeof sortedData === 'symbol'
	) {
		return 'undefined';
	}

	return JSON.stringify(sortedData);
}

function createSnapshotDigest(stableJson: string) {
	return `sha1:${sha1(stableJson)}`;
}

export function createSnapshotHash(data: unknown): string {
	return createSnapshotDigest(createSnapshotStableJson(data));
}

export function checkSnapshotHashMatches(
	data: unknown,
	snapshotHash: string | undefined
) {
	if (snapshotHash === undefined) {
		return false;
	}

	const stableJson = createSnapshotStableJson(data);

	return (
		snapshotHash === createSnapshotDigest(stableJson) ||
		snapshotHash === stableJson
	);
}

export function checkSnapshotHashesEquivalent(
	currentEntry: IDirtyQueueEntry,
	entry: IDirtyQueueEntry
) {
	return (
		checkSnapshotHashMatches(currentEntry.data, entry.snapshotHash) &&
		checkSnapshotHashMatches(entry.data, currentEntry.snapshotHash)
	);
}
