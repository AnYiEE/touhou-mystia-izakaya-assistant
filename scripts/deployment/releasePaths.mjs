import lodash from 'lodash';
import { constants as fileSystemConstants, readFileSync } from 'node:fs';
import { access, lstat, mkdir, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
	CURRENT_FILE_NAME,
	DEPLOYMENT_OPERATION_ID_PATTERN,
	DEPLOY_DIRECTORY_NAME,
	RELEASES_DIRECTORY_NAME,
	STAGING_DIRECTORY_NAME,
} from './constants.mjs';

const BUILD_ID_PATTERN = /^[0-9a-f]{7}$/iu;
const RELEASE_ID_PATTERN =
	/^[0-9a-f]{7}-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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
 */

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
}

/** @param {unknown} error */
function checkMissingPathError(error) {
	return lodash.isObject(error) && 'code' in error && error.code === 'ENOENT';
}

/** @param {string} parentDirectory @param {string} candidatePath */
export function checkPathInside(parentDirectory, candidatePath) {
	const relativePath = relative(parentDirectory, candidatePath);
	return (
		relativePath !== '' &&
		!relativePath.startsWith(`..${sep}`) &&
		relativePath !== '..' &&
		!isAbsolute(relativePath)
	);
}

/** @param {unknown} buildId */
export function validateBuildId(buildId) {
	if (typeof buildId !== 'string' || !BUILD_ID_PATTERN.test(buildId)) {
		throw createError('invalid-build-id');
	}
	return buildId.toLowerCase();
}

/** @param {unknown} operationId */
function validateOperationId(operationId) {
	if (
		typeof operationId !== 'string' ||
		!DEPLOYMENT_OPERATION_ID_PATTERN.test(operationId)
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
		if (!lodash.isObject(value) || Array.isArray(value)) {
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
			Error.isError(error) &&
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
export async function getPathStatus(path, expectedType, errorCode) {
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
		if (Error.isError(error) && error.message === errorCode) {
			throw error;
		}
		throw createError(errorCode, error);
	}
}

/** @param {string} path @param {string} errorCode */
export async function ensureSafeDirectory(path, errorCode) {
	try {
		const pathStatus = await lstat(path);
		if (!pathStatus.isDirectory() || pathStatus.isSymbolicLink()) {
			throw createError(errorCode);
		}
	} catch (error) {
		if (!checkMissingPathError(error)) {
			if (Error.isError(error) && error.message === errorCode) {
				throw error;
			}
			throw createError(errorCode, error);
		}
		await mkdir(path);
	}
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
