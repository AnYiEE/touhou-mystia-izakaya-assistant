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
	// Serializers are context-free; syncClient overwrites placeholder userId
	// before persisted conflicts reach UI resolution flows.
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
}): { data: unknown; hasConflict: boolean; shouldUpload: boolean } {
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
		let hasConflict = false;
		let shouldUpload = false;

		Object.keys(defaults).forEach((key) => {
			const merged = mergeFieldValue({
				base: normalizedBase === null ? null : normalizedBase[key],
				cloud: normalizedCloud[key],
				defaults: defaults[key],
				local: normalizedLocal[key],
			});

			data[key] = merged.data;
			hasConflict ||= merged.hasConflict;
			shouldUpload ||= merged.shouldUpload;
		});

		return { data, hasConflict, shouldUpload };
	}

	if (normalizedBase === null) {
		if (checkSnapshotEqual(normalizedLocal, defaults)) {
			return {
				data: normalizedCloud,
				hasConflict: false,
				shouldUpload: false,
			};
		}
		if (
			!checkSnapshotEqual(normalizedCloud, defaults) &&
			!checkSnapshotEqual(normalizedCloud, normalizedLocal)
		) {
			return {
				data: normalizedCloud,
				hasConflict: true,
				shouldUpload: false,
			};
		}

		return {
			data: normalizedLocal,
			hasConflict: false,
			shouldUpload: !checkSnapshotEqual(normalizedLocal, normalizedCloud),
		};
	}

	const hasLocalChange = !checkSnapshotEqual(normalizedLocal, normalizedBase);
	const hasCloudChange = !checkSnapshotEqual(normalizedCloud, normalizedBase);

	if (!hasLocalChange) {
		return {
			data: normalizedCloud,
			hasConflict: false,
			shouldUpload: false,
		};
	}
	if (!hasCloudChange) {
		return {
			data: normalizedLocal,
			hasConflict: false,
			shouldUpload: !checkSnapshotEqual(normalizedLocal, normalizedCloud),
		};
	}
	if (!checkSnapshotEqual(normalizedLocal, normalizedCloud)) {
		return {
			data: normalizedCloud,
			hasConflict: true,
			shouldUpload: false,
		};
	}

	return { data: normalizedLocal, hasConflict: false, shouldUpload: false };
}

export function mergeFieldMap<T extends object>({
	allowBaseNullAutoMerge = false,
	base,
	cloud,
	defaults,
	local,
	namespace,
}: {
	allowBaseNullAutoMerge?: boolean | undefined;
	base: T | null;
	cloud: T | null;
	defaults: T;
	local: T;
	namespace: TSyncNamespace;
}) {
	if (cloud === null) {
		const sanitizedLocal = mergeFieldValue({
			base: null,
			cloud: defaults,
			defaults,
			local,
		}) as { data: T; hasConflict: boolean; shouldUpload: boolean };

		return {
			conflict: null,
			data: sanitizedLocal.data,
			shouldUpload: !checkSnapshotEqual(sanitizedLocal.data, defaults),
		};
	}

	if (
		base === null &&
		!allowBaseNullAutoMerge &&
		!checkSnapshotEqual(local, cloud) &&
		!checkSnapshotEqual(cloud, defaults) &&
		!checkSnapshotEqual(local, defaults)
	) {
		return {
			conflict: createSerializerConflict({
				cloud,
				local,
				namespace,
				userId: '',
			}),
			data: cloud,
			shouldUpload: false,
		};
	}

	const merged = mergeFieldValue({ base, cloud, defaults, local }) as {
		data: T;
		hasConflict: boolean;
		shouldUpload: boolean;
	};
	if (merged.hasConflict) {
		return {
			conflict: createSerializerConflict({
				cloud,
				local,
				namespace,
				userId: '',
			}),
			data: cloud,
			shouldUpload: false,
		};
	}

	return {
		conflict: null,
		data: merged.data,
		shouldUpload: merged.shouldUpload,
	};
}
