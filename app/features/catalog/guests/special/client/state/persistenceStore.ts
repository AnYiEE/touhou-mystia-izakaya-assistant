import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';
import {
	normalizeSpecialGuestRemotePartial,
	specialGuestPersistenceShape,
} from '@/features/catalog/guests/shared/state/guestPersistenceShape';
import { SPECIAL_GUEST_STORE_VERSION } from '@/features/catalog/guests/shared/state/guestStoreVersions';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { createSpecialGuestComputedState } from './createComputedState';
import { createSpecialGuestStoreActions } from './createStoreActions';
import {
	specialGuestFoodCatalog,
	specialGuestInitialState,
} from './initialState';
import { migrateSpecialGuestPersistedState } from './migratePersistedState';
import { wireSpecialGuestStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_rare-storage';

export const specialGuestPersistenceStore = store(specialGuestInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof specialGuestInitialState>({
			name: storeName,
			normalizeRemoteState(value) {
				const record = isObjectTagRecord(value) ? value : {};
				return {
					persistence: normalizeSpecialGuestRemotePartial(
						record['persistence']
					),
				};
			},
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: SPECIAL_GUEST_STORE_VERSION.recordIdentity,
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
			normalize: specialGuestPersistenceShape.normalize,
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
