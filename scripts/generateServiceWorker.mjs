// @ts-check

import dotenv from 'dotenv';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {getSha} from './utils.mjs';

/** @type {Partial<NodeJS.ProcessEnv> & dotenv.DotenvPopulateInput} */
const env = {};

dotenv.config({
	path: ['.env.local', '.env'],
	processEnv: env,
});

const sha = getSha();

const registerTemplate = readFileSync(resolve(import.meta.dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = readFileSync(resolve(import.meta.dirname, 'serviceWorker-template.js'), 'utf8');

const analyticsApiUrlSlot = '{{analyticsApiUrl}}';
const analyticsScriptUrlSlot = '{{analyticsScriptUrl}}';
const cdnUrlSlot = '{{cdnUrl}}';
const shortLinkUrlSlot = '{{shortLinkUrl}}';
const versionSlot = '{{version}}';

const registerResult = registerTemplate.replaceAll(versionSlot, sha);
const swResult = swTemplate
	.replaceAll(analyticsApiUrlSlot, env.ANALYTICS_API_URL ?? '')
	.replaceAll(analyticsScriptUrlSlot, env.ANALYTICS_SCRIPT_URL ?? '')
	.replaceAll(cdnUrlSlot, env.CDN_URL ?? '')
	.replaceAll(shortLinkUrlSlot, env.SHORT_LINK_URL ?? '')
	.replaceAll(versionSlot, sha);

const publicPath = resolve(import.meta.dirname, '../public');
writeFileSync(resolve(publicPath, 'registerServiceWorker.js'), registerResult, 'utf8');
writeFileSync(resolve(publicPath, 'serviceWorker.js'), swResult, 'utf8');
