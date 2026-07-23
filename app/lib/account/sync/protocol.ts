export function parseClientSyncGeneration(value: unknown) {
	if (
		value === null ||
		typeof value !== 'object' ||
		Array.isArray(value) ||
		Object.prototype.toString.call(value) !== '[object Object]'
	) {
		return null;
	}

	const syncGenerationDescriptor = Object.getOwnPropertyDescriptor(
		value,
		'sync_generation'
	);
	if (syncGenerationDescriptor === undefined) {
		return null;
	}

	const syncGeneration = syncGenerationDescriptor.value as unknown;
	if (
		typeof syncGeneration !== 'number' ||
		!Number.isSafeInteger(syncGeneration) ||
		syncGeneration < 0
	) {
		return null;
	}

	return syncGeneration;
}
