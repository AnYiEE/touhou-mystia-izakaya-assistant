import {type EffectCallback, useEffect, useRef, useState} from 'react';

import {globalStore as store} from '@/stores';

function useMounted(callback?: EffectCallback) {
	const isFired = useRef(false);
	const [isMounted, setIsMounted] = useState(false);
	const userId = store.persistence.userId.use();

	useEffect(() => {
		if (!isFired.current && userId !== null) {
			isFired.current = true;
			setIsMounted(true);
			return callback?.();
		}
	}, [callback, userId]);

	return isMounted;
}

export {useMounted};
