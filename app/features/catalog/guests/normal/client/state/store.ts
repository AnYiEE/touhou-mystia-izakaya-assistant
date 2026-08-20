import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { createNormalGuestComputedState } from './createComputedState';
import { createNormalGuestStoreActions } from './createStoreActions';
import { normalGuestInitialState } from './initialState';
import {
	NORMAL_GUEST_STORE_VERSION,
	migrateNormalGuestPersistedState,
} from './migratePersistedState';
import { wireNormalGuestStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_normal-storage';

export const normalGuestStore = store(normalGuestInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof normalGuestInitialState>({
			name: storeName,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: NORMAL_GUEST_STORE_VERSION.recordIdentity,
			watch: ['persistence.meals'],
		}),
		createPersistMiddleware<typeof normalGuestInitialState>({
			name: storeName,
			version: NORMAL_GUEST_STORE_VERSION.recordIdentity,

			migrate: migrateNormalGuestPersistedState,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
		}),
	],
})
	.computed(createNormalGuestComputedState)
	.actions(createNormalGuestStoreActions);

wireNormalGuestStoreSubscriptions(normalGuestStore);
