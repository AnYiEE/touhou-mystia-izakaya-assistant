// @ts-check

import {execSync} from 'node:child_process';
import {env} from 'node:process';

export const IS_OFFLINE = Boolean(env.OFFLINE);
export const IS_PRODUCTION = env.NODE_ENV === 'production';

export const CDN_URL = IS_OFFLINE ? '' : (env.CDN_URL ?? '');

export const getSha = () => {
	if (env.VERCEL_GIT_COMMIT_SHA) {
		return env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
	}

	try {
		return execSync('git rev-parse --short HEAD').toString('utf8').trim().slice(0, 7);
	} catch {
		return 'unknown';
	}
};
