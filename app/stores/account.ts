import { store } from '@davstack/store';

import {
	type IAccountSyncMeta,
	type ISyncConflictItem,
} from '@/lib/account/sync';
import { type IAccountUserProfile } from '@/lib/account/shared/types';
import { persist as persistMiddleware } from '@/stores/middlewares';

export type TAccountBootstrapStatus =
	| 'anonymous'
	| 'disabled'
	| 'error'
	| 'loggedIn'
	| 'unknown';

export type TAccountSyncResult = 'failed' | 'idle' | 'partial' | 'success';

const storeVersion = { initial: 0 } as const;

const state = {
	persistence: {},
	shared: {
		accountModal: { isOpen: false },
		adminCsrfToken: null as string | null,
		bootstrapStatus: 'unknown' as TAccountBootstrapStatus,
		csrfToken: null as string | null,
		// Tracks whether bootstrap has reached a first result; use bootstrapStatus for success or failure.
		isBootstrapped: false,
		isLoggedIn: false,
		passwordMustChange: false,
		sync: {
			canRetry: false,
			conflicts: [] as ISyncConflictItem[],
			failedAttempts: 0,
			isSyncing: false,
			lastError: null as string | null,
			lastResult: null as TAccountSyncResult | null,
			lastSyncedAt: null as number | null,
			meta: null as IAccountSyncMeta | null,
			pendingCount: 0,
		},
		user: null as IAccountUserProfile | null,
	},
};

type TAccountPersistedState = Pick<typeof state, 'persistence'>;

export const accountStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state, TAccountPersistedState>({
			name: 'account-storage',
			partialize: (currentStore): TAccountPersistedState => ({
				persistence: currentStore.persistence,
			}),
			version: storeVersion.initial,
		}),
	],
});
