import {
	ACCOUNT_STORAGE_KEY_MAP,
	createAccountStorageKey,
	readAccountStorage,
	writeAccountJsonStorage,
} from './storage';
import { withCrossTabLock } from '@/utilities/crossTabLock';

/**
 * Durable reset protocol invariants:
 * - `prepared` is an incomplete, recoverable transaction and blocks ordinary sync writes/uploads.
 * - `committed` is a permanent epoch high-water mark; it is never removed by normal reset cleanup.
 * - `deleted` is an account-deletion tombstone; it rejects every sync write unless an authenticated
 *   response for the same user proves that the server epoch has advanced after account restoration.
 * - reset-owned writes must present the exact prepared operation id; ordinary writes must observe an
 *   unchanged committed generation before and after their storage mutation.
 * - a future or malformed marker is isolated, never guessed, expired, or deleted.
 */
export interface IAccountSyncResetGeneration {
	createdAt: number;
	deleteStartedAt: number | null;
	operationId: string;
	phase: 'committed' | 'deleted' | 'prepared';
	restoredFromStateEpoch?: number;
	state_epoch: number;
	userId: string;
	version: 1;
}

export type TAccountSyncResetGenerationRead =
	| { marker: IAccountSyncResetGeneration; raw: string; status: 'current' }
	| { raw: string; status: 'invalid' | 'future' }
	| { status: 'none' };

const MAX_MARKER_STRING_LENGTH = 256;

export function createAccountSyncResetGenerationKey(userId: string) {
	return createAccountStorageKey(
		ACCOUNT_STORAGE_KEY_MAP.resetGeneration,
		userId
	);
}

export function readAccountSyncResetGeneration(
	userId: string
): TAccountSyncResetGenerationRead {
	const raw = readAccountStorage(createAccountSyncResetGenerationKey(userId));
	if (raw === null) {
		return { status: 'none' };
	}
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return { raw, status: 'invalid' };
	}
	if (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Number.isSafeInteger((value as { version?: unknown }).version) &&
		(value as { version: number }).version > 1
	) {
		return { raw, status: 'future' };
	}
	const marker = value as Partial<IAccountSyncResetGeneration>;
	if (
		marker.version !== 1 ||
		marker.userId !== userId ||
		(marker.phase !== 'prepared' &&
			marker.phase !== 'committed' &&
			marker.phase !== 'deleted') ||
		typeof marker.operationId !== 'string' ||
		marker.operationId.length === 0 ||
		marker.operationId.length > MAX_MARKER_STRING_LENGTH ||
		!Number.isSafeInteger(marker.createdAt) ||
		Number(marker.createdAt) < 0 ||
		!Number.isSafeInteger(marker.state_epoch) ||
		Number(marker.state_epoch) < 0 ||
		(marker.restoredFromStateEpoch !== undefined &&
			(!Number.isSafeInteger(marker.restoredFromStateEpoch) ||
				marker.restoredFromStateEpoch < 0 ||
				marker.restoredFromStateEpoch >= Number(marker.state_epoch) ||
				marker.phase === 'deleted')) ||
		(marker.deleteStartedAt !== null &&
			(!Number.isSafeInteger(marker.deleteStartedAt) ||
				Number(marker.deleteStartedAt) < 0))
	) {
		return { raw, status: 'invalid' };
	}
	return {
		marker: marker as IAccountSyncResetGeneration,
		raw,
		status: 'current',
	};
}

export function checkAccountSyncResetPrepared(userId: string) {
	const result = readAccountSyncResetGeneration(userId);
	return result.status === 'current' && result.marker.phase === 'prepared';
}

export function captureAccountSyncResetGeneration(userId: string) {
	const result = readAccountSyncResetGeneration(userId);
	return result.status === 'none' ? null : result.raw;
}

export function getAccountSyncResetGenerationId(userId: string) {
	const result = readAccountSyncResetGeneration(userId);
	return result.status === 'current'
		? `v1:${result.marker.state_epoch}:${result.marker.operationId}`
		: null;
}

export function getAccountSyncResetGenerationIdFromToken(
	generationToken: string | null
) {
	if (generationToken === null) {
		return null;
	}
	try {
		const value = JSON.parse(
			generationToken
		) as Partial<IAccountSyncResetGeneration>;
		return value.version === 1 &&
			typeof value.operationId === 'string' &&
			Number.isSafeInteger(value.state_epoch)
			? `v1:${value.state_epoch}:${value.operationId}`
			: null;
	} catch {
		return null;
	}
}

export function checkAccountSyncResetWriteAllowed({
	expectedGeneration,
	resetOperationId,
	userId,
}: {
	expectedGeneration: string | null;
	resetOperationId?: string;
	userId: string;
}) {
	const current = readAccountSyncResetGeneration(userId);
	if (
		current.status === 'current' &&
		current.marker.phase === 'prepared' &&
		current.marker.operationId === resetOperationId &&
		current.raw === expectedGeneration
	) {
		return true;
	}
	if (current.status === 'invalid' || current.status === 'future') {
		return false;
	}
	if (current.status === 'none') {
		return expectedGeneration === null;
	}
	if (!('marker' in current)) {
		return false;
	}
	return (
		current.raw === expectedGeneration &&
		current.marker.phase === 'committed'
	);
}

function writeMarkerIfCurrent(
	userId: string,
	expectedRaw: string | null,
	marker: IAccountSyncResetGeneration
) {
	if (
		readAccountStorage(createAccountSyncResetGenerationKey(userId)) !==
		expectedRaw
	) {
		return false;
	}
	writeAccountJsonStorage(
		createAccountSyncResetGenerationKey(userId),
		marker
	);
	const current = readAccountSyncResetGeneration(userId);
	return (
		current.status === 'current' &&
		JSON.stringify(current.marker) === JSON.stringify(marker)
	);
}

export function prepareAccountSyncResetGeneration({
	accountRestorationStateEpoch,
	deleteStartedAt,
	operationId,
	stateEpoch,
	userId,
}: {
	accountRestorationStateEpoch?: number;
	deleteStartedAt?: number;
	operationId: string;
	stateEpoch: number;
	userId: string;
}) {
	const current = readAccountSyncResetGeneration(userId);
	if (current.status === 'invalid' || current.status === 'future') {
		return null;
	}
	if (
		current.status === 'current' &&
		current.marker.phase === 'deleted' &&
		(accountRestorationStateEpoch !== stateEpoch ||
			stateEpoch <= current.marker.state_epoch)
	) {
		return null;
	}
	if (current.status === 'current') {
		if (
			current.marker.state_epoch > stateEpoch ||
			(current.marker.state_epoch === stateEpoch &&
				current.marker.phase === 'committed')
		) {
			return current.marker;
		}
		if (
			current.marker.state_epoch === stateEpoch &&
			current.marker.operationId !== operationId
		) {
			return null;
		}
	}
	const restoredFromStateEpoch =
		current.status === 'current' && current.marker.phase === 'deleted'
			? current.marker.state_epoch
			: current.status === 'current' &&
				  current.marker.phase === 'prepared'
				? current.marker.restoredFromStateEpoch
				: undefined;
	const marker = {
		createdAt: Date.now(),
		deleteStartedAt: deleteStartedAt ?? null,
		operationId,
		phase: 'prepared' as const,
		...(restoredFromStateEpoch === undefined
			? {}
			: { restoredFromStateEpoch }),
		state_epoch: stateEpoch,
		userId,
		version: 1 as const,
	};
	return writeMarkerIfCurrent(
		userId,
		current.status === 'none' ? null : current.raw,
		marker
	)
		? marker
		: null;
}

/** Only call after the server has permanently deleted this account. */
export function markAccountSyncResetGenerationDeleted({
	operationId,
	stateEpoch,
	userId,
}: {
	operationId: string;
	stateEpoch: number;
	userId: string;
}) {
	const current = readAccountSyncResetGeneration(userId);
	if (
		current.status === 'current' &&
		current.marker.phase === 'deleted' &&
		current.marker.state_epoch >= stateEpoch
	) {
		return current.marker;
	}
	const marker = {
		createdAt: Date.now(),
		deleteStartedAt: null,
		operationId,
		phase: 'deleted' as const,
		state_epoch: stateEpoch,
		userId,
		version: 1 as const,
	};
	return writeMarkerIfCurrent(
		userId,
		current.status === 'none' ? null : current.raw,
		marker
	)
		? marker
		: null;
}

export function commitAccountSyncResetGeneration({
	expectedRaw,
	marker,
}: {
	expectedRaw: string;
	marker: IAccountSyncResetGeneration;
}) {
	const current = readAccountSyncResetGeneration(marker.userId);
	if (
		current.status !== 'current' ||
		current.raw !== expectedRaw ||
		current.marker.phase !== 'prepared' ||
		current.marker.operationId !== marker.operationId ||
		current.marker.state_epoch !== marker.state_epoch
	) {
		return false;
	}
	const committedMarker = { ...current.marker, phase: 'committed' as const };
	if (!writeMarkerIfCurrent(marker.userId, current.raw, committedMarker)) {
		return false;
	}
	const committed = readAccountSyncResetGeneration(marker.userId);
	return committed.status === 'current' &&
		committed.marker.phase === 'committed' &&
		committed.marker.operationId === marker.operationId &&
		committed.marker.state_epoch === marker.state_epoch
		? committed.raw
		: false;
}

export function withAccountSyncResetGenerationLock<T>(
	userId: string,
	callback: () => Promise<T> | T,
	options: { ifAvailable?: boolean } = {}
) {
	return withCrossTabLock(`account-sync-reset:${userId}`, callback, {
		fallbackTtl: 15 * 1000,
		ifAvailable: options.ifAvailable ?? true,
	});
}
