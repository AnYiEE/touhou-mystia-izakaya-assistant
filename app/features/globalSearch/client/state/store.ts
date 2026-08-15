import { store } from '@davstack/store';

import type { IGlobalSearchTransientTarget } from '@/features/globalSearch/contracts';

const state = {
	isOpen: false,
	specialGuestTutorialAllowedPathname: null as string | null,
	transientTarget: null as IGlobalSearchTransientTarget | null,
};

export const globalSearchStore = store(state);
