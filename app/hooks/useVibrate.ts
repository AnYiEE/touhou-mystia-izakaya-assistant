import {useCallback} from 'react';

import {globalStore as store} from '@/stores';

export function useVibrate(pattern = 10) {
	const isVibrateEnabled = store.persistence.vibrate.use();

	const vibrate = useCallback(() => {
		if (!isVibrateEnabled) {
			return;
		}

		try {
			// eslint-disable-next-line compat/compat
			navigator.vibrate(pattern);
		} catch {
			/* empty */
		}
	}, [isVibrateEnabled, pattern]);

	return vibrate;
}
