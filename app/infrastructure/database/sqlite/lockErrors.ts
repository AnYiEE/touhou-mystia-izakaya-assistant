export function checkRetryableSqliteLockError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	const { code } = error as NodeJS.ErrnoException;
	return (
		code === 'SQLITE_BUSY' ||
		code === 'SQLITE_BUSY_SNAPSHOT' ||
		code === 'SQLITE_LOCKED' ||
		error.message.includes('database is locked')
	);
}
