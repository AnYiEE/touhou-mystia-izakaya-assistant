const backupCodeLocks = new Map<string, Promise<void>>();

export async function withBackupCodeLock<T>(
	code: string,
	task: () => Promise<T>
) {
	const previousLock = backupCodeLocks.get(code) ?? Promise.resolve();
	let releaseCurrentLock!: () => void;
	const currentLock = new Promise<void>((resolve) => {
		releaseCurrentLock = resolve;
	});
	backupCodeLocks.set(code, currentLock);

	try {
		await previousLock.catch(() => {});
		return await task();
	} finally {
		releaseCurrentLock();
		if (backupCodeLocks.get(code) === currentLock) {
			backupCodeLocks.delete(code);
		}
	}
}
