'use client';

import { type Dispatch, type SetStateAction } from 'react';

import {
	AccountApiError,
	type TAccountApiResult,
} from '@/features/account/client/api';
import { type TAccountWorkspaceAuthOutcome } from '@/features/account/client/workspace/authOutcome';
import { checkAccountWorkspaceUserId } from '@/features/account/client/workspace/ownerStorage';

export interface IAccountAuthContext {
	expectedCsrfToken?: string | null;
	expectedUserId?: string | null;
}

export type TAccountAuthContext = IAccountAuthContext | undefined;

export interface IAccountActionController {
	isSubmitting: boolean;
	message: string | null;
	setIsSubmitting: Dispatch<SetStateAction<boolean>>;
	setMessage: Dispatch<SetStateAction<string | null>>;
}

function reconcileAccountLifecycle(authOutcome: TAccountWorkspaceAuthOutcome) {
	void import('@/features/account/client/workspace/lifecycle').then(
		({ reconcileAccountWorkspace }) =>
			reconcileAccountWorkspace({
				authOutcome,
				source: 'runtime-invalidation',
			})
	);
}

function getLifecycleOutcomeFromAccountError(error: {
	data?: Record<string, unknown> | undefined;
	httpStatus: number;
	message: string;
}): TAccountWorkspaceAuthOutcome | null {
	if (error.httpStatus === 401 || error.message === 'user-deleted') {
		return { kind: 'session-expired' };
	}
	if (error.httpStatus !== 403) {
		return null;
	}
	if (error.message === 'password-must-change') {
		return { kind: 'password-required' };
	}
	if (error.message === 'user-disabled') {
		const responseUserId = error.data?.['user_id'];
		return checkAccountWorkspaceUserId(responseUserId)
			? { kind: 'account-disabled', sessionUserId: responseUserId }
			: null;
	}
	return null;
}

export function handleUnauthorizedAccountError(
	error: unknown,
	context: TAccountAuthContext = {}
) {
	void context;
	if (error instanceof AccountApiError) {
		const outcome = getLifecycleOutcomeFromAccountError({
			data: error.data,
			httpStatus: error.status,
			message: error.message,
		});
		if (outcome !== null) {
			reconcileAccountLifecycle(outcome);
			return true;
		}
	}
	return false;
}

export function handleUnauthorizedAccountActionError(
	error: Extract<TAccountApiResult, { status: 'error' }>,
	context: TAccountAuthContext = {}
) {
	void context;
	const outcome = getLifecycleOutcomeFromAccountError(error);
	if (outcome !== null) {
		reconcileAccountLifecycle(outcome);
		return true;
	}

	return false;
}
