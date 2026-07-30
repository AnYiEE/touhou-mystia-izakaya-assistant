/* eslint-disable @typescript-eslint/no-deprecated */

/**
 * @description Add event listeners for media query list to be compatible with Safari < 14,
 * @returns A function to remove the event listener.
 */
export function addSafeMediaQueryEventListener(
	mediaQueryList: MediaQueryList,
	listener: (event: MediaQueryListEvent) => void
) {
	const isSupported = typeof mediaQueryList.addEventListener === 'function';

	if (isSupported) {
		const EVENT_TYPE = 'change';

		mediaQueryList.addEventListener(EVENT_TYPE, listener);

		return () => {
			mediaQueryList.removeEventListener(EVENT_TYPE, listener);
		};
	}

	mediaQueryList.addListener(listener);

	return () => {
		mediaQueryList.removeListener(listener);
	};
}
