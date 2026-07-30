import { store } from '@davstack/store';

import { type TSyncNamespace } from '@/domain/account/contracts';

import type {
	IAccountSessionInitialData,
	IAccountSsoGrantInitialData,
	IAccountUserProfile,
	IAccountWebauthnInitialData,
} from '@/features/account/contracts';
import type { IAccountSyncMeta } from '@/features/account/sync/contracts';
import type { ISyncConflictItem } from '@/features/account/sync/types';
import {
	pushOverlayChild,
	requestOverlayClose,
	requestOverlayOpen,
	setExternallyOwnedOverlayRequested,
} from '@/features/overlays/client';
import type { TOverlayId } from '@/features/overlays/contracts';

import { createPersistMiddleware } from '@/infrastructure/browser/storage/createPersistMiddleware';

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
		hasPassword: false,
		isBootstrapped: false,
		isLoggedIn: false,
		passwordMustChange: false,
		sessionInitialData: null as IAccountSessionInitialData | null,
		ssoGrantInitialData: null as IAccountSsoGrantInitialData | null,
		sync: {
			autoResolvingNamespaces: [] as TSyncNamespace[],
			canRetry: false,
			conflicts: [] as ISyncConflictItem[],
			failedAttempts: 0,
			hasIsolatedState: false,
			isSyncing: false,
			lastError: null as string | null,
			lastResult: null as TAccountSyncResult | null,
			lastSyncedAt: null as number | null,
			meta: null as IAccountSyncMeta | null,
			pendingCount: 0,
			queueRevision: 0,
			remoteConflictNamespaces: [] as TSyncNamespace[],
		},
		user: null as IAccountUserProfile | null,
		webauthnInitialData: null as IAccountWebauthnInitialData | null,
	},
};

type TAccountPersistedState = Pick<typeof state, 'persistence'>;

export const accountStore = store(state, {
	middlewares: [
		createPersistMiddleware<typeof state, TAccountPersistedState>({
			name: 'account-storage',
			partialize: (currentStore): TAccountPersistedState => ({
				persistence: currentStore.persistence,
			}),
			version: storeVersion.initial,
		}),
	],
}).actions((currentStore) => ({
	closeAccountModal() {
		currentStore.shared.accountModal.isOpen.set(false);
		requestOverlayClose('account.main');
	},
	openAccountModal(parentId?: TOverlayId) {
		const onActivate = () => {
			currentStore.shared.accountModal.isOpen.set(true);
		};
		return parentId === undefined
			? requestOverlayOpen('account.main', { onActivate })
			: pushOverlayChild({
					childId: 'account.main',
					onOpenChild: onActivate,
					parentId,
				});
	},
	setPasswordMustChange(value: boolean) {
		currentStore.shared.passwordMustChange.set(value);
		setExternallyOwnedOverlayRequested('account.password-required', value);
	},
}));
