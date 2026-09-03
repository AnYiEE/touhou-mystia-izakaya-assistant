import { store } from '@davstack/store';

import { accountRemoteStateApplicationGuard } from '@/features/account/client/sync/stateGuards';
import {
	normalGuestPersistenceShape,
	normalizeNormalGuestRemotePartial,
} from '@/features/catalog/guests/shared/state/guestPersistenceShape';
import { NORMAL_GUEST_STORE_VERSION } from '@/features/catalog/guests/shared/state/guestStoreVersions';

import { createStoreSyncMiddleware } from '@/infrastructure/browser/crossTab/createStoreSyncMiddleware';
import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

import { isObjectTagRecord } from '@/shared/utilities/objects/isObjectTagRecord';

import { createNormalGuestComputedState } from './createComputedState';
import { createNormalGuestStoreActions } from './createStoreActions';
import { normalGuestInitialState } from './initialState';
import { migrateNormalGuestPersistedState } from './migratePersistedState';
import { wireNormalGuestStoreSubscriptions } from './wireStoreSubscriptions';

import '@/infrastructure/state/enableImmerMapSet';

const storeName = 'page-customer_normal-storage';

export const normalGuestStore = store(normalGuestInitialState, {
	middlewares: [
		createStoreSyncMiddleware<typeof normalGuestInitialState>({
			name: storeName,
			normalizeRemoteState(value) {
				const record = isObjectTagRecord(value) ? value : {};
				return {
					persistence: normalizeNormalGuestRemotePartial(
						record['persistence']
					),
				};
			},
			remoteStateApplicationGuard: accountRemoteStateApplicationGuard,
			storeVersion: NORMAL_GUEST_STORE_VERSION.recordIdentity,
			watch: ['persistence.meals'],
		}),
		createPersistMiddleware<typeof normalGuestInitialState>({
			migrate: migrateNormalGuestPersistedState,
			name: storeName,
			normalize: normalGuestPersistenceShape.normalize,
			partialize(currentStore) {
				return {
					persistence: currentStore.persistence,
				} as typeof currentStore;
			},
			version: NORMAL_GUEST_STORE_VERSION.recordIdentity,
		}),
	],
})
	.computed(createNormalGuestComputedState)
	.actions(createNormalGuestStoreActions);

wireNormalGuestStoreSubscriptions(normalGuestStore);
