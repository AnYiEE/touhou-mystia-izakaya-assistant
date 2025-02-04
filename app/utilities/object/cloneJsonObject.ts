export function cloneJsonObject<T extends object>(jsonObject: T): T {
	// eslint-disable-next-line unicorn/prefer-structured-clone
	return JSON.parse(JSON.stringify(jsonObject)) as T;
}
