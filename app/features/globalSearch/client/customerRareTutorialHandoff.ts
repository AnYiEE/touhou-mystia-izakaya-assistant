'use client';

import { globalSearchStore } from './state/store';

export function useCustomerRareTutorialAllowedPathname() {
	return globalSearchStore.customerRareTutorialAllowedPathname.use();
}

export function setCustomerRareTutorialAllowedPathname(
	pathname: string | null
) {
	globalSearchStore.customerRareTutorialAllowedPathname.set(pathname);
}

export function consumeCustomerRareTutorialAllowedPathname() {
	globalSearchStore.customerRareTutorialAllowedPathname.set(null);
}
