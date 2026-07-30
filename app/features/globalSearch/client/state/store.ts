import { store } from '@davstack/store';

import type { IGlobalSearchTransientTarget } from '@/features/globalSearch/contracts';

const state = {
	customerRareTutorialAllowedPathname: null as string | null,
	isOpen: false,
	transientTarget: null as IGlobalSearchTransientTarget | null,
};

export const globalSearchStore = store(state);
