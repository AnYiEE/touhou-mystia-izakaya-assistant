export function removeLastElement<T>(array: T[], elementToRemove: T, elementToInsert?: T): T[] {
	const index = array.lastIndexOf(elementToRemove);
	if (index === -1) {
		return array;
	}

	const newArray = [...array];
	newArray.splice(index, 1);

	if (elementToInsert !== undefined) {
		newArray.splice(index, 0, elementToInsert);
	}

	return newArray;
}
