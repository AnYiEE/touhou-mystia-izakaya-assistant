'use client';

import { type Dispatch, type SetStateAction } from 'react';

import { publishAccountRuntimeInvalidation } from '@/features/account/client/accountRuntimeInvalidation';
import { type TAccountApiResult } from '@/features/account/client/api';
import {
	resetAccountStateForUnauthorizedError,
	resetAccountStateIfCurrent,
} from '@/features/account/client/session';
import { accountStore } from '@/features/account/client/state/accountStore';

export type TAccountAuthContext = Parameters<
	typeof resetAccountStateIfCurrent
>[0];

export interface IAccountActionController {
	isSubmitting: boolean;
	message: string | null;
	setIsSubmitting: Dispatch<SetStateAction<boolean>>;
	setMessage: Dispatch<SetStateAction<string | null>>;
}

export function handleUnauthorizedAccountError(
	error: unknown,
	context: TAccountAuthContext = {}
) {
	return resetAccountStateForUnauthorizedError(error, context);
}

export function handleUnauthorizedAccountActionError(
	error: Extract<TAccountApiResult, { status: 'error' }>,
	context: TAccountAuthContext = {}
) {
	if (error.httpStatus === 401) {
		const user = accountStore.shared.user.get();
		if (resetAccountStateIfCurrent(context) && user !== null) {
			void publishAccountRuntimeInvalidation({
				reason: 'session-expired',
				stateEpoch: user.state_epoch,
				userId: user.id,
			});
		}
		return true;
	}

	return false;
}
