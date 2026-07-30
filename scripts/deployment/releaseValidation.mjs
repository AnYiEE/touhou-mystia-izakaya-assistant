import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

import {
	checkPathInside,
	getDeploymentPaths,
	getPathStatus,
	resolveReleaseDirectory,
	validateBuildId,
	validateReleaseId,
} from './releasePaths.mjs';

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
}

/** @param {string} releaseDirectory @param {string} modulePath */
function checkResolvedModuleInsideRelease(releaseDirectory, modulePath) {
	if (!checkPathInside(releaseDirectory, resolve(modulePath))) {
		throw createError('release-module-outside-release-directory');
	}
}

/** @param {string} releaseDirectory @param {string} buildId */
export async function validatePublishedRelease(releaseDirectory, buildId) {
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
