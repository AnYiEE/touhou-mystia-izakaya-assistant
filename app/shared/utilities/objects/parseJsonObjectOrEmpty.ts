import { checkIsRecord } from './checkIsRecord';

export function parseJsonObjectOrEmpty(value: string): Record<string, unknown> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return {};
	}

	return checkIsRecord(parsed) ? parsed : {};
}
