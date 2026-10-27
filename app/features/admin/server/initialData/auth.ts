import { authenticateAdminFromRequest } from '@/features/account/admin/server';
import { createAdminCsrfToken } from '@/features/account/admin/server/auth';
import { checkAdminFeatureGuard } from '@/features/account/admin/server/http/guards';
import type { IAdminMeData } from '@/features/account/contracts';
import {
	checkAccountCookieSecurityGuard,
	checkAccountFeatureGuard,
} from '@/features/account/server/http/guards';
import { ADMIN_CLIENT_ERROR_MESSAGE_MAP } from '@/features/admin/copy';

import { createCurrentRequest } from '@/infrastructure/http/server/currentRequest';

interface IAdminAuthInitialDataError {
	httpStatus: number;
	message: string;
	source:
		| 'account-feature'
		| 'admin-feature'
		| 'authentication'
		| 'cookie-security';
}

export type TAdminAuthInitialDataResult =
	| { admin: IAdminMeData; error: null }
	| { admin: null; error: IAdminAuthInitialDataError };

export function getAdminAuthInitialDataMessage(
	result: TAdminAuthInitialDataResult
) {
	const message = result.error?.message;
	if (message === undefined || message === 'unauthorized') {
		return null;
	}
	return ADMIN_CLIENT_ERROR_MESSAGE_MAP[message] ?? message;
}

export async function readAdminAuthInitialData(
	pathname: string
): Promise<TAdminAuthInitialDataResult> {
	const accountFeatureResult = await checkAccountFeatureGuard();
	if (accountFeatureResult.status === 'error') {
		return {
			admin: null,
			error: {
				httpStatus: accountFeatureResult.httpStatus,
				message: accountFeatureResult.message,
				source: 'account-feature',
			},
		};
	}

	const adminFeatureResult = checkAdminFeatureGuard();
	if (adminFeatureResult.status === 'error') {
		return {
			admin: null,
			error: {
				httpStatus: adminFeatureResult.httpStatus,
				message: adminFeatureResult.message,
				source: 'admin-feature',
			},
		};
	}

	const request = await createCurrentRequest(pathname);
	const cookieSecurityResult = checkAccountCookieSecurityGuard(request);
	if (cookieSecurityResult.status === 'error') {
		return {
			admin: null,
			error: {
				httpStatus: cookieSecurityResult.httpStatus,
				message: cookieSecurityResult.message,
				source: 'cookie-security',
			},
		};
	}

	const adminAuthResult = await authenticateAdminFromRequest(request);
	if (adminAuthResult.status === 'error') {
		return {
			admin: null,
			error: {
				httpStatus: adminAuthResult.httpStatus,
				message: adminAuthResult.message,
				source: 'authentication',
			},
		};
	}

	return {
		admin: {
			auth_source: adminAuthResult.source,
			csrf_token: createAdminCsrfToken(adminAuthResult.token),
			username: adminAuthResult.payload.username,
		},
		error: null,
	};
}
