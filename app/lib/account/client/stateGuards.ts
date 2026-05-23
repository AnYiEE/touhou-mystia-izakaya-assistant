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

type TSynchronousResult<T> = T extends PromiseLike<unknown> ? never : T;

function checkThenable(value: unknown): value is PromiseLike<unknown> {
	return (
		value !== null &&
		(typeof value === 'object' || typeof value === 'function') &&
		'then' in value &&
		typeof (value as { then?: unknown }).then === 'function'
	);
}

export function withApplyingRemoteState<T>(
	callback: () => TSynchronousResult<T>
) {
	applyingRemoteStateCount += 1;
	try {
		const result: unknown = callback();
		if (checkThenable(result)) {
			throw new Error(
				'withApplyingRemoteState callback must be synchronous'
			);
		}

		return result as TSynchronousResult<T>;
	} finally {
		applyingRemoteStateCount -= 1;
	}
}
