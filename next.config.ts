/* eslint-disable sort-keys, @typescript-eslint/require-await */

import {type NextConfig} from 'next';
import {env} from 'node:process';

import {CDN_URL, IS_OFFLINE, IS_PRODUCTION, getSha} from './scripts/utils.mjs';

const exportMode = IS_OFFLINE || (!env.SELF_HOSTED && !env.VERCEL);
const skipLint = IS_OFFLINE || (IS_PRODUCTION && Boolean(env.SKIP_LINT));

const envKeys: (keyof NodeJS.ProcessEnv)[] = [
	'ANALYTICS_API_URL',
	'ANALYTICS_SCRIPT_URL',
	'ANALYTICS_SITE_ID',
	'CLEANUP_SECRET',
	'BASE_URL',
	'CDN_URL',
	'ICP_FILING',
	'OFFLINE',
	'SELF_HOSTED',
	'SHORT_LINK_URL',
	'VERCEL',
	'VERCEL_ENV',
	'VERCEL_GIT_COMMIT_SHA',
];

const nextConfig: NextConfig = {
	env: envKeys.reduce<Partial<NodeJS.ProcessEnv>>((acc, key) => {
		acc[key] = env[key];
		return acc;
	}, {}),

	// Hand over to Nginx and other web servers for reverse proxy and compression.
	compress: !env.SELF_HOSTED,

	// To generate a consistent build ID to use for CDN caching.
	generateBuildId: getSha,

	assetPrefix: env.VERCEL ? '' : CDN_URL,
	reactStrictMode: true,

	eslint: {
		ignoreDuringBuilds: skipLint,
	},
	typescript: {
		ignoreBuildErrors: skipLint,
	},
};

if (exportMode) {
	nextConfig.output = 'export';
} else {
	nextConfig.headers = async () => {
		const headers: Awaited<ReturnType<NonNullable<NextConfig['headers']>>> = [];

		if (IS_PRODUCTION && !env.VERCEL) {
			headers.push({
				source: '/:all*(.gif|.ico|.png|.webp|.js|.txt|.webmanifest)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, must-revalidate, max-age=2592000',
					},
				],
			});
		}

		return headers;
	};
}

export default nextConfig;
