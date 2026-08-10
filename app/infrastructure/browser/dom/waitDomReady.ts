const READY_STATE: DocumentReadyState[] = ['complete', 'interactive'];

const readyStateSet = new Set(READY_STATE);

function checkReadyState() {
	return readyStateSet.has(document.readyState);
}

/**
 * @returns Promise that resolves when the DOM is ready.
 */
export function waitDomReady() {
	return new Promise<void>((resolve) => {
		if (checkReadyState()) {
			resolve();
			return;
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
