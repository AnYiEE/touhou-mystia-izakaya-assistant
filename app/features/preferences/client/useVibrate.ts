import { useCallback } from 'react';

import { globalStore } from './state/globalPersistenceStore';

export function useVibrate(pattern = 10) {
	const isVibrateEnabled = globalStore.persistence.vibrate.use();

	const vibrate = useCallback(
		(shouldVibrate = true) => {
			if (!isVibrateEnabled || !shouldVibrate) {
				return;
			}

			try {
				// eslint-disable-next-line compat/compat
				navigator.vibrate(pattern);
			} catch {
				/* empty */
			}
		},
		[isVibrateEnabled, pattern]
	);

	return vibrate;
}
