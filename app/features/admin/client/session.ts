import { accountStore } from '@/features/account/client/state/accountStore';
import type { TAdminApiResult } from '@/features/admin/contracts';

type TAdminApiError = Extract<TAdminApiResult, { status: 'error' }>;

export function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

export function isAdminSessionInvalidResult(result: TAdminApiError) {
	return (
		result.httpStatus === 401 &&
		(result.message === 'unauthorized' ||
			result.message === 'admin-session-expired')
	);
}
