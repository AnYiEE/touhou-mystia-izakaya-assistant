import nextEnv from '@next/env';
import assert from 'node:assert/strict';
import { access, readFile, readdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { argv, cwd } from 'node:process';

import { getSha } from '../../shared/git';

nextEnv.loadEnvConfig(cwd());

const encoding = 'utf8';
const rootPath = resolve(import.meta.dirname, '../../..');
const publicPath = resolve(rootPath, 'public');
const registerTemplatePath = resolve(
	import.meta.dirname,
	'register-template.js'
);
const serviceWorkerTemplatePath = resolve(
	import.meta.dirname,
	'service-worker-template.js'
);
const registerOutputPath = resolve(publicPath, 'registerServiceWorker.js');
const serviceWorkerOutputPath = resolve(publicPath, 'serviceWorker.js');
const mapAssetsPath = resolve(publicPath, 'assets/maps');
const staticAssetsPath = resolve(publicPath, 'assets');

async function listSubdirectories(path: string) {
	try {
		const entries = await readdir(path, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map(({ name }) => name)
			.sort();
	} catch (error) {
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			return [];
		}
		throw error;
	}
}

/**
 * @description Content-hash directories of the published map assets
 * (`day/<map>/<hash>/`, `characters/<source>/<hash>/`,
 * `facilities/<folder>/<hash>/`, `fishing/<folder>/<hash>/`,
 * `interactions/<folder>/<hash>/`, `prayers/<folder>/<hash>/`,
 * `tasks/<folder>/<hash>/`, `teleports/<folder>/<hash>/`, `world/<hash>/`).
 * The service worker keeps cached map assets inside them and drops the rest.
 */
async function listMapAssetDirectories() {
	const directories: string[] = [];
	for (const map of await listSubdirectories(resolve(mapAssetsPath, 'day'))) {
		for (const hash of await listSubdirectories(
			resolve(mapAssetsPath, 'day', map)
		)) {
			directories.push(`day/${map}/${hash}/`);
		}
	}
	for (const source of await listSubdirectories(
		resolve(mapAssetsPath, 'characters')
	)) {
		for (const hash of await listSubdirectories(
			resolve(mapAssetsPath, 'characters', source)
		)) {
			directories.push(`characters/${source}/${hash}/`);
		}
	}
	for (const kind of [
		'facilities',
		'fishing',
		'interactions',
		'prayers',
		'tasks',
		'teleports',
	]) {
		for (const folder of await listSubdirectories(
			resolve(mapAssetsPath, kind)
		)) {
			for (const hash of await listSubdirectories(
				resolve(mapAssetsPath, kind, folder)
			)) {
				directories.push(`${kind}/${folder}/${hash}/`);
			}
		}
	}
	for (const hash of await listSubdirectories(
		resolve(mapAssetsPath, 'world')
	)) {
		directories.push(`world/${hash}/`);
	}
	return directories;
}

/**
 * Content-hash directories for the small generated/manual static assets.
 * They use a separate persistent cache from maps so a release does not
 * re-download unchanged sprite sheets or tachies.
 */
async function listStaticAssetDirectories() {
	const directories: string[] = [];
	for (const kind of ['sprites', 'tachies']) {
		for (const category of await listSubdirectories(
			resolve(staticAssetsPath, kind)
		)) {
			for (const hash of await listSubdirectories(
				resolve(staticAssetsPath, kind, category)
			)) {
				directories.push(`${kind}/${category}/${hash}/`);
			}
		}
	}
	return directories;
}

function normalizeRelativePath(path: string) {
	return relative(rootPath, path).replaceAll('\\', '/');
}

async function checkServiceWorkerPaths() {
	const expectedPaths = {
		public: resolve(rootPath, 'public'),
		registerOutput: resolve(rootPath, 'public/registerServiceWorker.js'),
		registerTemplate: resolve(
			rootPath,
			'scripts/build/serviceWorker/register-template.js'
		),
		root: rootPath,
		serviceWorkerOutput: resolve(rootPath, 'public/serviceWorker.js'),
		serviceWorkerTemplate: resolve(
			rootPath,
			'scripts/build/serviceWorker/service-worker-template.js'
		),
	};
	const actualPaths = {
		public: publicPath,
		registerOutput: registerOutputPath,
		registerTemplate: registerTemplatePath,
		root: rootPath,
		serviceWorkerOutput: serviceWorkerOutputPath,
		serviceWorkerTemplate: serviceWorkerTemplatePath,
	};

	assert.deepEqual(actualPaths, expectedPaths);
	await Promise.all([
		access(publicPath),
		access(registerTemplatePath),
		access(serviceWorkerTemplatePath),
	]);
	Object.entries(actualPaths).forEach(([name, path]) => {
		console.log(
			`${name}: ${path === rootPath ? '.' : normalizeRelativePath(path)}`
		);
	});
}

if (argv.includes('--self-check-paths')) {
	await checkServiceWorkerPaths();
} else {
	const sha = await getSha();
	const [
		registerTemplate,
		serviceWorkerTemplate,
		mapAssetDirectories,
		staticAssetDirectories,
	] = await Promise.all([
		readFile(registerTemplatePath, encoding),
		readFile(serviceWorkerTemplatePath, encoding),
		listMapAssetDirectories(),
		listStaticAssetDirectories(),
	]);
	const cdnUrlSlot = '{{cdnUrl}}';
	const mapAssetDirectoriesSlot = '{{mapAssetDirectories}}';
	const staticAssetDirectoriesSlot = '{{staticAssetDirectories}}';
	const versionSlot = '{{version}}';
	const registerResult = registerTemplate.replace(versionSlot, sha);
	const serviceWorkerResult = serviceWorkerTemplate
		.replace(cdnUrlSlot, process.env.CDN_URL ?? '')
		.replace(mapAssetDirectoriesSlot, JSON.stringify(mapAssetDirectories))
		.replace(
			staticAssetDirectoriesSlot,
			JSON.stringify(staticAssetDirectories)
		)
		.replace(versionSlot, sha);

	await Promise.all([
		writeFile(registerOutputPath, registerResult, encoding),
		writeFile(serviceWorkerOutputPath, serviceWorkerResult, encoding),
	]);
}
