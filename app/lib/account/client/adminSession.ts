import { accountStore } from '@/stores/account';
import { AccountApiError } from './api';

export function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

// Administrator session expiry is 401-only; 403 is CSRF or permission failure.
export function checkAdminSessionUnauthorized(error: unknown) {
	return error instanceof AccountApiError && error.status === 401;
}
