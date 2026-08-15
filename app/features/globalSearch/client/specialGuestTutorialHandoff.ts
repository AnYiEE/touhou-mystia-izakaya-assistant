'use client';

import { globalSearchStore } from './state/store';

export function useSpecialGuestTutorialAllowedPathname() {
	return globalSearchStore.specialGuestTutorialAllowedPathname.use();
}

export function setSpecialGuestTutorialAllowedPathname(
	pathname: string | null
) {
	globalSearchStore.specialGuestTutorialAllowedPathname.set(pathname);
}

export function consumeSpecialGuestTutorialAllowedPathname() {
	globalSearchStore.specialGuestTutorialAllowedPathname.set(null);
}
