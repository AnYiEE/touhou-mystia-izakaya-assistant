import {
	SYNC_NAMESPACE_SET,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	SYNC_MIN_SCHEMA_VERSION_MAP,
	SYNC_SCHEMA_VERSION_MAP,
} from './constants';
import { getSyncShape } from './shapes/registry';
import type { ISyncStateChange } from './types';

export type TNormalizeSyncStateDataResult =
	| { data: unknown; schema_version: number; status: 'accepted' }
	| {
			namespace: string;
			status: 'future-schema';
			schema_version: number;
			current_schema_version: number;
	  }
	| { namespace: string; status: 'unknown-namespace' };

export function checkKnownSyncNamespace(
	value: unknown
): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

export function normalizeSyncStateData(
	change: Pick<
		ISyncStateChange,
		'data' | 'namespace' | 'revision' | 'schema_version'
	>
): TNormalizeSyncStateDataResult {
	if (!checkKnownSyncNamespace(change.namespace)) {
		return { namespace: change.namespace, status: 'unknown-namespace' };
	}

	const currentSchemaVersion = SYNC_SCHEMA_VERSION_MAP[change.namespace];
	if (change.schema_version > currentSchemaVersion) {
		return {
			current_schema_version: currentSchemaVersion,
			namespace: change.namespace,
			schema_version: change.schema_version,
			status: 'future-schema',
		};
	}
	const shape = getSyncShape(change.namespace);
	if (shape === undefined) {
		return { namespace: change.namespace, status: 'unknown-namespace' };
	}

	let migratedData: unknown;
	try {
		migratedData =
			change.schema_version <
			SYNC_MIN_SCHEMA_VERSION_MAP[change.namespace]
				? shape.createDefault()
				: change.schema_version === currentSchemaVersion
					? change.data
					: shape.migrate(change.data, change.schema_version);
	} catch {
		migratedData = shape.createDefault();
	}

	let normalized: unknown;
	try {
		normalized = shape.normalize(migratedData);
	} catch {
		normalized = shape.createDefault();
	}
	if (!shape.validate(normalized)) {
		normalized = shape.normalize(shape.createDefault());
	}

	return {
		data: normalized,
		schema_version: currentSchemaVersion,
		status: 'accepted',
	};
}
