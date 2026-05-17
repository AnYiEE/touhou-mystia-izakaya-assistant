/* eslint-disable sort-keys, @typescript-eslint/require-await */

import { type NextConfig } from 'next';
import { env } from 'node:process';

import {
	CDN_URL,
	IS_OFFLINE,
	IS_PRODUCTION,
	IS_SELF_HOSTED,
	IS_VERCEL,
	getSha,
} from './scripts/utils';

const exportMode = IS_OFFLINE || (!IS_SELF_HOSTED && !IS_VERCEL);
const skipLint = IS_OFFLINE || (IS_PRODUCTION && Boolean(env.SKIP_LINT));

const legacyApiCorsHeaders = [
	{ key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
	{
		key: 'Access-Control-Allow-Methods',
		value: 'DELETE, GET, OPTIONS, POST',
	},
	{ key: 'Access-Control-Allow-Origin', value: '*' },
] as const;

const legacyApiCorsSources = [
	'/api/v1/backups',
	'/api/v1/backups/:code',
	'/api/v1/backups/:code/metadata',
	'/api/v1/analytics/:path*',
] as const;

const nextConfig: NextConfig = {
	env: {
		ANALYTICS_API_URL: env.ANALYTICS_API_URL,
		ANALYTICS_SCRIPT_URL: env.ANALYTICS_SCRIPT_URL,
		ANALYTICS_SITE_ID: env.ANALYTICS_SITE_ID,
		BASE_URL: env.BASE_URL,
		CDN_URL: env.CDN_URL,
		ICP_FILING: env.ICP_FILING,
		OFFLINE: env.OFFLINE,
		SELF_HOSTED: env.SELF_HOSTED,
		SHORT_LINK_URL: env.SHORT_LINK_URL,
		VERCEL: env.VERCEL,
		VERCEL_ENV: env.VERCEL_ENV,
		VERCEL_GIT_COMMIT_SHA: env.VERCEL_GIT_COMMIT_SHA,
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

	experimental: { webpackMemoryOptimizations: skipLint },
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

		headers.push(
			...legacyApiCorsSources.map((source) => ({
				source,
				headers: [...legacyApiCorsHeaders],
			}))
		);

		return headers;
	};
}

export default nextConfig;
