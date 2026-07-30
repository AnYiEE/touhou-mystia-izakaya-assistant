import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { createCustomerRareComputedState } from './createComputedState';
import { createCustomerRareStoreActions } from './createStoreActions';
import {
	customerRareInitialState,
	customerRareRecipeInstance,
} from './initialState';
import {
	CUSTOMER_RARE_STORE_VERSION,
	migrateCustomerRarePersistedState,
} from './migratePersistedState';
import { wireCustomerRareStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_rare-storage';

export const customerRarePersistenceStore = store(customerRareInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof customerRareInitialState>({
			name: storeName,
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			watch: [
				'persistence.customer.orderLinkedFilter',
				'persistence.customer.showTagDescription',
				'persistence.meals',
				'persistence.plans',
			],
		}),
		createPersistMiddleware<typeof customerRareInitialState>({
			migrate: migrateCustomerRarePersistedState,
			name: storeName,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
			version: CUSTOMER_RARE_STORE_VERSION.mealRecipeId,
		}),
	],
})
	.computed(createCustomerRareComputedState)
	.actions(createCustomerRareStoreActions);

wireCustomerRareStoreSubscriptions(
	customerRarePersistenceStore,
	customerRareRecipeInstance
);
