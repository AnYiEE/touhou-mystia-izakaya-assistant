/**
 * @example removeLastElement([1, 2, 3, 4, 2], 2) -> [1, 2, 3, 4]
 */
export function removeLastElement<T>(
	array: ReadonlyArray<T>,
	elementToRemove: T,
	elementToInsert?: T
) {
	const index = array.lastIndexOf(elementToRemove);
	if (index === -1) {
		return array.toSpliced(0, 0);
	}

	if (elementToInsert === undefined) {
		return array.toSpliced(index, 1);
	}

	// Preserve the copying operation for the readonly input.
	// eslint-disable-next-line unicorn/no-confusing-array-splice -- Direct assignment would mutate the input.
	return array.toSpliced(index, 1, elementToInsert);
}
