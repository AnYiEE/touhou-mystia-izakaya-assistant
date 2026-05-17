import { exec } from 'node:child_process';
import { env } from 'node:process';
import { promisify } from 'node:util';

import { checkEnvFlag, checkVercelEnv } from '../app/lib/environment';

const execAsync = promisify(exec);

export const IS_OFFLINE = checkEnvFlag(env.OFFLINE);
export const IS_PRODUCTION = env.NODE_ENV === 'production';
export const IS_SELF_HOSTED = checkEnvFlag(env.SELF_HOSTED);
export const IS_VERCEL = checkVercelEnv(env.VERCEL);

export const CDN_URL = IS_OFFLINE ? '' : (env.CDN_URL ?? '');

export async function getSha() {
	if (env.VERCEL_GIT_COMMIT_SHA) {
		return env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
	}

	try {
		const { stdout } = await execAsync('git rev-parse --short HEAD');

		return stdout.trim().slice(0, 7);
	} catch {
		return 'unknown';
	}
}
