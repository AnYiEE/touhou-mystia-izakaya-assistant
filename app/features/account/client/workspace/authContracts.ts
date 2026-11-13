import type { TAccountMeResponse } from '@/features/account/contracts';

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
