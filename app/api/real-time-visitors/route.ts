import {NextResponse} from 'next/server';
import {env} from 'node:process';

type TVisitorCountResponse = [
	{
		actions: string;
		convertedVisits: string;
		visitors: string;
		visits: string;
	},
];

interface IVisitorCountCache {
	data: {
		visitors: number;
	} | null;
	timestamp: number;
	refreshTtl: number;
}

const cache: IVisitorCountCache = {
	data: null,
	refreshTtl: 30 * 1000,
	timestamp: 0,
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
				}).toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				method: 'POST',
			}
		);

		if (!response.ok) {
			return;
		}

		const [{visitors}] = (await response.json()) as TVisitorCountResponse;

		Object.assign(cache, {
			data: {
				visitors: Number.parseInt(visitors),
			},
			timestamp: Date.now(),
		});
	} catch {
		/* empty */
	}
}

if (!globalThis.__visitorCountCacheInitialized) {
	globalThis.__visitorCountCacheInitialized = true;
	await refreshCache();
	setInterval(() => {
		void refreshCache();
	}, cache.refreshTtl);
}

export function GET() {
	if (cache.data === null) {
		return NextResponse.json({
			visitors: -1,
		});
	}

	return NextResponse.json(cache.data);
}
