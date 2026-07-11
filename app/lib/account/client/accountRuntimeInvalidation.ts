import { postAccountSyncBroadcastMessage } from './broadcast';
import { createAccountClientId } from './random';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	writeAccountJsonStorage,
} from './storage';

export type TAccountRuntimeInvalidationReason =
	| 'account-deleted'
	| 'credential-changed'
	| 'login'
	| 'logout'
	| 'logout-all'
	| 'password-changed'
	| 'password-required'
	| 'session-expired';

interface IAccountRuntimeSignalRecord {
	createdAt: number;
	operationId: string;
	reason: TAccountRuntimeInvalidationReason;
	state_epoch: number;
	userId: string;
	version: 1;
}

export const ACCOUNT_RUNTIME_SIGNAL_MAX_AGE_MS = 30 * 1000;
const ACCOUNT_RUNTIME_SIGNAL_FUTURE_TOLERANCE_MS = 5 * 1000;
const ACCOUNT_RUNTIME_SIGNAL_MAX_STRING_LENGTH = 256;
const ACCOUNT_RUNTIME_SIGNAL_MAX_PROCESSED_OPERATIONS = 256;
const ACCOUNT_RUNTIME_SIGNAL_VERSION = 1;
const ACCOUNT_RUNTIME_INVALIDATION_REASON_SET =
	new Set<TAccountRuntimeInvalidationReason>([
		'account-deleted',
		'credential-changed',
		'login',
		'logout',
		'logout-all',
		'password-changed',
		'password-required',
		'session-expired',
	]);
const processedAccountRuntimeOperations = new Map<string, number>();

function checkPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkBoundedString(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length > 0 &&
		value.length <= ACCOUNT_RUNTIME_SIGNAL_MAX_STRING_LENGTH
	);
}

export function createAccountRuntimeSignalKey(userId: string) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.runtimeSignal,
		userId
	);
}

export function createAccountRuntimeSignalRecord({
	createdAt,
	operationId,
	reason,
	stateEpoch,
	userId,
}: {
	createdAt: number;
	operationId: string;
	reason: TAccountRuntimeInvalidationReason;
	stateEpoch: number;
	userId: string;
}): IAccountRuntimeSignalRecord {
	return {
		createdAt,
		operationId,
		reason,
		state_epoch: stateEpoch,
		userId,
		version: ACCOUNT_RUNTIME_SIGNAL_VERSION,
	};
}

export function parseAccountRuntimeSignal({
	key,
	now = Date.now(),
	value,
}: {
	key: string;
	now?: number;
	value: string | null;
}): IAccountRuntimeSignalRecord | null {
	if (value === null) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return null;
	}

	if (!checkPlainObject(parsed)) {
		return null;
	}

	const {
		createdAt,
		operationId,
		reason,
		state_epoch: stateEpoch,
		userId,
		version,
	} = parsed;

	if (
		version !== ACCOUNT_RUNTIME_SIGNAL_VERSION ||
		!checkBoundedString(operationId) ||
		!checkBoundedString(userId) ||
		!ACCOUNT_RUNTIME_INVALIDATION_REASON_SET.has(
			reason as TAccountRuntimeInvalidationReason
		) ||
		!Number.isSafeInteger(stateEpoch) ||
		(stateEpoch as number) < 0 ||
		!Number.isSafeInteger(createdAt) ||
		(createdAt as number) >
			now + ACCOUNT_RUNTIME_SIGNAL_FUTURE_TOLERANCE_MS ||
		now - (createdAt as number) > ACCOUNT_RUNTIME_SIGNAL_MAX_AGE_MS ||
		key !== createAccountRuntimeSignalKey(userId)
	) {
		return null;
	}

	return createAccountRuntimeSignalRecord({
		createdAt: createdAt as number,
		operationId,
		reason: reason as TAccountRuntimeInvalidationReason,
		stateEpoch: stateEpoch as number,
		userId,
	});
}

export function consumeAccountRuntimeInvalidationOperation(
	operationId: string,
	now = Date.now()
) {
	if (!checkBoundedString(operationId)) {
		return false;
	}

	for (const [
		processedOperationId,
		processedAt,
	] of processedAccountRuntimeOperations) {
		if (now - processedAt > ACCOUNT_RUNTIME_SIGNAL_MAX_AGE_MS) {
			processedAccountRuntimeOperations.delete(processedOperationId);
		}
	}

	if (processedAccountRuntimeOperations.has(operationId)) {
		return false;
	}

	processedAccountRuntimeOperations.set(operationId, now);

	while (
		processedAccountRuntimeOperations.size >
		ACCOUNT_RUNTIME_SIGNAL_MAX_PROCESSED_OPERATIONS
	) {
		const oldestOperationId = processedAccountRuntimeOperations
			.keys()
			.next().value;

		if (oldestOperationId === undefined) {
			break;
		}

		processedAccountRuntimeOperations.delete(oldestOperationId);
	}

	return true;
}

export function publishAccountRuntimeInvalidation({
	reason,
	stateEpoch,
	userId,
}: {
	reason: TAccountRuntimeInvalidationReason;
	stateEpoch: number;
	userId: string;
}) {
	const mutationId = createAccountClientId();
	const createdAt = Date.now();
	const signal = createAccountRuntimeSignalRecord({
		createdAt,
		operationId: mutationId,
		reason,
		stateEpoch,
		userId,
	});

	try {
		writeAccountJsonStorage(createAccountRuntimeSignalKey(userId), signal);
	} catch {
		/* BroadcastChannel may still deliver the invalidation. */
	}

	return postAccountSyncBroadcastMessage({
		accountRuntime: {
			createdAt,
			reason,
			version: ACCOUNT_RUNTIME_SIGNAL_VERSION,
		},
		namespaces: [],
		operationId: mutationId,
		state_epoch: stateEpoch,
		tabId: 'account-runtime',
		type: 'account-updated',
		userId,
	});
}
