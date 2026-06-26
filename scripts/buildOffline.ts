import { spawn } from 'node:child_process';
import { extname } from 'node:path';
import { execPath, platform } from 'node:process';

const offlineEnv = { ...process.env, OFFLINE: 'true' };
const packageManagerExecPath = process.env['npm_execpath'];

function checkNodeScriptPath(filePath: string) {
	const extension = extname(filePath).toLowerCase();

	return ['.cjs', '.js', '.mjs'].includes(extension);
}

function createLocalBinCommand(command: string, args: string[]) {
	if (packageManagerExecPath === undefined) {
		return { args, command, shell: false };
	}

	if (checkNodeScriptPath(packageManagerExecPath)) {
		return {
			args: [packageManagerExecPath, 'exec', command, ...args],
			command: execPath,
			shell: false,
		};
	}

	return {
		args: ['exec', command, ...args],
		command: packageManagerExecPath,
		shell: platform === 'win32',
	};
}

function run(command: string, args: string[]) {
	return new Promise<void>((resolve, reject) => {
		const localBinCommand = createLocalBinCommand(command, args);
		const executedCommand = [
			localBinCommand.command,
			...localBinCommand.args,
		].join(' ');
		const child = spawn(localBinCommand.command, localBinCommand.args, {
			env: offlineEnv,
			shell: localBinCommand.shell,
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
