import lodash from 'lodash';
import { randomUUID } from 'node:crypto';
import {
	link,
	lstat,
	readFile,
	rename,
	rm,
	utimes,
	writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

import {
	DEPLOYMENT_MUTATION_LOCK_NAME,
	DEPLOYMENT_OPERATION_ID_PATTERN,
} from './constants.mjs';
import { ensureSafeDirectory, getDeploymentPaths } from './releasePaths.mjs';

const LOCK_HEARTBEAT_INTERVAL_MS = 10_000;
const LOCK_INVALID_GRACE_MS = 1000;
const LOCK_LEASE_MS = 300_000;
const LOCK_POLL_INTERVAL_MS = 50;
const LOCK_TIMEOUT_MS = 30_000;
const TRANSIENT_FILE_SYSTEM_RETRY_DELAYS_MS = [100, 250, 500, 1000, 2000];

/**
 * @typedef {{ pid: number, token: string }} DeploymentLockOwner
 */

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
}

/** @param {unknown} error */
function checkMissingPathError(error) {
	return lodash.isObject(error) && 'code' in error && error.code === 'ENOENT';
}

/** @param {unknown} error */
function checkAlreadyExistsError(error) {
	return lodash.isObject(error) && 'code' in error && error.code === 'EEXIST';
}

/** @param {unknown} value @returns {value is DeploymentLockOwner} */
function checkDeploymentLockOwner(value) {
	return (
		lodash.isObject(value) &&
		'pid' in value &&
		typeof value.pid === 'number' &&
		Number.isSafeInteger(value.pid) &&
		value.pid > 0 &&
		'token' in value &&
		typeof value.token === 'string' &&
		DEPLOYMENT_OPERATION_ID_PATTERN.test(value.token)
	);
}

/** @param {string} path @param {boolean} [recursive] */
export async function removeDeploymentPath(path, recursive = true) {
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
				lodash.isObject(error) &&
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
	await removeDeploymentPath(staleFile, false).catch(() => {});
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
		await removeDeploymentPath(identityFile, false).catch(() => {});
		throw error;
	}
}

/** @param {{ identityFile: string, lockFile: string, owner: DeploymentLockOwner }} lock */
async function releaseDeploymentMutationLock(lock) {
	let owner;
	try {
		owner = JSON.parse(await readFile(lock.lockFile, 'utf8'));
	} catch (error) {
		await removeDeploymentPath(lock.identityFile, false).catch(() => {});
		throw createError('deployment-mutation-lock-owner-invalid', error);
	}
	if (
		!checkDeploymentLockOwner(owner) ||
		owner.pid !== lock.owner.pid ||
		owner.token !== lock.owner.token
	) {
		await removeDeploymentPath(lock.identityFile, false).catch(() => {});
		throw createError('deployment-mutation-lock-owner-changed');
	}
	const releasedFile = `${lock.lockFile}.released.${randomUUID()}`;
	await rename(lock.lockFile, releasedFile);
	await Promise.all([
		removeDeploymentPath(releasedFile, false).catch(() => {}),
		removeDeploymentPath(lock.identityFile, false).catch(() => {}),
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
