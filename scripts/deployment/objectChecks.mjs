/**
 * Match Lodash's `isObject` contract without adding a runtime dependency to
 * the self-hosted launcher graph.
 * @param {unknown} value
 * @returns {value is object | Function}
 */
export function isObject(value) {
	return (
		value !== null &&
		(typeof value === 'object' || typeof value === 'function')
	);
}
