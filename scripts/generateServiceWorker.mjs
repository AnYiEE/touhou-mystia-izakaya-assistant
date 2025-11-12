// @ts-check

import nextEnv from '@next/env';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';

import { getSha } from './utils.mjs';

nextEnv.loadEnvConfig(cwd());

const encoding = 'utf8';
const sha = await getSha();

const registerTemplate = await readFile(
	resolve(import.meta.dirname, 'registerServiceWorker-template.js'),
	encoding
);
const swTemplate = await readFile(
	resolve(import.meta.dirname, 'serviceWorker-template.js'),
	encoding
);

const cdnUrlSlot = '{{cdnUrl}}';
const versionSlot = '{{version}}';

const registerResult = registerTemplate.replaceAll(versionSlot, sha);
const swResult = swTemplate
	.replaceAll(cdnUrlSlot, process.env.CDN_URL ?? '')
	.replaceAll(versionSlot, sha);

const publicPath = resolve(import.meta.dirname, '../public');
await writeFile(
	resolve(publicPath, 'registerServiceWorker.js'),
	registerResult,
	encoding
);
await writeFile(resolve(publicPath, 'serviceWorker.js'), swResult, encoding);
