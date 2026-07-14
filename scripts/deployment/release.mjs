import { constants as fileSystemConstants, readFileSync } from 'node:fs';
import {
	access,
	cp,
	link,
	lstat,
	mkdir,
	open,
	readFile,
	readdir,
	realpath,
	rename,
	rm,
	stat,
	utimes,
	writeFile,
} from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
	CURRENT_FILE_NAME,
	DEPLOYMENT_MUTATION_LOCK_NAME,
	DEPLOY_DIRECTORY_NAME,
	RELEASES_DIRECTORY_NAME,
	STAGING_DIRECTORY_NAME,
} from './constants.mjs';

const BUILD_ID_PATTERN = /^[0-9a-f]{7}$/iu;
const OPERATION_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RELEASE_ID_PATTERN =
	/^[0-9a-f]{7}-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const LOCK_HEARTBEAT_INTERVAL_MS = 10_000;
const LOCK_INVALID_GRACE_MS = 1000;
const LOCK_LEASE_MS = 300_000;
const LOCK_POLL_INTERVAL_MS = 50;
const LOCK_TIMEOUT_MS = 30_000;
const TRANSIENT_FILE_SYSTEM_RETRY_DELAYS_MS = [100, 250, 500, 1000, 2000];

/**
 * @typedef {{ buildId: string, createdAt: number, release: string }} CurrentRelease
 * @typedef {{
 *   currentFile: string,
 *   deployDirectory: string,
 *   projectRoot: string,
 *   releasesDirectory: string,
 *   stagingDirectory: string,
 * }} DeploymentPaths
 * @typedef {'isDirectory' | 'isFile'} ExpectedPathType
 * @typedef {{ pid: number, token: string }} DeploymentLockOwner
 * @typedef {{
 *   buildId: string,
 *   createdAt?: number,
 *   operationId: string,
 *   projectDirectory: string,
 * }} PublishReleaseOptions
 */

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
}

/** @param {unknown} error */
function checkMissingPathError(error) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 'ENOENT'
	);
}

/** @param {unknown} error */
function checkAlreadyExistsError(error) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 'EEXIST'
	);
}

/** @param {unknown} value @returns {value is DeploymentLockOwner} */
function checkDeploymentLockOwner(value) {
	return (
		typeof value === 'object' &&
		value !== null &&
		'pid' in value &&
		typeof value.pid === 'number' &&
		Number.isSafeInteger(value.pid) &&
		value.pid > 0 &&
		'token' in value &&
		typeof value.token === 'string' &&
		OPERATION_ID_PATTERN.test(value.token)
	);
}

/** @param {string} path @param {boolean} [recursive] */
async function removePath(path, recursive = true) {
	await rm(path, { force: true, maxRetries: 5, recursive, retryDelay: 100 });
}

/** @param {number} milliseconds */
async function delay(milliseconds) {
	await new Promise((resolveDelay) => {
		setTimeout(resolveDelay, milliseconds);
	});
}

/** @param {unknown} error */
function checkTransientFileSystemError(error) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		['EBUSY', 'EPERM'].includes(String(error.code))
	);
}

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
export async function retryTransientFileSystemOperation(operation) {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			const retryDelay = TRANSIENT_FILE_SYSTEM_RETRY_DELAYS_MS[attempt];
			if (
				retryDelay === undefined ||
				!checkTransientFileSystemError(error)
			) {
				throw error;
			}
			await delay(retryDelay);
		}
	}
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

/** @param {unknown} buildId */
function validateBuildId(buildId) {
	if (typeof buildId !== 'string' || !BUILD_ID_PATTERN.test(buildId)) {
		throw createError('invalid-build-id');
	}
	return buildId.toLowerCase();
}

/** @param {unknown} operationId */
function validateOperationId(operationId) {
	if (
		typeof operationId !== 'string' ||
		!OPERATION_ID_PATTERN.test(operationId)
	) {
		throw createError('invalid-build-operation-id');
	}
	return operationId.toLowerCase();
}

/** @param {string} buildId @param {string} operationId */
export function createReleaseId(buildId, operationId) {
	return `${validateBuildId(buildId)}-${validateOperationId(operationId)}`;
}

/** @param {unknown} releaseId */
export function validateReleaseId(releaseId) {
	if (typeof releaseId !== 'string' || !RELEASE_ID_PATTERN.test(releaseId)) {
		throw createError('invalid-release-id');
	}
	return releaseId.toLowerCase();
}

/** @param {string} projectDirectory @returns {DeploymentPaths} */
export function getDeploymentPaths(projectDirectory) {
	const projectRoot = resolve(projectDirectory);
	const deployDirectory = join(projectRoot, DEPLOY_DIRECTORY_NAME);
	return {
		currentFile: join(deployDirectory, CURRENT_FILE_NAME),
		deployDirectory,
		projectRoot,
		releasesDirectory: join(deployDirectory, RELEASES_DIRECTORY_NAME),
		stagingDirectory: join(deployDirectory, STAGING_DIRECTORY_NAME),
	};
}

/** @param {string} projectDirectory @param {string} releaseId */
export function resolveReleaseDirectory(projectDirectory, releaseId) {
	const { releasesDirectory } = getDeploymentPaths(projectDirectory);
	const releaseDirectory = resolve(
		releasesDirectory,
		validateReleaseId(releaseId)
	);
	if (!checkPathInside(releasesDirectory, releaseDirectory)) {
		throw createError('release-path-outside-deployment-directory');
	}
	return releaseDirectory;
}

/** @param {string} contents @returns {CurrentRelease} */
export function parseCurrentRelease(contents) {
	try {
		/** @type {unknown} */
		const value = JSON.parse(contents);
		if (
			value === null ||
			typeof value !== 'object' ||
			Array.isArray(value)
		) {
			throw createError('invalid-self-hosted-current');
		}
		const currentValue = /** @type {Record<string, unknown>} */ (value);
		if (
			Object.keys(currentValue).sort().join(',') !==
				'buildId,createdAt,release' ||
			typeof currentValue['createdAt'] !== 'number' ||
			!Number.isSafeInteger(currentValue['createdAt']) ||
			currentValue['createdAt'] < 0
		) {
			throw createError('invalid-self-hosted-current');
		}
		const buildId = validateBuildId(currentValue['buildId']);
		const release = validateReleaseId(currentValue['release']);
		if (!release.startsWith(`${buildId}-`)) {
			throw createError('invalid-self-hosted-current');
		}
		return {
			buildId,
			createdAt: /** @type {number} */ (currentValue['createdAt']),
			release,
		};
	} catch (error) {
		if (
			error instanceof Error &&
			error.message === 'invalid-self-hosted-current'
		) {
			throw error;
		}
		throw createError('invalid-self-hosted-current', error);
	}
}

/** @param {string} projectDirectory @returns {CurrentRelease} */
export function readCurrentRelease(projectDirectory) {
	const { currentFile } = getDeploymentPaths(projectDirectory);
	try {
		return parseCurrentRelease(readFileSync(currentFile, 'utf8'));
	} catch (error) {
		if (checkMissingPathError(error)) {
			throw createError('self-hosted-release-not-published');
		}
		throw error;
	}
}

/**
 * @param {string} path
 * @param {ExpectedPathType} expectedType
 * @param {string} errorCode
 */
async function getPathStatus(path, expectedType, errorCode) {
	try {
		const pathStatus = await stat(path);
		const matchesExpectedType =
			expectedType === 'isFile'
				? pathStatus.isFile()
				: pathStatus.isDirectory();
		if (!matchesExpectedType) {
			throw createError(errorCode);
		}
		return pathStatus;
	} catch (error) {
		if (error instanceof Error && error.message === errorCode) {
			throw error;
		}
		throw createError(errorCode, error);
	}
}

/** @param {string} path @param {string} errorCode */
async function ensureSafeDirectory(path, errorCode) {
	try {
		const pathStatus = await lstat(path);
		if (!pathStatus.isDirectory() || pathStatus.isSymbolicLink()) {
			throw createError(errorCode);
		}
	} catch (error) {
		if (!checkMissingPathError(error)) {
			if (error instanceof Error && error.message === errorCode) {
				throw error;
			}
			throw createError(errorCode, error);
		}
		await mkdir(path);
	}
}

/** @param {DeploymentPaths} paths */
async function ensureDeploymentDirectories(paths) {
	await ensureSafeDirectory(paths.deployDirectory, 'unsafe-deploy-directory');
	await ensureSafeDirectory(
		paths.stagingDirectory,
		'unsafe-staging-directory'
	);
	await ensureSafeDirectory(
		paths.releasesDirectory,
		'unsafe-releases-directory'
	);
}

/** @param {string} lockFile */
async function checkDeploymentLockOwnerActive(lockFile) {
	const lockStatus = await lstat(lockFile);
	if (!lockStatus.isFile() || lockStatus.isSymbolicLink()) {
		throw createError('unsafe-deployment-mutation-lock');
	}
	let owner;
	try {
		owner = JSON.parse(await readFile(lockFile, 'utf8'));
	} catch {
		return Date.now() - lockStatus.mtimeMs <= LOCK_INVALID_GRACE_MS;
	}
	if (!checkDeploymentLockOwner(owner)) {
		return Date.now() - lockStatus.mtimeMs <= LOCK_INVALID_GRACE_MS;
	}
	const leaseActive = Date.now() - lockStatus.mtimeMs <= LOCK_LEASE_MS;
	try {
		process.kill(owner.pid, 0);
		return leaseActive;
	} catch (error) {
		return (
			leaseActive &&
			!(
				typeof error === 'object' &&
				error !== null &&
				'code' in error &&
				error.code === 'ESRCH'
			)
		);
	}
}

/** @param {string} lockFile @param {string} deployDirectory */
async function reclaimStaleDeploymentLock(lockFile, deployDirectory) {
	try {
		if (await checkDeploymentLockOwnerActive(lockFile)) {
			return false;
		}
	} catch (error) {
		if (checkMissingPathError(error)) {
			return true;
		}
		throw error;
	}
	const staleFile = join(
		deployDirectory,
		`.${DEPLOYMENT_MUTATION_LOCK_NAME}.stale.${randomUUID()}`
	);
	try {
		await rename(lockFile, staleFile);
	} catch (error) {
		if (checkMissingPathError(error)) {
			return true;
		}
		throw createError('deployment-mutation-lock-reclaim-failed', error);
	}
	await removePath(staleFile, false).catch(() => {});
	return true;
}

/** @param {string} deployDirectory */
async function acquireDeploymentMutationLock(deployDirectory) {
	const lockFile = join(deployDirectory, DEPLOYMENT_MUTATION_LOCK_NAME);
	const owner = { pid: process.pid, token: randomUUID() };
	const identityFile = join(
		deployDirectory,
		`.${DEPLOYMENT_MUTATION_LOCK_NAME}.candidate.${owner.token}.tmp`
	);
	const deadline = Date.now() + LOCK_TIMEOUT_MS;
	await writeFile(identityFile, `${JSON.stringify(owner)}\n`, {
		encoding: 'utf8',
		flag: 'wx',
		mode: 0o600,
	});
	try {
		while (true) {
			try {
				await link(identityFile, lockFile);
				return { identityFile, lockFile, owner };
			} catch (error) {
				if (!checkAlreadyExistsError(error)) {
					throw createError(
						'deployment-mutation-lock-create-failed',
						error
					);
				}
			}
			if (await reclaimStaleDeploymentLock(lockFile, deployDirectory)) {
				continue;
			}
			if (Date.now() >= deadline) {
				throw createError('deployment-mutation-lock-timeout');
			}
			await delay(LOCK_POLL_INTERVAL_MS);
		}
	} catch (error) {
		await removePath(identityFile, false).catch(() => {});
		throw error;
	}
}

/** @param {{ identityFile: string, lockFile: string, owner: DeploymentLockOwner }} lock */
async function releaseDeploymentMutationLock(lock) {
	let owner;
	try {
		owner = JSON.parse(await readFile(lock.lockFile, 'utf8'));
	} catch (error) {
		await removePath(lock.identityFile, false).catch(() => {});
		throw createError('deployment-mutation-lock-owner-invalid', error);
	}
	if (
		!checkDeploymentLockOwner(owner) ||
		owner.pid !== lock.owner.pid ||
		owner.token !== lock.owner.token
	) {
		await removePath(lock.identityFile, false).catch(() => {});
		throw createError('deployment-mutation-lock-owner-changed');
	}
	const releasedFile = `${lock.lockFile}.released.${randomUUID()}`;
	await rename(lock.lockFile, releasedFile);
	await Promise.all([
		removePath(releasedFile, false).catch(() => {}),
		removePath(lock.identityFile, false).catch(() => {}),
	]);
}

/**
 * @template T
 * @param {string} projectDirectory
 * @param {() => Promise<T>} callback
 * @param {{ ignoreReleaseError?: boolean }} [options]
 * @returns {Promise<T>}
 */
export async function withDeploymentMutationLock(
	projectDirectory,
	callback,
	options = {}
) {
	const { deployDirectory } = getDeploymentPaths(projectDirectory);
	await ensureSafeDirectory(deployDirectory, 'unsafe-deploy-directory');
	const lock = await acquireDeploymentMutationLock(deployDirectory);
	/** @type {unknown} */
	let callbackError;
	/** @type {T | undefined} */
	let result;
	const heartbeat = setInterval(() => {
		void utimes(lock.identityFile, new Date(), new Date()).catch(() => {});
	}, LOCK_HEARTBEAT_INTERVAL_MS);
	heartbeat.unref();
	try {
		result = await callback();
	} catch (error) {
		callbackError = error;
	}
	clearInterval(heartbeat);
	try {
		await releaseDeploymentMutationLock(lock);
	} catch (error) {
		if (callbackError === undefined && !options.ignoreReleaseError) {
			throw error;
		}
	}
	if (callbackError !== undefined) {
		throw callbackError;
	}
	return /** @type {T} */ (result);
}

/** @param {string} releaseDirectory @param {string} modulePath */
function checkResolvedModuleInsideRelease(releaseDirectory, modulePath) {
	if (!checkPathInside(releaseDirectory, resolve(modulePath))) {
		throw createError('release-module-outside-release-directory');
	}
}

/** @param {string} releaseDirectory @param {string} buildId */
async function validatePublishedRelease(releaseDirectory, buildId) {
	const serverPath = join(releaseDirectory, 'server.js');
	await getPathStatus(serverPath, 'isFile', 'release-server-not-found');
	await getPathStatus(
		join(releaseDirectory, '.next', 'server'),
		'isDirectory',
		'release-next-server-not-found'
	);
	await getPathStatus(
		join(releaseDirectory, '.next', 'static'),
		'isDirectory',
		'release-next-static-not-found'
	);
	await getPathStatus(
		join(releaseDirectory, 'public', 'serviceWorker.js'),
		'isFile',
		'release-service-worker-not-found'
	);
	await getPathStatus(
		join(releaseDirectory, 'public', 'registerServiceWorker.js'),
		'isFile',
		'release-service-worker-registration-not-found'
	);
	let releaseBuildId;
	try {
		const releaseBuildIdContents = await readFile(
			join(releaseDirectory, '.next', 'BUILD_ID'),
			'utf8'
		);
		releaseBuildId = validateBuildId(releaseBuildIdContents.trim());
	} catch (error) {
		throw createError('release-build-id-invalid', error);
	}
	if (releaseBuildId !== buildId) {
		throw createError('release-build-id-mismatch');
	}
	const releaseRequire = createRequire(serverPath);
	for (const packageName of ['next', '@next/env']) {
		let modulePath;
		try {
			modulePath = releaseRequire.resolve(packageName);
		} catch (error) {
			throw createError('release-module-not-resolvable', error);
		}
		checkResolvedModuleInsideRelease(releaseDirectory, modulePath);
	}
}

/** @param {string} entryName */
function checkExcludedStandaloneRootEntry(entryName) {
	const normalizedEntryName = entryName.toLowerCase();
	return (
		normalizedEntryName.startsWith('.env') ||
		normalizedEntryName.startsWith('sqlite.db') ||
		['.deploy', '.git', 'upload'].includes(normalizedEntryName)
	);
}

/** @param {string} sourceDirectory @param {string} targetDirectory */
async function copyDirectoryContents(sourceDirectory, targetDirectory) {
	for (const entry of await readdir(sourceDirectory)) {
		if (checkExcludedStandaloneRootEntry(entry)) {
			continue;
		}
		await retryTransientFileSystemOperation(
			async () =>
				await cp(
					join(sourceDirectory, entry),
					join(targetDirectory, entry),
					{
						errorOnExist: false,
						force: true,
						recursive: true,
						verbatimSymlinks: true,
					}
				)
		);
	}
}

/** @param {string} releaseDirectory */
export async function validateReleaseSymbolicLinks(releaseDirectory) {
	const releaseRoot = resolve(releaseDirectory);
	const releaseStatus = await lstat(releaseRoot);
	if (!releaseStatus.isDirectory() || releaseStatus.isSymbolicLink()) {
		throw createError('release-directory-invalid');
	}
	const realReleaseRoot = await realpath(releaseRoot);
	/** @param {string} directory */
	const validateDirectory = async (directory) => {
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			const entryPath = join(directory, entry.name);
			if (entry.isSymbolicLink()) {
				let realTarget;
				try {
					realTarget = await realpath(entryPath);
				} catch (error) {
					throw createError('release-symbolic-link-invalid', error);
				}
				if (!checkPathInside(realReleaseRoot, realTarget)) {
					throw createError('release-symbolic-link-outside-release');
				}
				continue;
			}
			if (entry.isDirectory()) {
				await validateDirectory(entryPath);
			}
		}
	};
	await validateDirectory(releaseRoot);
}

/** @param {string} tempFile @param {string} currentFile */
async function replaceCurrentFile(tempFile, currentFile) {
	await retryTransientFileSystemOperation(
		async () => await rename(tempFile, currentFile)
	);
}

/** @param {string} projectDirectory @param {CurrentRelease} current */
export async function writeCurrentRelease(projectDirectory, current) {
	const normalizedCurrent = parseCurrentRelease(JSON.stringify(current));
	const { currentFile, deployDirectory } =
		getDeploymentPaths(projectDirectory);
	await ensureSafeDirectory(deployDirectory, 'unsafe-deploy-directory');
	const tempFile = join(deployDirectory, `.current.${randomUUID()}.json.tmp`);
	/** @type {import('node:fs/promises').FileHandle | null} */
	let fileHandle = null;
	try {
		fileHandle = await open(tempFile, 'wx', 0o600);
		await fileHandle.writeFile(
			`${JSON.stringify(normalizedCurrent, null, 2)}\n`,
			{ encoding: 'utf8' }
		);
		await fileHandle.sync();
		await fileHandle.close();
		fileHandle = null;
		await replaceCurrentFile(tempFile, currentFile);
	} finally {
		await fileHandle?.close().catch(() => {});
		await rm(tempFile, { force: true }).catch(() => {});
	}
}

/** @param {PublishReleaseOptions} options */
export async function publishRelease({
	buildId,
	createdAt = Date.now(),
	operationId,
	projectDirectory,
}) {
	const normalizedBuildId = validateBuildId(buildId);
	const release = createReleaseId(normalizedBuildId, operationId);
	const current = parseCurrentRelease(
		JSON.stringify({ buildId: normalizedBuildId, createdAt, release })
	);
	const paths = getDeploymentPaths(projectDirectory);
	const standaloneDirectory = join(paths.projectRoot, '.next', 'standalone');
	const staticDirectory = join(paths.projectRoot, '.next', 'static');
	const publicDirectory = join(paths.projectRoot, 'public');
	await getPathStatus(
		standaloneDirectory,
		'isDirectory',
		'self-hosted-standalone-not-found'
	);
	await getPathStatus(
		staticDirectory,
		'isDirectory',
		'self-hosted-static-not-found'
	);
	await getPathStatus(
		publicDirectory,
		'isDirectory',
		'self-hosted-public-not-found'
	);
	await ensureDeploymentDirectories(paths);
	const stagingRelease = join(paths.stagingDirectory, release);
	const finalRelease = resolveReleaseDirectory(paths.projectRoot, release);
	let stagingCreated = false;
	try {
		await mkdir(stagingRelease);
		stagingCreated = true;
		await copyDirectoryContents(standaloneDirectory, stagingRelease);
		await retryTransientFileSystemOperation(
			async () =>
				await cp(
					staticDirectory,
					join(stagingRelease, '.next', 'static'),
					{
						errorOnExist: false,
						force: true,
						recursive: true,
						verbatimSymlinks: true,
					}
				)
		);
		await retryTransientFileSystemOperation(
			async () =>
				await cp(publicDirectory, join(stagingRelease, 'public'), {
					errorOnExist: false,
					force: true,
					recursive: true,
					verbatimSymlinks: true,
				})
		);
		await retryTransientFileSystemOperation(
			async () => await validateReleaseSymbolicLinks(stagingRelease)
		);
		await retryTransientFileSystemOperation(
			async () =>
				await validatePublishedRelease(
					stagingRelease,
					normalizedBuildId
				)
		);
		await withDeploymentMutationLock(
			paths.projectRoot,
			async () => {
				await retryTransientFileSystemOperation(
					async () => await rename(stagingRelease, finalRelease)
				);
				stagingCreated = false;
				try {
					await writeCurrentRelease(paths.projectRoot, current);
				} catch (error) {
					await removePath(finalRelease).catch(() => {});
					throw error;
				}
			},
			{ ignoreReleaseError: true }
		);
		return current;
	} finally {
		if (stagingCreated) {
			await removePath(stagingRelease).catch(() => {});
		}
	}
}

/** @param {string} path @param {string} errorCode */
async function validateDeploymentDirectory(path, errorCode) {
	const pathStatus = await lstat(path);
	if (!pathStatus.isDirectory() || pathStatus.isSymbolicLink()) {
		throw createError(errorCode);
	}
}

/** @param {string} projectDirectory @param {string} currentReleaseId */
export async function validateCurrentReleaseDirectory(
	projectDirectory,
	currentReleaseId
) {
	const currentRelease = validateReleaseId(currentReleaseId);
	const paths = getDeploymentPaths(projectDirectory);
	await validateDeploymentDirectory(
		paths.deployDirectory,
		'unsafe-deploy-directory'
	);
	await validateDeploymentDirectory(
		paths.releasesDirectory,
		'unsafe-releases-directory'
	);
	const currentReleaseDirectory = resolveReleaseDirectory(
		paths.projectRoot,
		currentRelease
	);
	await validateDeploymentDirectory(
		currentReleaseDirectory,
		'current-release-directory-invalid'
	);
	return currentReleaseDirectory;
}

/** @param {string} projectDirectory @param {string} currentReleaseId */
export async function cleanupObsoleteReleases(
	projectDirectory,
	currentReleaseId
) {
	const currentRelease = validateReleaseId(currentReleaseId);
	const paths = getDeploymentPaths(projectDirectory);
	return withDeploymentMutationLock(paths.projectRoot, async () => {
		const latestCurrent = readCurrentRelease(paths.projectRoot);
		if (latestCurrent.release !== currentRelease) {
			return false;
		}
		await validateCurrentReleaseDirectory(
			paths.projectRoot,
			currentRelease
		);
		for (const entry of await readdir(paths.releasesDirectory, {
			withFileTypes: true,
		})) {
			if (entry.name === currentRelease) {
				continue;
			}
			const entryPath = resolve(paths.releasesDirectory, entry.name);
			if (!checkPathInside(paths.releasesDirectory, entryPath)) {
				throw createError('obsolete-release-path-outside-releases');
			}
			await removePath(entryPath, entry.isDirectory());
		}
		return true;
	});
}

/**
 * @param {string} path
 * @param {ExpectedPathType} expectedType
 * @param {string} errorCode
 * @param {number} [accessMode]
 */
export async function validatePathAccess(
	path,
	expectedType,
	errorCode,
	accessMode = fileSystemConstants.R_OK | fileSystemConstants.W_OK
) {
	await getPathStatus(path, expectedType, errorCode);
	try {
		await access(path, accessMode);
	} catch (error) {
		throw createError(errorCode, error);
	}
}
