import { randomUUID } from 'node:crypto';
import { cp, mkdir, open, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';

import {
	removeDeploymentPath,
	retryTransientFileSystemOperation,
	withDeploymentMutationLock,
} from './mutationLock.mjs';
import {
	createReleaseId,
	ensureSafeDirectory,
	getDeploymentPaths,
	getPathStatus,
	parseCurrentRelease,
	resolveReleaseDirectory,
	validateBuildId,
} from './releasePaths.mjs';
import {
	validatePublishedRelease,
	validateReleaseSymbolicLinks,
} from './releaseValidation.mjs';

/**
 * @typedef {{ buildId: string, createdAt: number, release: string }} CurrentRelease
 * @typedef {{
 *   currentFile: string,
 *   deployDirectory: string,
 *   projectRoot: string,
 *   releasesDirectory: string,
 *   stagingDirectory: string,
 * }} DeploymentPaths
 * @typedef {{
 *   buildId: string,
 *   createdAt?: number,
 *   operationId: string,
 *   projectDirectory: string,
 * }} PublishReleaseOptions
 */

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

/** @param {string} tempFile @param {string} currentFile */
async function replaceCurrentFile(tempFile, currentFile) {
	await retryTransientFileSystemOperation(
		async () => await rename(tempFile, currentFile)
	);
}

/** @param {string} projectDirectory @param {CurrentRelease} current */
async function writeCurrentRelease(projectDirectory, current) {
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
					await removeDeploymentPath(finalRelease).catch(() => {});
					throw error;
				}
			},
			{ ignoreReleaseError: true }
		);
		return current;
	} finally {
		if (stagingCreated) {
			await removeDeploymentPath(stagingRelease).catch(() => {});
		}
	}
}
