import { spawn } from 'node:child_process';
import { cp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { execPath } from 'node:process';
import { fileURLToPath } from 'node:url';

import { checkEnvironmentFlag } from '../../app/infrastructure/environment/flags';

const moduleRequire = createRequire(import.meta.url);
const projectDirectory = resolve(import.meta.dirname, '../..');
const commandPathMap = {
	next: moduleRequire.resolve('next/dist/bin/next'),
	tsx: moduleRequire.resolve('tsx/cli'),
} as const;

function runCommand(command: keyof typeof commandPathMap, args: string[]) {
	return new Promise<void>((resolvePromise, reject) => {
		const child = spawn(execPath, [commandPathMap[command], ...args], {
			cwd: projectDirectory,
			stdio: 'inherit',
		});

		child.once('error', reject);
		child.once('close', (code, signal) => {
			if (code === 0 && signal === null) {
				resolvePromise();
				return;
			}
			reject(
				new Error(
					`${command} failed${
						code === null ? '' : ` with exit code ${code}`
					}${signal === null ? '' : ` after signal ${signal}`}`
				)
			);
		});
	});
}

async function checkMapAssetsNotTraced() {
	const tracePath = resolve(
		projectDirectory,
		'.next/server/app/api/v1/maps/assets/[...path]/route.js.nft.json'
	);
	const trace: unknown = JSON.parse(await readFile(tracePath, 'utf8'));
	if (
		typeof trace !== 'object' ||
		trace === null ||
		!('files' in trace) ||
		!Array.isArray(trace.files) ||
		!trace.files.every((file) => typeof file === 'string')
	) {
		throw new Error('vercel-map-trace-invalid');
	}
	if (trace.files.some((file) => file.includes('app/assets/maps'))) {
		throw new Error('vercel-map-assets-traced');
	}
}

async function main() {
	if (!checkEnvironmentFlag(process.env.VERCEL)) {
		throw new Error('vercel-build-required');
	}

	const source = resolve(projectDirectory, 'app/assets/maps');
	const destination = resolve(projectDirectory, 'public/assets/maps');
	await rm(destination, { force: true, recursive: true });
	await cp(source, destination, { recursive: true });
	await runCommand('tsx', ['scripts/build/serviceWorker/generate.ts']);
	await runCommand('next', ['build']);
	await checkMapAssetsNotTraced();
	await runCommand('tsx', ['scripts/build/babelTransform.ts']);
}

const [, entryPath] = process.argv;
if (
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url)
) {
	await main();
}
