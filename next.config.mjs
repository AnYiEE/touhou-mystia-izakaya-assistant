// @ts-check
/* eslint-disable sort-keys, @typescript-eslint/require-await */

import {env} from 'node:process';

import {CDN_URL, IS_PRODUCTION, getSha} from './scripts/utils.mjs';

const skipLint = IS_PRODUCTION && Boolean(env.SKIP_LINT);

/** @type {(keyof NodeJS.ProcessEnv)[]} */
const envKeys = [
	'ANALYTICS',
	'CDN_URL',
	'DOMAIN',
	'ICP_FILING',
	'SELF_HOSTED',
	'VERCEL',
	'VERCEL_ENV',
	'VERCEL_GIT_COMMIT_SHA',
];

/** @type {Partial<NodeJS.ProcessEnv>} */
const emptyEnvObject = {};

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: envKeys.reduce((acc, key) => {
		acc[key] = env[key];
		return acc;
	}, emptyEnvObject),

	// Hand over to Nginx and other web servers for reverse proxy and compression.
	compress: !env.SELF_HOSTED,

	// To generate a consistent build ID to use for CDN caching.
	generateBuildId: getSha,

	assetPrefix: env.VERCEL ? '' : CDN_URL,
	headers: async () => {
		const headers = [];
		if (IS_PRODUCTION && !env.VERCEL) {
			headers.push({
				source: '/:all*(.gif|.ico|.png|.webp|.json|.txt|.js)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, must-revalidate, max-age=2592000',
					},
				],
			});
		}
		return headers;
	},
	reactStrictMode: true,

	eslint: {
		ignoreDuringBuilds: skipLint,
	},
	typescript: {
		ignoreBuildErrors: skipLint,
	},
};

if (!env.SELF_HOSTED && !env.VERCEL) {
	nextConfig.output = 'export';
}

export default nextConfig;
