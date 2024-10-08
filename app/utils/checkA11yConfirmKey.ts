import {type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent} from 'react';

/**
 * @returns The pressed key is Enter or Space.
 */
export function checkA11yConfirmKey(event: ReactKeyboardEvent | ReactMouseEvent | KeyboardEvent | MouseEvent) {
	const {type} = event;

	if (type === 'click') {
		return true;
	}

	if (type === 'keydown') {
		const {key} = event as KeyboardEvent;
		const isEnter = key === 'Enter';
		const isSpace = key === ' ';

		if (isSpace) {
			event.preventDefault();
		}

		return isEnter || isSpace;
	}

	return false;
}
