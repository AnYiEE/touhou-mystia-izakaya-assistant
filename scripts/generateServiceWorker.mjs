// @ts-check

import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

import {getSha} from './utils.mjs';

const sha = getSha();

const registerTemplate = readFileSync(resolve(import.meta.dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = readFileSync(resolve(import.meta.dirname, 'serviceWorker-template.js'), 'utf8');

const slot = '{{version}}';
const registerResult = registerTemplate.replaceAll(slot, sha);
const swResult = swTemplate.replaceAll(slot, sha);

const publicPath = resolve(import.meta.dirname, '../public');
writeFileSync(resolve(publicPath, 'registerServiceWorker.js'), registerResult, 'utf8');
writeFileSync(resolve(publicPath, 'serviceWorker.js'), swResult, 'utf8');
