// Server-side account sync capacity accounting.
import {
	SYNC_NAMESPACE_MAP,
	type TSyncNamespace,
} from '@/domain/account/contracts';

import {
	ACCOUNT_SYNC_REQUEST_MAX_BYTES,
	ACCOUNT_SYNC_STATE_TOTAL_MAX_BYTES,
} from '@/features/account/requestLimits';

interface ISerializedSyncStateEntry {
	data: string;
	namespace: string;
}

interface IAccountSyncCapacityTotals {
	candidateBytes: number;
	candidateNamespaceBytes: Record<string, number>;
	currentBytes: number;
	currentNamespaceBytes: Record<string, number>;
}

interface IAccountSyncCapacityErrorDetails {
	candidateBytes: number;
	currentBytes: number;
	limitBytes: number;
	namespaces: TSyncNamespace[];
}

export class AccountSyncCapacityExceededError extends Error {
	readonly details: IAccountSyncCapacityErrorDetails;

	constructor(details: IAccountSyncCapacityErrorDetails) {
		super('sync-account-capacity-exceeded');
		this.name = 'AccountSyncCapacityExceededError';
		this.details = details;
	}
}

function createEmptyNamespaceByteMap() {
	return Object.values(SYNC_NAMESPACE_MAP).reduce<Record<string, number>>(
		(result, namespace) => {
			result[namespace] = 0;
			return result;
		},
		{}
	);
}

function getUtf8ByteLength(value: string) {
	return Buffer.byteLength(value, 'utf8');
}

export function calculateAccountSyncCapacity({
	currentEntries,
	replacements,
}: {
	currentEntries: ReadonlyArray<ISerializedSyncStateEntry>;
	replacements: ReadonlyArray<ISerializedSyncStateEntry>;
}): IAccountSyncCapacityTotals {
	const currentNamespaceBytes = createEmptyNamespaceByteMap();
	currentEntries.forEach(({ data, namespace }) => {
		currentNamespaceBytes[namespace] = getUtf8ByteLength(data);
	});

	const candidateNamespaceBytes = { ...currentNamespaceBytes };
	replacements.forEach(({ data, namespace }) => {
		candidateNamespaceBytes[namespace] = getUtf8ByteLength(data);
	});

	return {
		candidateBytes: Math.sumPrecise(Object.values(candidateNamespaceBytes)),
		candidateNamespaceBytes,
		currentBytes: Math.sumPrecise(Object.values(currentNamespaceBytes)),
		currentNamespaceBytes,
	};
}

export function checkAccountSyncCapacityAllowed({
	candidateBytes,
	currentBytes,
	limitBytes,
}: {
	candidateBytes: number;
	currentBytes: number;
	limitBytes: number;
}) {
	return candidateBytes <= limitBytes || candidateBytes < currentBytes;
}

export function getAccountSyncCapacityConfiguration() {
	return {
		requestMaxBytes: ACCOUNT_SYNC_REQUEST_MAX_BYTES,
		stateTotalMaxBytes: ACCOUNT_SYNC_STATE_TOTAL_MAX_BYTES,
	};
}
