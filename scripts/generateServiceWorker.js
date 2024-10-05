// @ts-check
/// <reference lib="ESNext" />
/* eslint-disable @typescript-eslint/no-require-imports, unicorn/prefer-module */
'use strict';

const {readFileSync, writeFileSync} = require('node:fs');
const {resolve} = require('node:path');

const {getSha} = require('./utils');
const sha = getSha();

const registerTemplate = readFileSync(resolve(__dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = readFileSync(resolve(__dirname, 'serviceWorker-template.js'), 'utf8');

const slot = '{{version}}';
const registerResult = registerTemplate.replaceAll(slot, sha);
const swResult = swTemplate.replaceAll(slot, sha);

const publicPath = resolve(__dirname, '../public');
writeFileSync(resolve(publicPath, 'registerServiceWorker.js'), registerResult, 'utf8');
writeFileSync(resolve(publicPath, 'serviceWorker.js'), swResult, 'utf8');
