const resetRecoveryClearers = new Set<(userId?: string) => void>();

export function registerAccountSyncResetRecoveryClearer(
	clearer: (userId?: string) => void
) {
	resetRecoveryClearers.add(clearer);
}

export function clearAccountSyncResetRecoveries(userId?: string) {
	resetRecoveryClearers.forEach((clearer) => {
		clearer(userId);
	});
}
