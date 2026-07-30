import { isObject } from 'lodash';

export function isObjectTagRecord(
	value: unknown
): value is Record<string, unknown> {
	if (Array.isArray(value) || !isObject(value)) {
		return false;
	}

	return Object.prototype.toString.call(value) === '[object Object]';
}
