import { type TSyncNamespace } from '@/domain/account/contracts';

import { SYNC_SCHEMA_VERSION_MAP } from '@/features/account/sync/constants';
import type {
	ISyncConflictItem,
	TSyncPausedReason,
} from '@/features/account/sync/types';

import { isNonNegativeSafeInteger } from '@/shared/utilities/numbers/check';
import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { checkSnapshotHashMatches, createSnapshotHash } from './snapshotHash';

export const SYNC_PAUSED_REASON_SET = new Set<TSyncPausedReason | null>([
	null,
	'applying-remote',
	'bootstrap',
	'cloud-paused',
	'conflict',
	'delete-data',
	'importing-backup',
]);

export const MAX_LOCAL_COLLISION_STRING_LENGTH = 256;

export interface IDirtyQueueIntent {
	canonicalSourceValue: string | null;
	covers: string[];
	createdAt: number;
	expectedValue: string | null;
	intentHash: string;
	isolationReason: null | 'corrupt-legacy' | 'legacy-canonical-collision';
	legacySourceValue?: string | null;
	namespace: TSyncNamespace;
	operationId: string;
	resetGeneration?: string | null;
	resultValue: string | null;
	userId: string;
	version: 1;
}

export interface IDirtyQueueEvidence {
	createdAt: number;
	namespace: TSyncNamespace;
	rawHash: string;
	rawValue: string;
	resolvedAt?: number;
	sourceKey: string;
	userId: string;
	version: 1;
}

export type TDirtyQueueIntentPayload = Omit<IDirtyQueueIntent, 'intentHash'>;

export function checkSyncRevision(value: unknown): value is number {
	return isNonNegativeSafeInteger(value) && value < Number.MAX_SAFE_INTEGER;
}

function checkDirtyQueueLocalCollision(value: unknown) {
	if (value === undefined) {
		return true;
	}
	if (
		!isObjectTagRecord(value) ||
		value['version'] !== 1 ||
		!isNonNegativeSafeInteger(value['invalidEvidenceCount']) ||
		typeof value['token'] !== 'string' ||
		value['token'].length === 0 ||
		value['token'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
		!Array.isArray(value['candidates']) ||
		value['candidates'].length === 0
	) {
		return false;
	}
	const ids = new Set<string>();
	return value['candidates'].every((candidate) => {
		if (
			!isObjectTagRecord(candidate) ||
			!('data' in candidate) ||
			!checkSyncRevision(candidate['baseRevision']) ||
			!isNonNegativeSafeInteger(candidate['schemaVersion']) ||
			typeof candidate['id'] !== 'string' ||
			candidate['id'].length === 0 ||
			candidate['id'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
			typeof candidate['label'] !== 'string' ||
			candidate['label'].length === 0 ||
			candidate['label'].length > MAX_LOCAL_COLLISION_STRING_LENGTH ||
			typeof candidate['snapshotHash'] !== 'string' ||
			candidate['snapshotHash'].length === 0 ||
			candidate['snapshotHash'].length >
				MAX_LOCAL_COLLISION_STRING_LENGTH ||
			!checkSnapshotHashMatches(
				candidate['data'],
				candidate['snapshotHash']
			) ||
			ids.has(candidate['id'])
		) {
			return false;
		}
		ids.add(candidate['id']);
		return true;
	});
}

export function checkDirtyQueueConflict(
	value: unknown,
	namespace: TSyncNamespace,
	userId: string
): value is ISyncConflictItem {
	return (
		isObjectTagRecord(value) &&
		(value['automaticResolution'] === undefined ||
			(value['localCollision'] === undefined &&
				(value['automaticResolution'] === 'cloud' ||
					(value['automaticResolution'] === 'merged' &&
						value['merged'] !== null)))) &&
		'cloud' in value &&
		'local' in value &&
		'merged' in value &&
		value['namespace'] === namespace &&
		checkSyncRevision(value['revision']) &&
		value['userId'] === userId &&
		checkDirtyQueueLocalCollision(value['localCollision'])
	);
}

export function checkFutureSchemaDirtyQueueEntry(
	entry: unknown,
	namespace: TSyncNamespace
) {
	return (
		isObjectTagRecord(entry) &&
		entry['namespace'] === namespace &&
		isNonNegativeSafeInteger(entry['schema_version']) &&
		entry['schema_version'] > SYNC_SCHEMA_VERSION_MAP[namespace]
	);
}

export function parseDirtyQueueEvidence(
	value: unknown,
	userId: string,
	namespace: TSyncNamespace
): IDirtyQueueEvidence | null {
	if (
		!isObjectTagRecord(value) ||
		value['version'] !== 1 ||
		value['userId'] !== userId ||
		value['namespace'] !== namespace ||
		!isNonNegativeSafeInteger(value['createdAt']) ||
		(value['resolvedAt'] !== undefined &&
			!isNonNegativeSafeInteger(value['resolvedAt'])) ||
		typeof value['sourceKey'] !== 'string' ||
		typeof value['rawValue'] !== 'string' ||
		typeof value['rawHash'] !== 'string' ||
		value['rawHash'] !== createSnapshotHash(value['rawValue'])
	) {
		return null;
	}
	return value as unknown as IDirtyQueueEvidence;
}

export function createDirtyQueueIntentHash(intent: TDirtyQueueIntentPayload) {
	return createSnapshotHash(intent);
}

export function parseDirtyQueueIntent(
	value: string,
	userId: string,
	namespace: TSyncNamespace
): IDirtyQueueIntent | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return null;
	}
	if (!isObjectTagRecord(parsed)) {
		return null;
	}

	const {
		canonicalSourceValue,
		covers,
		createdAt,
		expectedValue,
		intentHash,
		isolationReason,
		legacySourceValue,
		namespace: storedNamespace,
		operationId,
		resetGeneration,
		resultValue,
		userId: storedUserId,
		version,
	} = parsed;
	if (
		version !== 1 ||
		storedUserId !== userId ||
		storedNamespace !== namespace ||
		!isNonNegativeSafeInteger(createdAt) ||
		!Array.isArray(covers) ||
		!covers.every((item) => typeof item === 'string' && item !== '') ||
		(isolationReason !== null &&
			isolationReason !== 'corrupt-legacy' &&
			isolationReason !== 'legacy-canonical-collision') ||
		typeof intentHash !== 'string' ||
		intentHash === '' ||
		typeof operationId !== 'string' ||
		operationId === '' ||
		(canonicalSourceValue !== null &&
			typeof canonicalSourceValue !== 'string') ||
		(expectedValue !== null && typeof expectedValue !== 'string') ||
		(resultValue !== null && typeof resultValue !== 'string') ||
		(resetGeneration !== undefined &&
			resetGeneration !== null &&
			typeof resetGeneration !== 'string') ||
		(legacySourceValue !== undefined &&
			legacySourceValue !== null &&
			typeof legacySourceValue !== 'string')
	) {
		return null;
	}

	const payload = {
		canonicalSourceValue,
		covers: covers as string[],
		createdAt,
		expectedValue,
		isolationReason,
		...(legacySourceValue === undefined ? {} : { legacySourceValue }),
		namespace,
		operationId,
		...(resetGeneration === undefined ? {} : { resetGeneration }),
		resultValue,
		userId,
		version: 1,
	} satisfies TDirtyQueueIntentPayload;
	if (createDirtyQueueIntentHash(payload) !== intentHash) {
		return null;
	}

	return { ...payload, intentHash };
}
