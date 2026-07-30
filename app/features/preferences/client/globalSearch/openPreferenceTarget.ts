import { openPreferencesModal } from '@/features/preferences/client/overlayCommands';

import {
	PREFERENCE_SEARCH_ITEMS,
	type TPreferenceTargetKey,
} from './searchItems';

function checkIsPreferenceTargetKey(
	targetId: string
): targetId is TPreferenceTargetKey {
	return PREFERENCE_SEARCH_ITEMS.some(({ key }) => key === targetId);
}

export function openPreferenceTarget(targetId: string) {
	if (!checkIsPreferenceTargetKey(targetId)) {
		return false;
	}

	openPreferencesModal({ openSource: 'spotlight', targetKey: targetId });
	return true;
}
