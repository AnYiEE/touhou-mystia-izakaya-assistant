import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
} from '@/features/account/client/storage';

const DIRTY_QUEUE_STORAGE_KEY_PREFIX = `${ACCOUNT_STORAGE_KEY_MAP.dirtyQueue}:`;
const DIRTY_QUEUE_V2_STORAGE_KEY_PREFIX = `${ACCOUNT_STORAGE_KEY_MAP.dirtyQueueV2}:`;
const DIRTY_TRANSITION_STORAGE_KEY_PREFIX = `${ACCOUNT_STORAGE_KEY_MAP.dirtyTransition}:`;

export type TDirtyQueueStorageKeyMatch =
	| { isLegacyKey: boolean; kind: 'known'; namespace: TSyncNamespace }
	| { kind: 'unknown' };

export function createDirtyQueueKey(userId: string, namespace: TSyncNamespace) {
	return createAccountStorageKey(
		namespace === SYNC_NAMESPACE_MAP.customerRarePlans
			? ACCOUNT_STORAGE_KEY_MAP.dirtyQueueV2
			: ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

export function createLegacyDirtyQueueKey(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyQueue,
		userId,
		namespace
	);
}

export function createDirtyQueueIntentPrefix(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyTransition,
		userId,
		namespace,
		''
	);
}

export function createDirtyQueueEvidencePrefix(
	userId: string,
	namespace: TSyncNamespace
) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.dirtyEvidence,
		userId,
		namespace,
		''
	);
}

export function createDirtyQueueIntentKey(
	userId: string,
	namespace: TSyncNamespace,
	operationId: string
) {
	return `${createDirtyQueueIntentPrefix(userId, namespace)}${operationId}`;
}

export function matchDirtyQueueStorageKey(
	userId: string,
	key: string | null
): TDirtyQueueStorageKeyMatch | null {
	if (
		key === null ||
		(!key.startsWith(DIRTY_QUEUE_STORAGE_KEY_PREFIX) &&
			!key.startsWith(DIRTY_QUEUE_V2_STORAGE_KEY_PREFIX) &&
			!key.startsWith(DIRTY_TRANSITION_STORAGE_KEY_PREFIX))
	) {
		return null;
	}

	const namespace = Object.values(SYNC_NAMESPACE_MAP).find(
		(item) =>
			createDirtyQueueKey(userId, item) === key ||
			(item === SYNC_NAMESPACE_MAP.customerRarePlans &&
				createLegacyDirtyQueueKey(userId, item) === key) ||
			key.startsWith(createDirtyQueueIntentPrefix(userId, item))
	);
	if (namespace === undefined) {
		return { kind: 'unknown' };
	}

	return {
		isLegacyKey:
			namespace === SYNC_NAMESPACE_MAP.customerRarePlans &&
			createLegacyDirtyQueueKey(userId, namespace) === key,
		kind: 'known',
		namespace,
	};
}
