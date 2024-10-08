// @ts-check

import {execSync} from 'node:child_process';
import {env} from 'node:process';

export const IS_PRODUCTION = env.NODE_ENV === 'production';

export const CDN_URL = env.CDN_URL ?? '';

export const getSha = () =>
	(env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')).trim();
