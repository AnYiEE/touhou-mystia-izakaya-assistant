import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import {
	checkEnvFlag,
	checkOfflineEnv,
	checkVercelEnv,
} from '../app/lib/environment';

const execAsync = promisify(exec);

export const IS_OFFLINE = checkOfflineEnv(process.env.OFFLINE);
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_SELF_HOSTED = checkEnvFlag(process.env.SELF_HOSTED);
export const IS_VERCEL = checkVercelEnv(process.env.VERCEL);

export const CDN_URL = IS_OFFLINE ? '' : (process.env.CDN_URL ?? '');

export async function getSha() {
	if (process.env.VERCEL_GIT_COMMIT_SHA) {
		return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
	}

	try {
		const { stdout } = await execAsync('git rev-parse --short HEAD');

		return stdout.trim().slice(0, 7);
	} catch {
		return 'unknown';
	}
}
