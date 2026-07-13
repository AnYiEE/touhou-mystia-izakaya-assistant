import { type EffectCallback, useEffect, useRef, useState } from 'react';

import { globalStore as store } from '@/stores';

function useMounted(callback?: EffectCallback) {
	const [isMounted, setIsMounted] = useState(false);
	const userId = store.persistence.userId.use();
	const isReady = userId !== null;

	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (isReady) {
			setIsMounted(true);
			return callbackRef.current?.();
		}
	}, [isReady]);

	return isMounted;
}

export { useMounted };
