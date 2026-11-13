import { AccountApiError } from '@/features/account/client/api';
import type { TAccountMeResponse } from '@/features/account/contracts';

import type { TAccountWorkspaceAuthOutcome } from './authContracts';
import { checkAccountWorkspaceUserId } from './ownerStorage';

export type { TAccountWorkspaceAuthOutcome } from './authContracts';

function classifyDisabledError(
	error: AccountApiError
): TAccountWorkspaceAuthOutcome {
	const responseUserId = error.data?.['user_id'];
	if (checkAccountWorkspaceUserId(responseUserId)) {
		return { kind: 'account-disabled', sessionUserId: responseUserId };
	}
	return { error, kind: 'transient' };
}

export function classifyAccountWorkspaceAuthOutcome(
	input:
		| {
				response: TAccountMeResponse;
				source: 'initial-data' | 'me-refresh';
		  }
		| { error: unknown; source: 'me-refresh' | 'protected-request' }
): TAccountWorkspaceAuthOutcome {
	if ('response' in input) {
		return input.response.isLoggedIn
			? { kind: 'authenticated', result: input.response }
			: { kind: 'anonymous' };
	}

	const { error } = input;
	if (!(error instanceof AccountApiError)) {
		return { error, kind: 'transient' };
	}
	if (error.status === 401) {
		return { kind: 'session-expired' };
	}
	if (error.status === 403) {
		if (error.message === 'user-deleted') {
			return { kind: 'session-expired' };
		}
		if (error.message === 'user-disabled') {
			return classifyDisabledError(error);
		}
		if (error.message === 'password-must-change') {
			return { kind: 'password-required' };
		}
	}

	return { error, kind: 'transient' };
}
