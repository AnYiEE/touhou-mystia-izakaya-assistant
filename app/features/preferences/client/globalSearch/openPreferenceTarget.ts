import { openPreferencesModal } from '@/features/preferences/client/overlayCommands';
import type { TPreferenceTargetKey } from '@/features/preferences/contracts';

import { PREFERENCE_SEARCH_ITEMS } from './searchItems';

function checkIsPreferenceTargetKey(
	targetKey: string
): targetKey is TPreferenceTargetKey {
	return PREFERENCE_SEARCH_ITEMS.some(({ key }) => key === targetKey);
}

export function openPreferenceTarget(targetKey: string) {
	if (!checkIsPreferenceTargetKey(targetKey)) {
		return false;
	}

	openPreferencesModal({ openSource: 'spotlight', targetKey });
	return true;
}
