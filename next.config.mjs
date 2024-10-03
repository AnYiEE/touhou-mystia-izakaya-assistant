// @ts-check

import {env} from 'node:process';

import {getSha} from './scripts/utils.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
	compress: !env.SELF_HOSTED,
	generateBuildId: () => getSha(),
	reactStrictMode: true,
};

if (!env.SELF_HOSTED && !env.VERCEL) {
	nextConfig.output = 'export';
}

export default nextConfig;
