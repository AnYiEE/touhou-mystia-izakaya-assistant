import {type KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent} from 'react';

export function checkA11yConfirmKey(event: ReactKeyboardEvent | ReactMouseEvent | KeyboardEvent | MouseEvent) {
	const {type} = event;

	if (type === 'click' || type === 'keydown') {
		if (type === 'keydown') {
			return (event as KeyboardEvent).key === 'Enter' || (event as KeyboardEvent).key === ' ';
		}

		return true;
	}

	return false;
}
