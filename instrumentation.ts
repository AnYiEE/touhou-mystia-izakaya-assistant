export async function register() {
	if (process.env['NEXT_RUNTIME'] !== 'nodejs') {
		return;
	}

	const { warmVisitorCountCache } =
		await import('@/features/siteStatus/server/visitors');

	void warmVisitorCountCache();
}
