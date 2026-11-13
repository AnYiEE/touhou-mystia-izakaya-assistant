import { store } from '@davstack/store';

import { type IFeatureAccessResponse } from '@/domain/featureAccess/contracts';

import type { IAccountUserProfile } from '@/features/account/contracts';

export interface IAccountWorkspacePendingAuth {
	authOperationId: string;
	csrfToken: string;
	expectedWorkspaceGeneration: number;
	featureAccess: IFeatureAccessResponse;
	hasPassword: boolean;
	passwordMustChange: boolean;
	reason:
		| 'account-mismatch'
		| 'guest-adoption'
		| 'password-required'
		| 'session-relogin';
	user: IAccountUserProfile;
}

export const accountWorkspacePendingAuthStore = store<{
	value: IAccountWorkspacePendingAuth | null;
}>({ value: null });

export function setAccountWorkspacePendingAuth(
	value: IAccountWorkspacePendingAuth
) {
	accountWorkspacePendingAuthStore.value.set(value);
}

export function readAccountWorkspacePendingAuth() {
	return accountWorkspacePendingAuthStore.value.get();
}

export function clearAccountWorkspacePendingAuth() {
	accountWorkspacePendingAuthStore.value.set(null);
}

export function checkCurrentAccountWorkspacePendingAuth(
	value: IAccountWorkspacePendingAuth
) {
	const pendingAuth = readAccountWorkspacePendingAuth();
	return (
		pendingAuth === value ||
		(pendingAuth !== null &&
			pendingAuth.authOperationId === value.authOperationId &&
			pendingAuth.user.id === value.user.id &&
			pendingAuth.expectedWorkspaceGeneration ===
				value.expectedWorkspaceGeneration)
	);
}
