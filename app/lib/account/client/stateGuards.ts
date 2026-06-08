import { type TSyncNamespace } from '@/lib/account/sync';

type TAccountSyncResumeListener = (namespaces: TSyncNamespace[]) => void;

let applyingRemoteStateCount = 0;
let accountSyncPauseCount = 0;
const pausedDirtyNamespaceSet = new Set<TSyncNamespace>();
const accountSyncResumeListeners = new Set<TAccountSyncResumeListener>();

export function checkAccountSyncPaused() {
	return accountSyncPauseCount > 0;
}

export function checkApplyingRemoteState() {
	return applyingRemoteStateCount > 0;
}

export function recordPausedAccountSyncDirtyNamespace(
	namespace: TSyncNamespace
) {
	if (!checkAccountSyncPaused()) {
		return false;
	}

	pausedDirtyNamespaceSet.add(namespace);

	return true;
}

export function subscribeAccountSyncResume(
	listener: TAccountSyncResumeListener
) {
	accountSyncResumeListeners.add(listener);

	return () => {
		accountSyncResumeListeners.delete(listener);
	};
}

export async function withAccountSyncPaused<T>(callback: () => Promise<T>) {
	accountSyncPauseCount += 1;
	try {
		return await callback();
	} finally {
		accountSyncPauseCount -= 1;
		if (accountSyncPauseCount === 0 && pausedDirtyNamespaceSet.size > 0) {
			const namespaces = [...pausedDirtyNamespaceSet];
			pausedDirtyNamespaceSet.clear();
			accountSyncResumeListeners.forEach((listener) => {
				try {
					listener(namespaces);
				} catch (error) {
					namespaces.forEach((namespace) => {
						pausedDirtyNamespaceSet.add(namespace);
					});
					console.warn(
						'Failed to process resumed account sync namespaces',
						error
					);
				}
			});
		}
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
