import { accountStore } from '@/stores/account';

export function clearAdminSession() {
	accountStore.shared.adminCsrfToken.set(null);
}
