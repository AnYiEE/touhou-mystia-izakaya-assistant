import type { TAccountMeResponse } from '@/features/account/contracts';

export type TAccountAuthPurpose =
	'default' | 'required-account' | 'sso-authorize';

export function checkAccountAuthCanRegister(authPurpose: TAccountAuthPurpose) {
	return authPurpose === 'default' || authPurpose === 'sso-authorize';
}

export type TAccountWorkspaceAuthOutcome =
	| { kind: 'anonymous' }
	| {
			kind: 'authenticated';
			result: Extract<TAccountMeResponse, { isLoggedIn: true }>;
	  }
	| { kind: 'account-disabled'; sessionUserId: string }
	| { kind: 'password-required' }
	| { kind: 'session-expired' }
	| { kind: 'transient'; error: unknown };
