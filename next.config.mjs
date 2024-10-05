// @ts-check
/* eslint-disable sort-keys, @typescript-eslint/require-await */

import {env} from 'node:process';

import {CDN_URL, IS_PRODUCTION, getSha} from './scripts/utils.js';

const skipLint = IS_PRODUCTION && Boolean(env.SKIP_LINT);

/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
		DOMAIN: env.DOMAIN,

		CDN_URL: env.CDN_URL,
		ICP_FILING: env.ICP_FILING,

		ANALYTICS: env.ANALYTICS,
		SELF_HOSTED: env.SELF_HOSTED,
		VERCEL: env.VERCEL,
		VERCEL_ENV: env.VERCEL_ENV,
		VERCEL_GIT_COMMIT_SHA: env.VERCEL_GIT_COMMIT_SHA,
	},

	compress: !env.SELF_HOSTED,
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
