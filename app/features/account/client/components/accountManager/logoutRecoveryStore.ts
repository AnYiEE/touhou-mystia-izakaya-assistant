import { store } from '@davstack/store';

export const logoutRecoveryStore = store({
	operation: null as null | 'all' | 'current',
	reason: null as null | 'sync-failed' | 'sync-unavailable',
});
