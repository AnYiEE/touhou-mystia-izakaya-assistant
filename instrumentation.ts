export async function register() {
	if (process.env['NEXT_RUNTIME'] !== 'nodejs') {
		return;
	}

	const { warmVisitorCountCache } =
		await import('@/lib/siteStatus/server/visitors');

	void warmVisitorCountCache();
}
