import { cn } from '@heroui/theme';

import { type TPreferenceTargetKey } from '@/features/preferences/client/globalSearch/searchItems';

export function getPreferenceTargetClassName(
	key: TPreferenceTargetKey,
	highlightedKey: null | TPreferenceTargetKey
) {
	return cn(
		'rounded-small transition-all motion-reduce:transition-none',
		highlightedKey === key &&
			'bg-primary/10 shadow-[0_0_0_1px] shadow-primary/40'
	);
}

export function getPreferenceTargetDataProps(key: TPreferenceTargetKey) {
	return { 'data-preference-key': key };
}
