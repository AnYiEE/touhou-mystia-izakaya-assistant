import {type EffectCallback, useEffect, useState} from 'react';

function useMounted(callback?: EffectCallback) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		return callback?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return mounted;
}

export {useMounted};
