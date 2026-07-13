import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execPath } from 'node:process';

const offlineEnv = { ...process.env, OFFLINE: 'true' };
const moduleRequire = createRequire(import.meta.url);
const commandPathMap = {
	next: moduleRequire.resolve('next/dist/bin/next'),
	tsx: moduleRequire.resolve('tsx/cli'),
} as const;

function runCommand(command: keyof typeof commandPathMap, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const commandArgs = [commandPathMap[command], ...args];
		const executedCommand = [execPath, ...commandArgs].join(' ');
		const child = spawn(execPath, commandArgs, {
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
					`${executedCommand} failed${
						code === null ? '' : ` with exit code ${code}`
					}${signal === null ? '' : ` after signal ${signal}`}`
				)
			);
		});
	});
}

async function main() {
	let shouldRestoreApiRoutes = false;

	try {
		shouldRestoreApiRoutes = true;
		await runCommand('tsx', ['scripts/generateOfflineZip.ts', '--prepare']);
		await runCommand('next', ['build']);
		await runCommand('tsx', ['scripts/babelTransformFile.ts']);
		await runCommand('tsx', ['scripts/generateOfflineZip.ts']);
		shouldRestoreApiRoutes = false;
	} finally {
		if (shouldRestoreApiRoutes) {
			try {
				await runCommand('tsx', [
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
}

const [, entryPath] = process.argv;
if (
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url)
) {
	await main();
}
