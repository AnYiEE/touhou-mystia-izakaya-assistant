export function removeLastElement<T>(array: T[], elementToRemove: T, elementToInsert?: T): T[] {
	const copiedArray = [...array];

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
