import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
	checkAccountSyncStatus,
} from '@/domain/account/contracts';

import {
	SYNC_SCHEMA_VERSION_MAP,
	checkSupportedSyncSchemaVersion,
} from '@/features/account/sync/constants';
import type {
	ISyncStateGetResponse,
	ISyncStatePutResponse,
	ISyncStateRecord,
	TSyncStatePutResult,
} from '@/features/account/sync/types';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { checkIsRecord } from '@/shared/utilities/objects/checkIsRecord';

const SYNC_NAMESPACE_SET = new Set<TSyncNamespace>(
	Object.values(SYNC_NAMESPACE_MAP)
);

export function checkRemoteRevision(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

function checkSyncNamespace(value: unknown): value is TSyncNamespace {
	return (
		typeof value === 'string' &&
		SYNC_NAMESPACE_SET.has(value as TSyncNamespace)
	);
}

function checkRemoteSyncSchemaVersion(
	namespace: TSyncNamespace,
	version: unknown
): version is number {
	if (
		isNonNegativeSafeInteger(version) &&
		version > SYNC_SCHEMA_VERSION_MAP[namespace]
	) {
		throw new TypeError('sync-client-update-required');
	}

	return checkSupportedSyncSchemaVersion(namespace, version);
}

function validateRemoteSyncRecord(record: unknown): ISyncStateRecord {
	if (!checkIsRecord(record)) {
		throw new TypeError('invalid-sync-state-record');
	}
	const {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		updated_at: updatedAt,
	} = record;

	if (
		!checkSyncNamespace(namespace) ||
		!checkRemoteRevision(revision) ||
		!isNonNegativeSafeInteger(updatedAt)
	) {
		throw new TypeError('invalid-sync-state-record');
	}
	if (!checkRemoteSyncSchemaVersion(namespace, schemaVersion)) {
		throw new TypeError('invalid-sync-state-record');
	}

	return {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		updated_at: updatedAt,
	};
}

export function validateRemoteSyncState(
	response: unknown
): ISyncStateGetResponse {
	if (!checkIsRecord(response)) {
		throw new TypeError('invalid-sync-state');
	}

	const {
		records,
		state_epoch: stateEpoch,
		sync_generation: syncGeneration,
		sync_status: syncStatus,
	} = response;

	if (!Array.isArray(records)) {
		throw new TypeError('invalid-sync-state');
	}

	if (!isNonNegativeSafeInteger(stateEpoch)) {
		throw new TypeError('invalid-sync-state-epoch');
	}
	if (
		!isNonNegativeSafeInteger(syncGeneration) ||
		!checkAccountSyncStatus(syncStatus)
	) {
		throw new TypeError('invalid-sync-generation');
	}

	return {
		records: records.map(validateRemoteSyncRecord),
		state_epoch: stateEpoch,
		sync_generation: syncGeneration,
		sync_status: syncStatus,
	};
}

function validateSyncPutResult(result: unknown): TSyncStatePutResult {
	if (!checkIsRecord(result)) {
		throw new TypeError('invalid-sync-result');
	}
	const { namespace, status } = result;

	if (!checkSyncNamespace(namespace)) {
		throw new TypeError('invalid-sync-result');
	}

	if (status === 'error') {
		const { message } = result;
		if (typeof message !== 'string') {
			throw new TypeError('invalid-sync-result');
		}
		if (message === 'sync-account-capacity-exceeded') {
			const {
				candidate_bytes: candidateBytes,
				candidate_namespace_bytes: candidateNamespaceBytes,
				current_bytes: currentBytes,
				current_namespace_bytes: currentNamespaceBytes,
				limit_bytes: limitBytes,
				namespaces,
			} = result;
			if (
				!isNonNegativeSafeInteger(candidateBytes) ||
				!isNonNegativeSafeInteger(candidateNamespaceBytes) ||
				!isNonNegativeSafeInteger(currentBytes) ||
				!isNonNegativeSafeInteger(currentNamespaceBytes) ||
				!isNonNegativeSafeInteger(limitBytes) ||
				limitBytes === 0 ||
				!Array.isArray(namespaces) ||
				!namespaces.every(checkSyncNamespace)
			) {
				throw new TypeError('invalid-sync-result');
			}

			return {
				candidate_bytes: candidateBytes,
				candidate_namespace_bytes: candidateNamespaceBytes,
				current_bytes: currentBytes,
				current_namespace_bytes: currentNamespaceBytes,
				limit_bytes: limitBytes,
				message,
				namespace,
				namespaces,
				status,
			};
		}
		if (message === 'sync-schema-update-required') {
			const { current_schema_version: currentSchemaVersion } = result;
			if (
				!isNonNegativeSafeInteger(currentSchemaVersion) ||
				currentSchemaVersion <= SYNC_SCHEMA_VERSION_MAP[namespace]
			) {
				throw new TypeError('invalid-sync-result');
			}

			return {
				current_schema_version: currentSchemaVersion,
				message,
				namespace,
				status,
			};
		}

		return { message, namespace, status };
	}

	if (status !== 'ok' && status !== 'conflict') {
		throw new TypeError('invalid-sync-result');
	}
	const { revision, updated_at: updatedAt } = result;

	if (
		!checkRemoteRevision(revision) ||
		!isNonNegativeSafeInteger(updatedAt)
	) {
		throw new TypeError('invalid-sync-result');
	}

	if (status === 'ok') {
		return { namespace, revision, status, updated_at: updatedAt };
	}
	const { data, schema_version: schemaVersion } = result;
	if (!checkRemoteSyncSchemaVersion(namespace, schemaVersion)) {
		throw new TypeError('invalid-sync-result');
	}

	return {
		data,
		namespace,
		revision,
		schema_version: schemaVersion,
		status,
		updated_at: updatedAt,
	};
}

export function validateSyncPutResponse(
	response: unknown
): ISyncStatePutResponse {
	if (!checkIsRecord(response)) {
		throw new TypeError('invalid-sync-result');
	}

	const {
		results,
		state_epoch: stateEpoch,
		sync_generation: syncGeneration,
		sync_status: syncStatus,
	} = response;

	if (!Array.isArray(results)) {
		throw new TypeError('invalid-sync-result');
	}

	if (!isNonNegativeSafeInteger(stateEpoch)) {
		throw new TypeError('invalid-sync-state-epoch');
	}
	if (
		!isNonNegativeSafeInteger(syncGeneration) ||
		!checkAccountSyncStatus(syncStatus)
	) {
		throw new TypeError('invalid-sync-generation');
	}

	return {
		results: results.map(validateSyncPutResult),
		state_epoch: stateEpoch,
		sync_generation: syncGeneration,
		sync_status: syncStatus,
	};
}

export function getRecordMap(records: ISyncStateRecord[]) {
	return records.reduce<Partial<Record<TSyncNamespace, ISyncStateRecord>>>(
		(result, record) => {
			result[record.namespace] = record;
			return result;
		},
		{}
	);
}
