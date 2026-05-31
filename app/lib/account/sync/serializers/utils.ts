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
	if (
		data === undefined ||
		typeof data === 'function' ||
		typeof data === 'symbol'
	) {
		return 'undefined';
	}

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
	userId,
}: {
	cloud: T;
	local: T;
	namespace: TSyncNamespace;
	userId: string;
}): ISyncConflictItem<T> {
	return { cloud, local, merged: null, namespace, revision: 0, userId };
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
	const normalizedBase = base === undefined ? defaults : base;
	const normalizedCloud = cloud === undefined ? defaults : cloud;
	const normalizedLocal = local === undefined ? defaults : local;

	if (
		isPlainObject(defaults) &&
		isPlainObject(normalizedCloud) &&
		isPlainObject(normalizedLocal) &&
		(normalizedBase === null || isPlainObject(normalizedBase))
	) {
		const data: Record<string, unknown> = {};
		let shouldUpload = false;

		Object.keys(defaults).forEach((key) => {
			const merged = mergeFieldValue({
				base: normalizedBase === null ? null : normalizedBase[key],
				cloud: normalizedCloud[key],
				defaults: defaults[key],
				local: normalizedLocal[key],
			});

			data[key] = merged.data;
			shouldUpload ||= merged.shouldUpload;
		});

		return { data, shouldUpload };
	}

	if (normalizedBase === null) {
		if (checkSnapshotEqual(normalizedLocal, defaults)) {
			return { data: normalizedCloud, shouldUpload: false };
		}
		if (
			!checkSnapshotEqual(normalizedCloud, defaults) &&
			!checkSnapshotEqual(normalizedCloud, normalizedLocal)
		) {
			return { data: normalizedCloud, shouldUpload: false };
		}

		return {
			data: normalizedLocal,
			shouldUpload: !checkSnapshotEqual(normalizedLocal, normalizedCloud),
		};
	}

	const hasLocalChange = !checkSnapshotEqual(normalizedLocal, normalizedBase);
	const hasCloudChange = !checkSnapshotEqual(normalizedCloud, normalizedBase);

	if (!hasLocalChange || hasCloudChange) {
		return { data: normalizedCloud, shouldUpload: false };
	}

	return {
		data: normalizedLocal,
		shouldUpload: !checkSnapshotEqual(normalizedLocal, normalizedCloud),
	};
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
		const sanitizedLocal = mergeFieldValue({
			base: null,
			cloud: defaults,
			defaults,
			local,
		}) as { data: T; shouldUpload: boolean };

		return {
			data: sanitizedLocal.data,
			shouldUpload: !checkSnapshotEqual(sanitizedLocal.data, defaults),
		};
	}

	return mergeFieldValue({ base, cloud, defaults, local }) as {
		data: T;
		shouldUpload: boolean;
	};
}
