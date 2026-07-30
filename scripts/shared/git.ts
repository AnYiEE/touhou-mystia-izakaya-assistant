import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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
