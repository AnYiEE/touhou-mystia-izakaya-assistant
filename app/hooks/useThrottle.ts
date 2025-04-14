import {useEffect, useRef, useState} from 'react';

export function useThrottle<T>(value: T, limit = 1000) {
	const [throttledValue, setThrottledValue] = useState(value);
	const lastRan = useRef(0);
	const initialRun = useRef(0);

	useEffect(() => {
		if (initialRun.current < 1) {
			initialRun.current++;
			return;
		}
		if (initialRun.current === 1) {
			setThrottledValue(value);
			lastRan.current = Date.now();
			initialRun.current++;
			return;
		}

		const handler = setTimeout(
			() => {
				if (Date.now() - lastRan.current >= limit) {
					setThrottledValue(value);
					lastRan.current = Date.now();
				}
			},
			limit - (Date.now() - lastRan.current)
		);

		return () => {
			clearTimeout(handler);
		};
	}, [value, limit]);

	return throttledValue;
}
