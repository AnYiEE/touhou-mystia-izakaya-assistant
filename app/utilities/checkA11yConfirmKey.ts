import {type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent} from 'react';

export type TPressEvent = ReactKeyboardEvent | ReactMouseEvent | KeyboardEvent | MouseEvent;

function checkEvent(event: TPressEvent) {
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

/**
 * @returns The warped callback that will only be called if the key pressed is either "Enter" or "Space".
 */
export function checkA11yConfirmKey<T extends TPressEvent>(callback?: (event: T) => void) {
	return (initEvent: T) => {
		if (checkEvent(initEvent)) {
			callback?.(initEvent);
		}
	};
}
