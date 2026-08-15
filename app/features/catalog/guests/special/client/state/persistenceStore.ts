import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { createSpecialGuestComputedState } from './createComputedState';
import { createSpecialGuestStoreActions } from './createStoreActions';
import {
	specialGuestFoodCatalog,
	specialGuestInitialState,
} from './initialState';
import {
	SPECIAL_GUEST_STORE_VERSION,
	migrateSpecialGuestPersistedState,
} from './migratePersistedState';
import { wireSpecialGuestStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_rare-storage';

export const specialGuestPersistenceStore = store(specialGuestInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof specialGuestInitialState>({
			name: storeName,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			watch: [
				'persistence.guest.orderLinkedFilter',
				'persistence.guest.showTagDescription',
				'persistence.meals',
				'persistence.plans',
			],
		}),
		createPersistMiddleware<typeof specialGuestInitialState>({
			migrate: migrateSpecialGuestPersistedState,
			name: storeName,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
			version: SPECIAL_GUEST_STORE_VERSION.recordIdentity,
		}),
	],
})
	.computed(createSpecialGuestComputedState)
	.actions(createSpecialGuestStoreActions);

wireSpecialGuestStoreSubscriptions(
	specialGuestPersistenceStore,
	specialGuestFoodCatalog
);
