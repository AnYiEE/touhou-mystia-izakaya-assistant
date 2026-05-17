let applyingRemoteStateCount = 0;
let accountSyncPauseCount = 0;

export function checkAccountSyncPaused() {
	return accountSyncPauseCount > 0;
}

export function checkApplyingRemoteState() {
	return applyingRemoteStateCount > 0;
}

export async function withAccountSyncPaused<T>(callback: () => Promise<T>) {
	accountSyncPauseCount += 1;
	try {
		return await callback();
	} finally {
		accountSyncPauseCount -= 1;
	}
}

export function withApplyingRemoteState<T>(callback: () => T) {
	applyingRemoteStateCount += 1;
	try {
		return callback();
	} finally {
		applyingRemoteStateCount -= 1;
	}
}
