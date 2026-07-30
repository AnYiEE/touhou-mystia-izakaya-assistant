import {
	checkAdminFeatureEnabled,
	verifyAdminCsrfToken,
	verifyAdminSessionToken,
} from '@/features/account/admin/server/auth';
import { type TAccountGuardResult } from '@/features/account/server/http/guards';

export function checkAdminFeatureGuard(): TAccountGuardResult {
	if (checkAdminFeatureEnabled()) {
		return { status: 'ok' };
	}

	return { httpStatus: 404, message: 'feature-disabled', status: 'error' };
}

export function authenticateAdminSessionToken(
	token: string | null
): TAccountGuardResult<{
	payload: NonNullable<ReturnType<typeof verifyAdminSessionToken>>;
	token: string;
}> {
	if (token === null) {
		return { httpStatus: 401, message: 'unauthorized', status: 'error' };
	}

	const payload = verifyAdminSessionToken(token);
	if (payload === null) {
		return {
			httpStatus: 401,
			message: 'admin-session-expired',
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

	return { httpStatus: 403, message: 'forbidden', status: 'error' };
}
