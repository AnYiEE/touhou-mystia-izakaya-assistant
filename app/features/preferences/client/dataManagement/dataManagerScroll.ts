export function getClosestModalScrollContainer(
	element: HTMLElement | null
): HTMLElement | null {
	const dialogElement = element?.closest('[role="dialog"]');

	if (element === null || dialogElement === null) {
		return null;
	}

	let currentElement = element.parentElement;

	while (currentElement !== null && currentElement !== dialogElement) {
		const { overflowY } = getComputedStyle(currentElement);

		if (
			['auto', 'overlay', 'scroll'].includes(overflowY) &&
			currentElement.scrollHeight > currentElement.clientHeight
		) {
			return currentElement;
		}

		currentElement = currentElement.parentElement;
	}

	return null;
}
