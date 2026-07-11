/* eslint-disable sort-keys, @typescript-eslint/require-await */

import { type NextConfig } from 'next';

import {
	CDN_URL,
	IS_OFFLINE,
	IS_PRODUCTION,
	IS_SELF_HOSTED,
	IS_VERCEL,
	getSha,
} from './scripts/utils';
import {
	ACCOUNT_SYNC_REQUEST_MAX_BYTES,
	getServerActionBodySizeLimit,
} from './app/lib/account/shared/requestLimits';

const serverActionBodySizeLimit = getServerActionBodySizeLimit(
	ACCOUNT_SYNC_REQUEST_MAX_BYTES
);

const exportMode = IS_OFFLINE || (!IS_SELF_HOSTED && !IS_VERCEL);
const skipLint =
	IS_OFFLINE || (IS_PRODUCTION && Boolean(process.env.SKIP_LINT));

const nextConfig: NextConfig = {
	env: {
		ANALYTICS_API_URL: process.env.ANALYTICS_API_URL,
		ANALYTICS_SCRIPT_URL: process.env.ANALYTICS_SCRIPT_URL,
		ANALYTICS_SITE_ID: process.env.ANALYTICS_SITE_ID,
		BASE_URL: process.env.BASE_URL,
		CDN_URL: process.env.CDN_URL,
		ICP_FILING: process.env.ICP_FILING,
		OFFLINE: process.env.OFFLINE,
		SELF_HOSTED: process.env.SELF_HOSTED,
		SERVICE_API_ORIGIN: process.env.SERVICE_API_ORIGIN,
		SHORT_LINK_URL: process.env.SHORT_LINK_URL,
		VERCEL: process.env.VERCEL,
		VERCEL_ENV: process.env.VERCEL_ENV,
		VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
	},

	// Hand over to Nginx and other web servers for reverse proxy and compression.
	compress: !IS_SELF_HOSTED,

	// To generate a consistent build ID to use for CDN caching.
	generateBuildId: getSha,

	assetPrefix: IS_VERCEL ? '' : CDN_URL,
	reactStrictMode: true,
	typedRoutes: true,

	eslint: { ignoreDuringBuilds: skipLint },
	typescript: { ignoreBuildErrors: skipLint },

	experimental: {
		serverActions: { bodySizeLimit: serverActionBodySizeLimit },
		webpackMemoryOptimizations: skipLint,
	},
};

if (exportMode) {
	nextConfig.output = 'export';
} else {
	nextConfig.headers = async () => {
		const headers: Awaited<ReturnType<NonNullable<NextConfig['headers']>>> =
			[];

		if (IS_PRODUCTION) {
			headers.push({
				source: '/assets/:path*',
				headers: [{ key: 'Cache-Control', value: 'no-cache' }],
			});
		}

		return headers;
	};
}

export default nextConfig;
