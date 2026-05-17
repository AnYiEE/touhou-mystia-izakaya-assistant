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
	persistence: { hasSkippedOnboarding: false },
	shared: {
		adminCsrfToken: null as string | null,
		bootstrapStatus: 'unknown' as TAccountBootstrapStatus,
		csrfToken: null as string | null,
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

export const accountStore = store(state, {
	middlewares: [
		persistMiddleware<typeof state>({
			name: 'account-storage',
			partialize: (currentStore) =>
				({
					persistence: currentStore.persistence,
				}) as typeof currentStore,
			version: storeVersion.initial,
		}),
	],
});
