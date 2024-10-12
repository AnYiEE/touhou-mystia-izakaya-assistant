// @ts-check

import dotenv from 'dotenv';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {getSha} from './utils.mjs';

const /** @type {Partial<NodeJS.ProcessEnv> & dotenv.DotenvPopulateInput} */ env = {};
dotenv.config({
	path: ['.env.local', '.env'],
	processEnv: env,
});

const sha = getSha();

const registerTemplate = readFileSync(resolve(import.meta.dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = readFileSync(resolve(import.meta.dirname, 'serviceWorker-template.js'), 'utf8');

const cdnUrlSlot = '{{cdnUrl}}';
const versionSlot = '{{version}}';

const registerResult = registerTemplate.replaceAll(versionSlot, sha);
const swResult = swTemplate.replaceAll(cdnUrlSlot, env.CDN_URL ?? '').replaceAll(versionSlot, sha);

const publicPath = resolve(import.meta.dirname, '../public');
writeFileSync(resolve(publicPath, 'registerServiceWorker.js'), registerResult, 'utf8');
writeFileSync(resolve(publicPath, 'serviceWorker.js'), swResult, 'utf8');
