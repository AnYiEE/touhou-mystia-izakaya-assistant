import {
	checkAdminFeatureEnabled,
	verifyAdminCsrfToken,
	verifyAdminSessionToken,
} from '@/features/account/admin/server/auth';
import { FEATURE_DISABLED_MESSAGE } from '@/features/account/server/featureStatus';
import { type TAccountGuardResult } from '@/features/account/server/http/guards';
import { ADMIN_API_RESPONSE_CODE_MAP } from '@/features/admin/apiResponseCodes';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';

export function checkAdminFeatureGuard(): TAccountGuardResult {
	if (checkAdminFeatureEnabled()) {
		return { status: 'ok' };
	}

	return {
		httpStatus: 404,
		message: FEATURE_DISABLED_MESSAGE,
		status: 'error',
	};
}

export function authenticateAdminSessionToken(
	token: string | null
): TAccountGuardResult<{
	payload: NonNullable<ReturnType<typeof verifyAdminSessionToken>>;
	token: string;
}> {
	if (token === null) {
		return {
			httpStatus: 401,
			message: HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			status: 'error',
		};
	}

	const payload = verifyAdminSessionToken(token);
	if (payload === null) {
		return {
			httpStatus: 401,
			message: ADMIN_API_RESPONSE_CODE_MAP.adminSessionExpired,
			status: 'error',
		};
	}

	return { data: { payload, token }, status: 'ok' };
}

export function checkAdminCsrfGuard(
	csrfToken: string | null,
	sessionToken: string
): TAccountGuardResult {
	if (csrfToken !== null && verifyAdminCsrfToken(csrfToken, sessionToken)) {
		return { status: 'ok' };
	}

	return {
		httpStatus: 403,
		message: HTTP_API_RESPONSE_CODE_MAP.forbidden,
		status: 'error',
	};
}
