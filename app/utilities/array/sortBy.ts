import { checkLengthEmpty, copyArray, toSet } from '@/utilities';

export function sortBy<T>(arrayA: ReadonlyArray<T>, arrayB: ReadonlyArray<T>) {
	if (checkLengthEmpty(arrayA)) {
		return copyArray(arrayB);
	}
	if (checkLengthEmpty(arrayB)) {
		return [];
	}

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
