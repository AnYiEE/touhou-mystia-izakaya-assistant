import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
	removeDeploymentPath,
	withDeploymentMutationLock,
} from './mutationLock.mjs';
import {
	checkPathInside,
	getDeploymentPaths,
	readCurrentRelease,
	validateReleaseId,
} from './releasePaths.mjs';
import { validateCurrentReleaseDirectory } from './releaseValidation.mjs';

/** @param {string} code @param {unknown} [cause] */
function createError(code, cause) {
	return cause === undefined ? new Error(code) : new Error(code, { cause });
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
			await removeDeploymentPath(entryPath, entry.isDirectory());
		}
		return true;
	});
}
