import {NextResponse} from 'next/server';
import {env} from 'node:process';

let cache: {
	data: {
		visitors: number;
	} | null;
	timestamp: number;
	ttl: number;
} = {
	data: null,
	timestamp: 0,
	ttl: 30 * 1000,
};

async function refreshCache() {
	if (!env.ANALYTICS_API_ENDPOINT || !env.ANALYTICS_SITE_ID || !env.ANALYTICS_TOKEN) {
		return;
	}

	try {
		const response = await fetch(
			`${env.ANALYTICS_API_ENDPOINT}?module=API&method=Live.getCounters&format=json&lastMinutes=5&idSite=${env.ANALYTICS_SITE_ID}&date=today&period=day`,
			{
				body: new URLSearchParams({
					token_auth: env.ANALYTICS_TOKEN,
				}),
				method: 'POST',
			}
		);

		if (!response.ok) {
			return;
		}

		const [{visitors}] = (await response.json()) as [
			{
				actions: string;
				convertedVisits: string;
				visitors: string;
				visits: string;
			},
		];

		cache = {
			...cache,
			data: {
				visitors: Number.parseInt(visitors),
			},
			timestamp: Date.now(),
		};
	} catch {
		/* empty */
	}
}

if (!globalThis.__analyticsCacheInitialized) {
	globalThis.__analyticsCacheInitialized = true;
	await refreshCache();
	setInterval(() => {
		void refreshCache();
	}, cache.ttl);
}

export function GET() {
	if (cache.data === null) {
		return NextResponse.json({
			visitors: -1,
		});
	}

	return NextResponse.json(cache.data);
}
