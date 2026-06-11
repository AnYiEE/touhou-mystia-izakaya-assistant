import { AccountApiError } from './api';
import { accountStore } from '@/stores/account';

export function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}

export function checkAdminSessionUnauthorized(error: unknown) {
	return error instanceof AccountApiError && error.status === 401;
}
