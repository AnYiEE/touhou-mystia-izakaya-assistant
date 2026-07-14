import { spawn } from 'node:child_process';
import { constants as fileSystemConstants } from 'node:fs';
import { lstat, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	cleanupObsoleteReleases,
	readCurrentRelease,
	resolveReleaseDirectory,
	validateCurrentReleaseDirectory,
	validatePathAccess,
} from './deployment/release.mjs';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @typedef {{ buildId: string, createdAt: number, release: string }} CurrentRelease
 * @typedef {{
 *   releaseDirectory: string,
 *   serverPath: string,
 *   sqliteDatabasePath: string,
 *   uploadDirectoryPath: string,
 * }} ValidatedRuntime
 * @typedef {{ code: number | null, signal: NodeJS.Signals | null }} ChildResult
 */

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
}

/** @param {string | undefined} value */
function checkEnvFlag(value) {
	const normalizedValue = value?.trim().toLowerCase();
	return normalizedValue === '1' || normalizedValue === 'true';
}

/**
 * @param {string | undefined} value
 * @param {string} defaultPath
 * @param {string} relativeCode
 */
function getAbsoluteStoragePath(value, defaultPath, relativeCode) {
	const trimmedValue = value?.trim();
	if (trimmedValue === undefined || trimmedValue === '') {
		return resolve(defaultPath);
	}
	if (!isAbsolute(trimmedValue)) {
		throw createError(relativeCode);
	}
	return resolve(trimmedValue);
}

/**
 * @param {string} path
 * @param {'isDirectory' | 'isFile'} expectedType
 * @param {string} errorCode
 */
async function validateStoragePath(path, expectedType, errorCode) {
	try {
		await lstat(path);
	} catch (error) {
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			await validatePathAccess(dirname(path), 'isDirectory', errorCode);
			return;
		}
		throw createError(errorCode, error);
	}
	await validatePathAccess(path, expectedType, errorCode);
}

/** @param {string} parentDirectory @param {string} candidatePath */
function checkPathInside(parentDirectory, candidatePath) {
	const relativePath = relative(parentDirectory, candidatePath);
	return (
		relativePath !== '' &&
		!relativePath.startsWith(`..${sep}`) &&
		relativePath !== '..' &&
		!isAbsolute(relativePath)
	);
}

/** @param {string} rootDirectory @param {string} serverPath */
export function loadProjectEnvironment(rootDirectory, serverPath) {
	const releaseDirectory = dirname(serverPath);
	const releaseRequire = createRequire(serverPath);
	let nextEnvironmentPath;
	try {
		nextEnvironmentPath = releaseRequire.resolve('@next/env');
	} catch (error) {
		throw createError('release-next-environment-not-loadable', error);
	}
	if (!checkPathInside(releaseDirectory, resolve(nextEnvironmentPath))) {
		throw createError('release-next-environment-outside-release');
	}
	let nextEnvironment;
	try {
		nextEnvironment = releaseRequire('@next/env');
	} catch (error) {
		throw createError('release-next-environment-not-loadable', error);
	}
	const loadEnvConfig =
		nextEnvironment.loadEnvConfig ?? nextEnvironment.default?.loadEnvConfig;
	if (typeof loadEnvConfig !== 'function') {
		throw createError('release-next-environment-invalid');
	}
	loadEnvConfig(resolve(rootDirectory), false);
}

/**
 * @param {string} rootDirectory
 * @param {CurrentRelease} current
 * @param {NodeJS.ProcessEnv} environment
 * @returns {Promise<ValidatedRuntime>}
 */
export async function validateSelfHostedRuntime(
	rootDirectory,
	current,
	environment
) {
	if (!checkEnvFlag(environment.SELF_HOSTED)) {
		throw createError('self-hosted-runtime-required');
	}
	const releaseDirectory = resolveReleaseDirectory(
		rootDirectory,
		current.release
	);
	const serverPath = resolve(releaseDirectory, 'server.js');
	const buildIdPath = resolve(releaseDirectory, '.next', 'BUILD_ID');
	await validatePathAccess(
		serverPath,
		'isFile',
		'current-release-server-not-accessible',
		fileSystemConstants.R_OK
	);
	await validatePathAccess(
		buildIdPath,
		'isFile',
		'current-release-build-id-not-accessible',
		fileSystemConstants.R_OK
	);
	let releaseBuildId;
	try {
		const releaseBuildIdContents = await readFile(buildIdPath, 'utf8');
		releaseBuildId = releaseBuildIdContents.trim().toLowerCase();
	} catch (error) {
		throw createError('current-release-build-id-not-accessible', error);
	}
	if (releaseBuildId !== current.buildId) {
		throw createError('current-release-build-id-mismatch');
	}
	const sqliteDatabasePath = getAbsoluteStoragePath(
		environment.SQLITE_DATABASE_PATH,
		resolve(rootDirectory, 'sqlite.db'),
		'sqlite-database-path-must-be-absolute'
	);
	const uploadDirectoryPath = getAbsoluteStoragePath(
		environment.UPLOAD_DIR,
		resolve(rootDirectory, 'upload'),
		'upload-directory-path-must-be-absolute'
	);
	await validateStoragePath(
		sqliteDatabasePath,
		'isFile',
		'sqlite-database-not-accessible'
	);
	await validateStoragePath(
		uploadDirectoryPath,
		'isDirectory',
		'upload-directory-not-accessible'
	);
	return {
		releaseDirectory,
		serverPath,
		sqliteDatabasePath,
		uploadDirectoryPath,
	};
}

/**
 * @param {import('node:child_process').ChildProcess} child
 * @param {NodeJS.Signals} signal
 */
export function forwardSignalToChild(child, signal) {
	return child.kill(signal);
}

/**
 * @param {string} serverPath
 * @param {NodeJS.ProcessEnv} environment
 * @returns {Promise<ChildResult>}
 */
function runChild(serverPath, environment) {
	return new Promise((resolvePromise, reject) => {
		const child = spawn(process.execPath, [serverPath], {
			env: environment,
			stdio: 'inherit',
		});
		const signalHandlers = {
			SIGINT: () => {
				forwardSignalToChild(child, 'SIGINT');
			},
			SIGTERM: () => {
				forwardSignalToChild(child, 'SIGTERM');
			},
		};
		const removeSignalHandlers = () => {
			process.off('SIGINT', signalHandlers.SIGINT);
			process.off('SIGTERM', signalHandlers.SIGTERM);
		};
		process.on('SIGINT', signalHandlers.SIGINT);
		process.on('SIGTERM', signalHandlers.SIGTERM);
		child.once('error', (error) => {
			removeSignalHandlers();
			reject(createError('self-hosted-server-spawn-failed', error));
		});
		child.once('close', (code, signal) => {
			removeSignalHandlers();
			resolvePromise({ code, signal });
		});
	});
}

/** @param {string} [rootDirectory] */
export async function startSelfHosted(rootDirectory = projectDirectory) {
	while (true) {
		const current = readCurrentRelease(rootDirectory);
		const currentReleaseDirectory = await validateCurrentReleaseDirectory(
			rootDirectory,
			current.release
		);
		const serverPath = resolve(currentReleaseDirectory, 'server.js');
		loadProjectEnvironment(rootDirectory, serverPath);
		const runtime = await validateSelfHostedRuntime(
			rootDirectory,
			current,
			process.env
		);
		if (!(await cleanupObsoleteReleases(rootDirectory, current.release))) {
			continue;
		}
		const result = await runChild(runtime.serverPath, {
			...process.env,
			SQLITE_DATABASE_PATH: runtime.sqliteDatabasePath,
			UPLOAD_DIR: runtime.uploadDirectoryPath,
		});
		if (result.signal !== null) {
			process.kill(process.pid, result.signal);
			return;
		}
		// eslint-disable-next-line require-atomic-updates -- The child has exited before its final status is assigned to the launcher.
		process.exitCode = result.code ?? 1;
		return;
	}
}

/** @param {unknown} error */
function getSafeErrorCode(error) {
	if (error instanceof Error && /^[a-z0-9-]+$/u.test(error.message)) {
		return error.message;
	}
	return 'self-hosted-startup-failed';
}

const [, entryPath] = process.argv;
if (
	entryPath !== undefined &&
	resolve(entryPath) === fileURLToPath(import.meta.url)
) {
	try {
		await startSelfHosted();
	} catch (error) {
		console.error('Self-hosted startup failed.', {
			errorCode: getSafeErrorCode(error),
		});
		process.exitCode = 1;
	}
}
