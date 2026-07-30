import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { createCustomerNormalComputedState } from './createComputedState';
import { createCustomerNormalStoreActions } from './createStoreActions';
import { customerNormalInitialState } from './initialState';
import {
	CUSTOMER_NORMAL_STORE_VERSION,
	migrateCustomerNormalPersistedState,
} from './migratePersistedState';
import { wireCustomerNormalStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_normal-storage';

export const customerNormalStore = store(customerNormalInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof customerNormalInitialState>({
			name: storeName,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			watch: ['persistence.meals'],
		}),
		createPersistMiddleware<typeof customerNormalInitialState>({
			name: storeName,
			version: CUSTOMER_NORMAL_STORE_VERSION.availabilityDlcFilter,

			migrate: migrateCustomerNormalPersistedState,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
		}),
	],
})
	.computed(createCustomerNormalComputedState)
	.actions(createCustomerNormalStoreActions);

wireCustomerNormalStoreSubscriptions(customerNormalStore);
