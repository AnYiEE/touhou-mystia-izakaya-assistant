import {globalStore} from '@/stores';
import {useCallback} from 'react';

export function useVibrate(pattern = 10) {
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

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
