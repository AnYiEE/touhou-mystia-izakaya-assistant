import { postAccountSyncBroadcastMessage } from './broadcast';
import { createAccountClientId } from './random';
import { withAccountSyncPaused } from './stateGuards';
import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountJsonStorage,
	readAccountStorage,
	removeAccountStorage,
	writeAccountStorage,
} from './storage';
import {
	ACCOUNT_SYNC_OPERATION_KIND_MAP,
	type TAccountSyncOperationKind,
} from '@/lib/account/sync';
import { accountStore as store } from '@/stores';
import { withCrossTabLock } from '@/utilities/crossTabLock';

const ACCOUNT_SYNC_OPERATION_KIND_SET = new Set<TAccountSyncOperationKind>(
	Object.values(ACCOUNT_SYNC_OPERATION_KIND_MAP)
);

interface IAccountSyncOperationLease {
	expiresAt: number;
	kind: TAccountSyncOperationKind;
	operationId: string;
	ownerTabId: string;
	renewedAt: number;
	startedAt: number;
}

export interface IAccountSyncOperationLeaseContext {
	checkCurrent: () => boolean;
	signal: AbortSignal;
}

export const ACCOUNT_SYNC_OPERATION_TTL = 15 * 1000;
const OPERATION_HEARTBEAT = 5 * 1000;
const MAX_OPERATION_ID_LENGTH = 256;
const remoteOperationLeases = new Map<
	string,
	Pick<IAccountSyncOperationLease, 'expiresAt' | 'operationId'>
>();
const operationOwnerTabId = createAccountClientId();
const localOperationIds = new Map<string, string>();
const localOperationInvalidators = new Map<string, () => void>();

function createOperationKey(userId: string) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.syncOperation,
		userId
	);
}

/** Only call after the server has permanently deleted this account. */
export function removeAccountSyncOperationForAccountDeletion(userId: string) {
	localOperationInvalidators.get(userId)?.();
	localOperationInvalidators.delete(userId);
	localOperationIds.delete(userId);
	remoteOperationLeases.delete(userId);
	removeAccountStorage(createOperationKey(userId));
}

function checkOperationLease(
	value: unknown
): value is IAccountSyncOperationLease {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		ACCOUNT_SYNC_OPERATION_KIND_SET.has(
			(value as IAccountSyncOperationLease).kind
		) &&
		typeof (value as IAccountSyncOperationLease).operationId === 'string' &&
		(value as IAccountSyncOperationLease).operationId !== '' &&
		(value as IAccountSyncOperationLease).operationId.length <=
			MAX_OPERATION_ID_LENGTH &&
		typeof (value as IAccountSyncOperationLease).ownerTabId === 'string' &&
		(value as IAccountSyncOperationLease).ownerTabId !== '' &&
		typeof (value as IAccountSyncOperationLease).expiresAt === 'number' &&
		Number.isFinite((value as IAccountSyncOperationLease).expiresAt) &&
		(value as IAccountSyncOperationLease).expiresAt >= 0 &&
		typeof (value as IAccountSyncOperationLease).renewedAt === 'number' &&
		Number.isFinite((value as IAccountSyncOperationLease).renewedAt) &&
		(value as IAccountSyncOperationLease).renewedAt >= 0 &&
		typeof (value as IAccountSyncOperationLease).startedAt === 'number' &&
		Number.isFinite((value as IAccountSyncOperationLease).startedAt) &&
		(value as IAccountSyncOperationLease).startedAt >= 0
	);
}

function readOperationLeaseRaw(key: string) {
	const raw = readAccountStorage(key);
	if (raw === null) {
		return { lease: null, raw };
	}

	try {
		const lease: unknown = JSON.parse(raw);
		return { lease, raw };
	} catch {
		return { lease: null, raw };
	}
}

/**
 * Storage has no compare-and-delete primitive. Only call this while holding the
 * operation lock; the raw-value guard then rejects a stale snapshot as well.
 */
function removeOperationLeaseIfCurrent(key: string, expectedRaw: string) {
	if (readAccountStorage(key) !== expectedRaw) {
		return false;
	}

	removeAccountStorage(key);
	return readAccountStorage(key) === null;
}

export function applyAccountSyncOperationLeaseSignal({
	expiresAt,
	operationId,
	status,
	userId,
}: {
	expiresAt: number;
	operationId: string;
	status: 'ended' | 'renewed' | 'started';
	userId: string;
}) {
	if (
		userId === '' ||
		operationId === '' ||
		operationId.length > MAX_OPERATION_ID_LENGTH ||
		!Number.isSafeInteger(expiresAt) ||
		expiresAt < 0
	) {
		return false;
	}

	const current = remoteOperationLeases.get(userId);

	if (status === 'ended') {
		if (current?.operationId !== operationId) {
			return false;
		}
		remoteOperationLeases.delete(userId);
		return true;
	}
	if (expiresAt <= Date.now()) {
		return false;
	}
	if (
		current !== undefined &&
		current.expiresAt > Date.now() &&
		current.operationId !== operationId
	) {
		return false;
	}

	remoteOperationLeases.set(userId, { expiresAt, operationId });

	return true;
}

export function checkAccountSyncOperationActive(userId: string) {
	const key = createOperationKey(userId);
	const { lease } = readOperationLeaseRaw(key);
	if (checkOperationLease(lease) && lease.expiresAt > Date.now()) {
		return true;
	}

	const remoteLease = remoteOperationLeases.get(userId);
	if (remoteLease !== undefined && remoteLease.expiresAt <= Date.now()) {
		remoteOperationLeases.delete(userId);
		return false;
	}

	return remoteLease !== undefined;
}

export function checkAccountSyncOperationOwnedByCurrentTab(userId: string) {
	const operationId = localOperationIds.get(userId);
	if (operationId === undefined) {
		return false;
	}
	const lease = readAccountJsonStorage<unknown>(
		createOperationKey(userId),
		null
	);
	return (
		checkOperationLease(lease) &&
		lease.operationId === operationId &&
		lease.ownerTabId === operationOwnerTabId &&
		lease.expiresAt > Date.now()
	);
}

export function withAccountSyncOperationLease<T>(
	userId: string,
	kind: TAccountSyncOperationKind,
	callback: (
		operationId: string,
		context: IAccountSyncOperationLeaseContext
	) => Promise<T>
) {
	return withCrossTabLock(
		`account-sync-operation:${userId}`,
		async () => {
			if (checkAccountSyncOperationActive(userId)) {
				return null;
			}

			const key = createOperationKey(userId);
			const inactiveLease = readOperationLeaseRaw(key);

			if (
				checkOperationLease(inactiveLease.lease) &&
				inactiveLease.lease.expiresAt > Date.now()
			) {
				return null;
			}
			if (
				inactiveLease.raw !== null &&
				!removeOperationLeaseIfCurrent(key, inactiveLease.raw)
			) {
				return null;
			}

			const operationId = createAccountClientId();
			const startedAt = Date.now();

			const publish = (
				lease: IAccountSyncOperationLease,
				status: 'ended' | 'renewed' | 'started'
			) => {
				const user = store.shared.user.get();
				if (user?.id === userId) {
					void postAccountSyncBroadcastMessage({
						namespaces: [],
						operationId,
						state_epoch: user.state_epoch,
						syncOperation: {
							expiresAt: lease.expiresAt,
							kind,
							ownerTabId: operationOwnerTabId,
							startedAt,
							status,
						},
						tabId: 'operation',
						type: 'lease-changed',
						userId,
					});
				}
			};

			const abortController = new AbortController();
			let heartbeat: ReturnType<typeof setInterval> | null = null;
			let currentLease: IAccountSyncOperationLease | null = null;
			let currentLeaseRaw: string | null = null;
			let invalidated = false;

			const invalidate = () => {
				if (invalidated) {
					return;
				}
				invalidated = true;
				if (localOperationIds.get(userId) === operationId) {
					localOperationIds.delete(userId);
				}
				if (heartbeat !== null) {
					clearInterval(heartbeat);
					heartbeat = null;
				}
				abortController.abort();
			};
			localOperationInvalidators.set(userId, invalidate);

			const checkCurrent = () => {
				if (
					invalidated ||
					localOperationIds.get(userId) !== operationId ||
					currentLease === null ||
					currentLeaseRaw === null ||
					currentLease.operationId !== operationId ||
					currentLease.ownerTabId !== operationOwnerTabId ||
					currentLease.expiresAt <= Date.now() ||
					readAccountStorage(key) !== currentLeaseRaw
				) {
					invalidate();
					return false;
				}

				return true;
			};

			const renew = (status: 'renewed' | 'started') => {
				if (status === 'renewed' && !checkCurrent()) {
					return null;
				}
				const expectedRaw = currentLeaseRaw;
				if (readAccountStorage(key) !== expectedRaw) {
					invalidate();
					return null;
				}
				const now = Date.now();
				const lease = {
					expiresAt: now + ACCOUNT_SYNC_OPERATION_TTL,
					kind,
					operationId,
					ownerTabId: operationOwnerTabId,
					renewedAt: now,
					startedAt,
				} satisfies IAccountSyncOperationLease;
				const leaseRaw = JSON.stringify(lease);
				writeAccountStorage(key, leaseRaw);
				if (readAccountStorage(key) !== leaseRaw) {
					invalidate();
					return null;
				}
				publish(lease, status);
				return { lease, leaseRaw };
			};

			localOperationIds.set(userId, operationId);
			let initialLease: ReturnType<typeof renew>;
			try {
				initialLease = renew('started');
			} catch (error) {
				invalidate();
				throw error;
			}
			if (initialLease === null) {
				if (localOperationInvalidators.get(userId) === invalidate) {
					localOperationInvalidators.delete(userId);
				}
				return null;
			}
			currentLease = initialLease.lease;
			currentLeaseRaw = initialLease.leaseRaw;
			heartbeat = setInterval(() => {
				try {
					const renewedLease = renew('renewed');
					if (renewedLease !== null) {
						currentLease = renewedLease.lease;
						currentLeaseRaw = renewedLease.leaseRaw;
					}
				} catch {
					invalidate();
				}
			}, OPERATION_HEARTBEAT);

			try {
				return await withAccountSyncPaused(() =>
					callback(operationId, {
						checkCurrent,
						signal: abortController.signal,
					})
				);
			} finally {
				clearInterval(heartbeat);
				heartbeat = null;
				const releasedLease = currentLease;
				const releasedLeaseRaw = currentLeaseRaw;
				const released = checkCurrent();
				let releasedSuccessfully = false;
				if (
					released &&
					removeOperationLeaseIfCurrent(key, releasedLeaseRaw)
				) {
					publish(releasedLease, 'ended');
					releasedSuccessfully = true;
				}
				if (
					releasedSuccessfully &&
					localOperationIds.get(userId) === operationId
				) {
					localOperationIds.delete(userId);
				} else {
					invalidate();
				}
				if (localOperationInvalidators.get(userId) === invalidate) {
					localOperationInvalidators.delete(userId);
				}
			}
		},
		{ fallbackTtl: ACCOUNT_SYNC_OPERATION_TTL, ifAvailable: true }
	);
}
