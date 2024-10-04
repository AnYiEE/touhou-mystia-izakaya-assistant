// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports, unicorn/prefer-module */
'use strict';

const {execSync} = require('node:child_process');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CDN_URL = process.env.CDN_URL ?? '';

const getSha = () =>
	(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')).trim();

module.exports = {
	CDN_URL,
	getSha,
	IS_PRODUCTION,
};
