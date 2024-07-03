import {createStoreContext, store} from '@davstack/store';
import {createJSONStorage} from 'zustand/middleware';

import {type TIngredientTag, type TRecipeTag} from '@/data/types';

const storeVersion = {
	initial: 0,
} as const;

const state = {
	persistence: {
		popular: {
			isNegative: false,
			tag: null as TIngredientTag | TRecipeTag | null,
		},
	},
};

const globalStore = store(state, {
	persist: {
		enabled: true,
		name: 'global-storage',
		version: storeVersion.initial,

		partialize(currentStore) {
			return {
				persistence: currentStore.persistence,
			} as typeof currentStore;
		},
		storage: createJSONStorage(() => localStorage),
	},
});

export const {Provider: GlobalStoreProvider, useStore: useGlobalStore} = createStoreContext(globalStore);
