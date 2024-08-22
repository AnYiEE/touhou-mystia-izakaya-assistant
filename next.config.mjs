// @ts-check

import {env} from 'node:process';

/** @type {import('next').NextConfig} */
const nextConfig = {
	compress: !env.HOSTED,
	reactStrictMode: true,
};

if (!env.HOSTED && !env.VERCEL) {
	nextConfig.output = 'export';
}

export default nextConfig;
