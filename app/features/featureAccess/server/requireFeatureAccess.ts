import { type Transaction } from 'kysely';
import { type NextRequest } from 'next/server';

import type {
	IEffectiveFeatureAccess,
	TFeatureModuleKey,
} from '@/domain/featureAccess/contracts';

import {
	type IAuthenticatedAccount,
	authenticateAccountFromRequestWithTransaction,
} from '@/features/account/server/auth/requestAuthentication';
import { getAccountDatabase } from '@/features/account/server/persistence/database';
import { FEATURE_ACCESS_API_RESPONSE_CODE_MAP } from '@/features/featureAccess/apiResponseCodes';
import {
	type TFeatureAccessMessageKey,
	featureAccessMessages,
} from '@/features/featureAccess/messages';
import { readContentLocale } from '@/features/preferences/server/requestLocale';

import type { TDatabase } from '@/infrastructure/database/schema';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { createNoStoreErrorResponse } from '@/infrastructure/http/server/responses';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';

import {
	evaluateFeatureAccessForAnonymousInTransaction,
	evaluateFeatureAccessForUserInTransaction,
} from './accessService';

export const FEATURE_ACCESS_DENIED_MESSAGE =
	FEATURE_ACCESS_API_RESPONSE_CODE_MAP.denied;

interface TFeatureAccessErrorData {
	detail: string;
	reason: Exclude<IEffectiveFeatureAccess['reason'], 'allowed'>;
}

export type TFeatureAccessGuardResult =
	| {
			access: IEffectiveFeatureAccess;
			account: IAuthenticatedAccount | null;
			status: 'ok';
	  }
	| {
			access: IEffectiveFeatureAccess | null;
			data?: TFeatureAccessErrorData;
			httpStatus: number;
			message: string;
			status: 'error';
	  };

export function createFeatureAccessGuardResult(
	access: IEffectiveFeatureAccess | undefined,
	account: IAuthenticatedAccount | null,
	locale: TLocale
): TFeatureAccessGuardResult {
	if (access?.allowed === true) {
		return { access, account, status: 'ok' };
	}
	if (access?.reason === 'login-required') {
		return {
			access,
			data: {
				detail: translate(
					featureAccessMessages,
					locale,
					'featureAccess.api.loginRequired'
				),
				reason: access.reason,
			},
			httpStatus: 401,
			message: HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			status: 'error',
		};
	}
	const reason =
		access?.reason === undefined || access.reason === 'allowed'
			? 'unavailable'
			: access.reason;
	const messageKeyMap = {
		denied: 'featureAccess.api.denied',
		'grant-required': 'featureAccess.api.grantRequired',
		unavailable: 'featureAccess.api.unavailable',
	} as const satisfies Record<
		Exclude<TFeatureAccessErrorData['reason'], 'login-required'>,
		TFeatureAccessMessageKey
	>;
	return {
		access: access ?? null,
		data: {
			detail: translate(
				featureAccessMessages,
				locale,
				messageKeyMap[reason]
			),
			reason,
		},
		httpStatus: 403,
		message: FEATURE_ACCESS_DENIED_MESSAGE,
		status: 'error',
	};
}

export function createFeatureAccessGuardErrorResponse(
	result: Extract<TFeatureAccessGuardResult, { status: 'error' }>
) {
	return createNoStoreErrorResponse(
		result.message,
		result.httpStatus,
		result.data
	);
}

export function createFeatureAccessDecisionErrorResponse(
	access: IEffectiveFeatureAccess | null,
	locale: TLocale
) {
	const result = createFeatureAccessGuardResult(
		access ?? undefined,
		null,
		locale
	);
	if (result.status === 'ok') {
		return null;
	}

	return createFeatureAccessGuardErrorResponse(result);
}

export async function requireFeatureAccess(
	request: NextRequest,
	moduleKey: TFeatureModuleKey
): Promise<TFeatureAccessGuardResult> {
	const db = await getAccountDatabase();
	const locale = readContentLocale(request);
	const authenticated = await authenticateAccountFromRequestWithTransaction(
		request,
		(trx: Transaction<TDatabase>, account) =>
			evaluateFeatureAccessForUserInTransaction(
				trx,
				account.user.id,
				locale
			)
	);

	if (authenticated.status === 'ok') {
		const access = authenticated.result[moduleKey];
		return createFeatureAccessGuardResult(
			access,
			authenticated.data,
			locale
		);
	}
	if (authenticated.message !== 'unauthorized') {
		return {
			access: null,
			httpStatus: authenticated.httpStatus,
			message: authenticated.message,
			status: 'error',
		};
	}

	const access = await db
		.transaction()
		.execute((trx) =>
			evaluateFeatureAccessForAnonymousInTransaction(trx, locale)
		);
	return createFeatureAccessGuardResult(access[moduleKey], null, locale);
}
