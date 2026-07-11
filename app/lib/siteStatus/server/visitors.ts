const VISITOR_REFRESH_TTL_MS = 30 * 1000;
const VISITOR_REQUEST_TIMEOUT_MS = 3000;

interface IVisitorCountReaderOptions {
	endpoint: string | undefined;
	fetchImpl?: typeof fetch;
	now?: () => number;
	requestTimeoutMs?: number;
	siteId: string | undefined;
	token: string | undefined;
}

function hasVisitorConfiguration(
	configuration: readonly [
		string | undefined,
		string | undefined,
		string | undefined,
	]
): configuration is readonly [string, string, string] {
	return configuration.every((value) => typeof value === 'string');
}

export function createVisitorCountReader({
	endpoint,
	fetchImpl = fetch,
	now = Date.now,
	requestTimeoutMs = VISITOR_REQUEST_TIMEOUT_MS,
	siteId,
	token,
}: IVisitorCountReaderOptions) {
	const configuration = [endpoint, siteId, token] as const;
	if (!hasVisitorConfiguration(configuration)) {
		return () => Promise.resolve(null);
	}
	const [configuredEndpoint, configuredSiteId, configuredToken] =
		configuration;
	let cachedVisitors: number | null = null;
	let nextRefreshAt = 0;
	let refreshPromise: Promise<void> | null = null;

	const refresh = async () => {
		const abortController = new AbortController();
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		try {
			const url = new URL(configuredEndpoint);
			url.searchParams.set('module', 'API');
			url.searchParams.set('method', 'Live.getCounters');
			url.searchParams.set('format', 'json');
			url.searchParams.set('lastMinutes', '3');
			url.searchParams.set('idSite', configuredSiteId);
			url.searchParams.set('date', 'today');
			url.searchParams.set('period', 'day');
			const fetchPromise = fetchImpl(url, {
				body: new URLSearchParams({
					token_auth: configuredToken,
				}).toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'POST',
				signal: abortController.signal,
			});
			const timeoutPromise = new Promise<never>((_resolve, reject) => {
				timeoutId = setTimeout(() => {
					abortController.abort();
					reject(new Error('visitor-count-request-timeout'));
				}, requestTimeoutMs);
			});
			const response = await Promise.race([fetchPromise, timeoutPromise]);
			if (!response.ok) {
				return;
			}

			const body: unknown = await Promise.race([
				response.json(),
				timeoutPromise,
			]);
			if (!Array.isArray(body) || body.length === 0) {
				return;
			}
			const [first] = body;
			if (
				first === null ||
				typeof first !== 'object' ||
				!('visitors' in first) ||
				typeof first.visitors !== 'string'
			) {
				return;
			}
			const visitors = Number.parseInt(first.visitors, 10);
			if (Number.isSafeInteger(visitors) && visitors >= 0) {
				cachedVisitors = visitors;
			}
		} catch {
			// Visitor statistics are optional and independent from site status.
		} finally {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- The Promise executor assigns this timer synchronously, which TypeScript control flow does not observe.
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
			}
			nextRefreshAt = now() + VISITOR_REFRESH_TTL_MS;
		}
	};

	return async () => {
		if (now() >= nextRefreshAt) {
			refreshPromise ??= refresh().finally(() => {
				refreshPromise = null;
			});
		}
		if (refreshPromise !== null) {
			await refreshPromise;
		}
		return cachedVisitors;
	};
}

export const readVisitorCount = createVisitorCountReader({
	endpoint: process.env.ANALYTICS_API_ENDPOINT,
	siteId: process.env.ANALYTICS_SITE_ID,
	token: process.env.ANALYTICS_TOKEN,
});
