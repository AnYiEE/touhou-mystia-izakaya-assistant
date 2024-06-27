export function getIntersection<T>(arrayA: T[], arrayB: T[]) {
	const setArrayB = new Set(arrayB);

	return arrayA.filter((item) => setArrayB.has(item));
}
