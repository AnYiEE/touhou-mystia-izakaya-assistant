import { toSet } from '@/utilities';

export function sortBy<T>(arrayA: T[], arrayB: T[]) {
	const setA = toSet(arrayA);

	const inA: T[] = [];
	const notInA: T[] = [];

	arrayB.forEach((item) => {
		if (setA.has(item)) {
			inA.push(item);
		} else {
			notInA.push(item);
		}
	});

	const orderMap = new Map<T, number>();

	arrayA.forEach((item, index) => {
		orderMap.set(item, index);
	});

	inA.sort((a, b) => {
		const indexA = orderMap.get(a) ?? 0;
		const indexB = orderMap.get(b) ?? 0;

		return indexA - indexB;
	});

	return [...inA, ...notInA];
}
