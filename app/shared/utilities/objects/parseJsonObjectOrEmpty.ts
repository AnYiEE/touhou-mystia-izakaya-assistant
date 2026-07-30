export function parseJsonObjectOrEmpty(value: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return {};
	}

	return parsed !== null &&
		typeof parsed === 'object' &&
		!Array.isArray(parsed)
		? (parsed as Record<string, unknown>)
		: {};
}
