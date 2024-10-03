// @ts-check

import {env} from 'node:process';

import {getSha} from './scripts/utils.js';

/** @type {import('next').NextConfig} */
const nextConfig = {
	compress: !env.HOSTED,
	generateBuildId: () => getSha(),
	reactStrictMode: true,
};

if (!env.HOSTED && !env.VERCEL) {
	nextConfig.output = 'export';
}

export default nextConfig;
