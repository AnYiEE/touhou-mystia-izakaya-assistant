import {
	type ISyncConflictItem,
	type ISyncMergeResult,
	type TSyncNamespace,
} from '@/lib/account/sync';

export function isPlainObject(data: unknown): data is Record<string, unknown> {
	return data !== null && !Array.isArray(data) && typeof data === 'object';
}

export function isStringArray(data: unknown): data is string[] {
	return (
		Array.isArray(data) && data.every((item) => typeof item === 'string')
	);
}

export function stableJson(data: unknown): string {
	if (Array.isArray(data)) {
		return `[${data.map(stableJson).join(',')}]`;
	}
	if (isPlainObject(data)) {
		return `{${Object.keys(data)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableJson(data[key])}`)
			.join(',')}}`;
	}

	return JSON.stringify(data);
}

export function checkSnapshotEqual(left: unknown, right: unknown) {
	return stableJson(left) === stableJson(right);
}

export function createSerializerConflict<T>({
	cloud,
	local,
	namespace,
}: {
	cloud: T;
	local: T;
	namespace: TSyncNamespace;
}): ISyncConflictItem<T> {
	return { cloud, local, merged: null, namespace, revision: 0 };
}

export function createMergeResult<T>({
	conflict = null,
	data,
	shouldUpload,
}: {
	conflict?: ISyncConflictItem<T> | null;
	data: T;
	shouldUpload: boolean;
}): ISyncMergeResult<T> {
	return { conflict, data, shouldUpload };
}

function mergeFieldValue({
	base,
	cloud,
	defaults,
	local,
}: {
	base: unknown;
	cloud: unknown;
	defaults: unknown;
	local: unknown;
}): { data: unknown; shouldUpload: boolean } {
	if (
		isPlainObject(defaults) &&
		isPlainObject(cloud) &&
		isPlainObject(local) &&
		(base === null || isPlainObject(base))
	) {
		const data = { ...cloud };
		let shouldUpload = false;

		Object.keys(defaults).forEach((key) => {
			const merged = mergeFieldValue({
				base: base === null ? null : base[key],
				cloud: cloud[key],
				defaults: defaults[key],
				local: local[key],
			});

			data[key] = merged.data;
			shouldUpload ||= merged.shouldUpload;
		});

		return { data, shouldUpload };
	}

	if (base === null) {
		if (checkSnapshotEqual(local, defaults)) {
			return { data: cloud, shouldUpload: false };
		}
		if (
			!checkSnapshotEqual(cloud, defaults) &&
			!checkSnapshotEqual(cloud, local)
		) {
			return { data: cloud, shouldUpload: false };
		}

		return { data: local, shouldUpload: !checkSnapshotEqual(local, cloud) };
	}

	const hasLocalChange = !checkSnapshotEqual(local, base);
	const hasCloudChange = !checkSnapshotEqual(cloud, base);
	const isLocalDefault = checkSnapshotEqual(local, defaults);

	if (!hasLocalChange || isLocalDefault || hasCloudChange) {
		return { data: cloud, shouldUpload: false };
	}

	return { data: local, shouldUpload: !checkSnapshotEqual(local, cloud) };
}

export function mergeFieldMap<T extends object>({
	base,
	cloud,
	defaults,
	local,
}: {
	base: T | null;
	cloud: T | null;
	defaults: T;
	local: T;
}) {
	if (cloud === null) {
		return {
			data: local,
			shouldUpload: !checkSnapshotEqual(local, defaults),
		};
	}

	return mergeFieldValue({ base, cloud, defaults, local }) as {
		data: T;
		shouldUpload: boolean;
	};
}
