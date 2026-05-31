export function getLogSafeErrorCode(error: unknown) {
	try {
		const descriptor =
			error !== null && typeof error === 'object'
				? Object.getOwnPropertyDescriptor(error, 'code')
				: undefined;
		const code =
			descriptor === undefined || !('value' in descriptor)
				? null
				: (descriptor.value as unknown);

		return typeof code === 'string' && /^[A-Za-z0-9:._-]{1,64}$/u.test(code)
			? code
			: 'unknown';
	} catch {
		return 'unknown';
	}
}
