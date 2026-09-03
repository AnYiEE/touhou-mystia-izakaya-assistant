import {
	SYNC_NAMESPACE_SET,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { SYNC_SCHEMA_VERSION_MAP } from './constants';
import {
	checkKnownSyncNamespace,
	normalizeSyncStateData,
} from './normalizeSyncStateData';
import { parseClientSyncGeneration } from './protocol';
import { hasExactKeys } from './serializers/utils';
import type { ISyncStateChange, ISyncStatePutBody } from './types';

export type TParseSyncStatePutBodyResult =
	| { status: 'ok'; body: ISyncStatePutBody }
	| { status: 'invalid-structure' }
	| {
			namespace: string;
			status: 'update-required';
			reason:
				| 'future-schema'
				| 'unknown-namespace'
				| 'schema-version-downgrade';
			schema_version?: number;
			current_schema_version?: number;
	  };

export function parseSyncStatePutBody(
	body: unknown,
	allowedExtraRootKeys: string[] = []
): TParseSyncStatePutBodyResult {
	const syncGeneration = parseClientSyncGeneration(body);
	const rootKeys = [
		'changes',
		'state_epoch',
		'sync_generation',
		...allowedExtraRootKeys,
	];
	if (
		!isObjectTagRecord(body) ||
		!hasExactKeys(body, rootKeys) ||
		!('state_epoch' in body) ||
		!isNonNegativeSafeInteger(body['state_epoch']) ||
		syncGeneration === null ||
		!('changes' in body) ||
		!Array.isArray(body['changes'])
	) {
		return { status: 'invalid-structure' };
	}

	const changes: ISyncStateChange[] = [];
	const seenNamespaces = new Set<TSyncNamespace>();

	for (const change of body['changes']) {
		if (!isObjectTagRecord(change)) {
			return { status: 'invalid-structure' };
		}

		const { namespace } = change;
		if (typeof namespace !== 'string') {
			return { status: 'invalid-structure' };
		}
		if (!checkKnownSyncNamespace(namespace)) {
			return {
				namespace,
				reason: 'unknown-namespace',
				status: 'update-required',
			};
		}
		if (
			!(
				'data' in change &&
				'namespace' in change &&
				'revision' in change &&
				'schema_version' in change
			)
		) {
			return { status: 'invalid-structure' };
		}

		const { data, revision, schema_version: schemaVersion } = change;
		if (
			!isNonNegativeSafeInteger(revision) ||
			revision >= Number.MAX_SAFE_INTEGER ||
			!isNonNegativeSafeInteger(schemaVersion)
		) {
			return { status: 'invalid-structure' };
		}

		const currentSchemaVersion = SYNC_SCHEMA_VERSION_MAP[namespace];
		if (schemaVersion > currentSchemaVersion) {
			return {
				current_schema_version: currentSchemaVersion,
				namespace,
				reason: 'future-schema',
				schema_version: schemaVersion,
				status: 'update-required',
			};
		}
		if (schemaVersion !== currentSchemaVersion) {
			return {
				current_schema_version: currentSchemaVersion,
				namespace,
				reason: 'schema-version-downgrade',
				schema_version: schemaVersion,
				status: 'update-required',
			};
		}

		if (!isObjectTagRecord(data)) {
			continue;
		}

		if (seenNamespaces.has(namespace)) {
			return { status: 'invalid-structure' };
		}

		seenNamespaces.add(namespace);

		const parsedChange = {
			data,
			namespace,
			revision,
			schema_version: schemaVersion,
		} satisfies ISyncStateChange;

		const normalizedResult = normalizeSyncStateData(parsedChange);
		if (normalizedResult.status === 'future-schema') {
			return {
				current_schema_version: normalizedResult.current_schema_version,
				namespace: normalizedResult.namespace,
				reason: 'future-schema',
				schema_version: normalizedResult.schema_version,
				status: 'update-required',
			};
		}
		if (normalizedResult.status === 'unknown-namespace') {
			return {
				namespace: normalizedResult.namespace,
				reason: 'unknown-namespace',
				status: 'update-required',
			};
		}

		changes.push({
			data: normalizedResult.data,
			namespace: parsedChange.namespace,
			revision: parsedChange.revision,
			schema_version: normalizedResult.schema_version,
		});
	}

	if (changes.length > SYNC_NAMESPACE_SET.size) {
		return { status: 'invalid-structure' };
	}

	return {
		body: {
			changes,
			state_epoch: body['state_epoch'],
			sync_generation: syncGeneration,
		},
		status: 'ok',
	};
}

export function checkSyncStateRebuildChanges(changes: ISyncStateChange[]) {
	return (
		changes.length === SYNC_NAMESPACE_SET.size &&
		changes.every((change) => change.revision === 0)
	);
}
