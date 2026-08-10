export async function register() {
	if (process.env['NEXT_RUNTIME'] !== 'nodejs') {
		return;
	}

	await import('@/infrastructure/runtime/serverPolyfills');

	const { warmVisitorCountCache } =
		await import('@/features/siteStatus/server/visitors');

	void warmVisitorCountCache();
}
