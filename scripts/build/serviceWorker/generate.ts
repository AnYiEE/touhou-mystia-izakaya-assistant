import nextEnv from '@next/env';
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
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
	const [registerTemplate, serviceWorkerTemplate] = await Promise.all([
		readFile(registerTemplatePath, encoding),
		readFile(serviceWorkerTemplatePath, encoding),
	]);
	const cdnUrlSlot = '{{cdnUrl}}';
	const versionSlot = '{{version}}';
	const registerResult = registerTemplate.replace(versionSlot, sha);
	const serviceWorkerResult = serviceWorkerTemplate
		.replace(cdnUrlSlot, process.env.CDN_URL ?? '')
		.replace(versionSlot, sha);

	await Promise.all([
		writeFile(registerOutputPath, registerResult, encoding),
		writeFile(serviceWorkerOutputPath, serviceWorkerResult, encoding),
	]);
}
