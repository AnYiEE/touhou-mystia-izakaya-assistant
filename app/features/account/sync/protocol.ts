import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

export const SYNC_PROTOCOL_VERSION = 1;

function getOwnDataPropertyValue(value: object, key: PropertyKey) {
	const descriptor = Object.getOwnPropertyDescriptor(value, key);
	return descriptor !== undefined && 'value' in descriptor
		? (descriptor.value as unknown)
		: undefined;
}

export function checkSyncProtocolRequestBody(value: unknown) {
	return (
		isObjectTagRecord(value) &&
		getOwnDataPropertyValue(value, 'protocol_version') ===
			SYNC_PROTOCOL_VERSION
	);
}

export function checkSyncProtocolSearchParams(searchParams: URLSearchParams) {
	const versions = searchParams.getAll('protocol_version');
	return versions.length === 1 && versions[0] === `${SYNC_PROTOCOL_VERSION}`;
}

export function createSyncProtocolRequestBody<TBody extends object>(
	body: TBody
): TBody & { protocol_version: typeof SYNC_PROTOCOL_VERSION } {
	return { ...body, protocol_version: SYNC_PROTOCOL_VERSION };
}

export function parseClientSyncGeneration(value: unknown) {
	if (!isObjectTagRecord(value)) {
		return null;
	}

	const syncGeneration = getOwnDataPropertyValue(value, 'sync_generation');
	if (
		typeof syncGeneration !== 'number' ||
		!Number.isSafeInteger(syncGeneration) ||
		syncGeneration < 0
	) {
		return null;
	}

	return syncGeneration;
}
