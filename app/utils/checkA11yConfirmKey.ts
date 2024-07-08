import {type KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent} from 'react';
export function checkA11yConfirmKey(event: ReactKeyboardEvent | ReactMouseEvent | KeyboardEvent | MouseEvent) {
	if (['click', 'keydown'].includes(event.type)) {
		if (event.type === 'keydown') {
			return ['Enter', ' '].includes((event as KeyboardEvent).key);
		}
		return true;
	}
	return false;
}
