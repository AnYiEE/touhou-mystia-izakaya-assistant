import { spawn } from 'node:child_process';
import { env } from 'node:process';

const offlineEnv = { ...env, OFFLINE: 'true' };

function run(command: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, {
			env: offlineEnv,
			stdio: 'inherit',
		});

		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (code === 0) {
				resolve();
				return;
			}

			reject(
				new Error(
					`${command} ${args.join(' ')} failed${
						code === null ? '' : ` with exit code ${code}`
					}${signal === null ? '' : ` after signal ${signal}`}`
				)
			);
		});
	});
}

let shouldRestoreApiRoutes = false;

try {
	shouldRestoreApiRoutes = true;
	await run('tsx', ['scripts/generateOfflineZip.ts', '--prepare']);
	await run('next', ['build']);
	await run('tsx', ['scripts/babelTransformFile.ts']);
	await run('tsx', ['scripts/generateOfflineZip.ts']);
	shouldRestoreApiRoutes = false;
} finally {
	if (shouldRestoreApiRoutes) {
		try {
			await run('tsx', [
				'scripts/generateOfflineZip.ts',
				'--restore-only',
			]);
		} catch (error) {
			console.warn(
				'Failed to restore API routes after offline build.',
				error
			);
		}
	}
}
