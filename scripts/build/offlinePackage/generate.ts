import nextEnv from '@next/env';
import minimist from 'minimist';
import { copyFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv, cwd } from 'node:process';

import { checkEnvironmentFlag } from '../../../app/infrastructure/environment/flags';
import PACKAGE from '../../../package.json';
import { getSha } from '../../shared/git';
import { writeOfflineArchive } from './archive';
import {
	removeIgnoredOfflineOutputFiles,
	scanForbiddenOfflineOutputFiles,
} from './outputValidation';
import { checkOfflinePackagePaths, getOfflinePackagePaths } from './paths';
import {
	prepareOfflineRouterReplacement,
	restoreOfflineRouterReplacement,
} from './routerReplacement';

nextEnv.loadEnvConfig(cwd());

const isOffline = checkEnvironmentFlag(process.env.OFFLINE);
const {
	help: isHelp,
	prepare: isPrepare,
	'restore-only': isRestoreOnly,
	'self-check-paths': isSelfCheckPaths,
} = minimist<{
	help?: boolean;
	prepare?: boolean;
	'restore-only'?: boolean;
	'self-check-paths'?: boolean;
}>(argv.slice(2));

const filesToDelete = [
	'registerServiceWorker.js',
	'robots.txt',
	'serviceWorker.js',
	'sitemap.xml',
] as const;
const filesToRename = ['LICENSE', 'README.md'] as const;
const paths = getOfflinePackagePaths();

async function prepareOfflineFiles() {
	await restoreOfflineRouterReplacement(paths);
	await rm(paths.nextBuildPath, { force: true, recursive: true });
	await rm(paths.outputPath, { force: true, recursive: true });
	await prepareOfflineRouterReplacement(paths);
}

async function packageOfflineFiles() {
	await restoreOfflineRouterReplacement(paths);

	const replaceExtension = (fileName: string) => {
		const fileNameParts = fileName.split('.');
		if (fileNameParts.length > 1) {
			fileNameParts.pop();
		}
		return `${fileNameParts.join('')}.txt`;
	};

	for (const file of filesToDelete) {
		await rm(resolve(paths.outputPath, file), { force: true });
	}

	for (const file of filesToRename) {
		await copyFile(
			resolve(paths.rootPath, file),
			resolve(paths.outputPath, replaceExtension(file))
		);
	}

	await removeIgnoredOfflineOutputFiles(paths.outputPath);

	const forbiddenOutputFiles = await scanForbiddenOfflineOutputFiles(
		paths.outputPath
	);
	if (forbiddenOutputFiles.length > 0) {
		throw new Error(
			`Offline output contains API/admin artifacts:\n${forbiddenOutputFiles.join('\n')}`
		);
	}

	const archiveBaseName = `${PACKAGE.name}_${PACKAGE.version}_${await getSha()}_offline-Windows`;
	await writeOfflineArchive({
		archiveBaseName,
		outputPath: paths.outputPath,
		rootPath: paths.rootPath,
		templatePath: paths.templatePath,
	});
}

if (isPrepare && isRestoreOnly) {
	throw new Error(
		'Offline package options --prepare and --restore-only are mutually exclusive.'
	);
} else if (isSelfCheckPaths) {
	await checkOfflinePackagePaths();
} else if (isHelp) {
	console.log(`Usage:
  pnpm exec tsx scripts/build/offlinePackage/generate.ts [option]

Options:
  --prepare           Prepare ordinary sources for an offline build.
  --restore-only      Restore sources after an interrupted offline build.
  --self-check-paths  Validate and print repository-relative path targets.
  --help              Show this help.

--prepare and --restore-only cannot be combined.`);
} else if (isOffline && isPrepare) {
	await prepareOfflineFiles();
} else if (isOffline && isRestoreOnly) {
	await restoreOfflineRouterReplacement(paths);
} else if (isOffline && !isPrepare && !isRestoreOnly) {
	await packageOfflineFiles();
}
