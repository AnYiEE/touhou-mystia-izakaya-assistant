import { copyArray } from '@/utilities';

/**
 * @example removeLastElement([1, 2, 3, 4, 2], 2) -> [1, 2, 3, 4]
 */
export function removeLastElement<T>(
	array: ReadonlyArray<T>,
	elementToRemove: T,
	elementToInsert?: T
) {
	const copiedArray = copyArray(array);

	const index = array.lastIndexOf(elementToRemove);
	if (index === -1) {
		return copiedArray;
	}

	copiedArray.splice(index, 1);

	if (elementToInsert !== undefined) {
		copiedArray.splice(index, 0, elementToInsert);
	}

	return copiedArray;
}
