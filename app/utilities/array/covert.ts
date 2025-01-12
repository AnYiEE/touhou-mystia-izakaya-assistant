export function toArray<T>(...arrayOrSets: (ReadonlyArray<T> | ReadonlySet<T>)[]) {
	return arrayOrSets.flatMap((arrayOrSet) => [...arrayOrSet]);
}

export function toSet<T>(...arrays: ReadonlyArray<T>[]) {
	return new Set(arrays.flat());
}

export {toArray as copyArray};
