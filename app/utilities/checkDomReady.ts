import { toSet } from '@/utilities';

const READY_STATE: DocumentReadyState[] = ['complete', 'interactive'];

const readyStateSet = toSet(READY_STATE);

function checkReadyState() {
	return readyStateSet.has(document.readyState);
}

/**
 * @returns Promise that resolves when the DOM is ready.
 */
export function checkDomReady() {
	return new Promise<void>((resolve) => {
		if (checkReadyState()) {
			resolve();
		}

		const EVENT_TYPE = 'readystatechange';

		const handleReadystatechange = () => {
			if (checkReadyState()) {
				document.removeEventListener(
					EVENT_TYPE,
					handleReadystatechange
				);
				resolve();
			}
		};

		document.addEventListener(EVENT_TYPE, handleReadystatechange);
	});
}
