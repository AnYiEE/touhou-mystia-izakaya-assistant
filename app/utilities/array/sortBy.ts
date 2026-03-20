import { checkLengthEmpty, copyArray } from '@/utilities';

export function sortBy<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (checkLengthEmpty(arrayA)) {
		return copyArray(arrayB);
	}
	if (checkLengthEmpty(arrayB)) {
		return [];
	}

	const orderMap = new Map<T, number>();

	arrayA.forEach((item, index) => {
		orderMap.set(item, index);
	});

	const inA: T[] = [];
	const notInA: T[] = [];

	arrayB.forEach((item) => {
		if (orderMap.has(item)) {
			inA.push(item);
		} else {
			notInA.push(item);
		}
	});

	inA.sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));

	return [...inA, ...notInA];
}
