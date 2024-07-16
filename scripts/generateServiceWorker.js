// @ts-check
/* eslint-disable require-unicode-regexp, @typescript-eslint/no-var-requires, unicorn/prefer-module, unicorn/prefer-string-replace-all */
'use strict';

const {execSync} = require('node:child_process');
const {readFileSync, writeFileSync} = require('node:fs');
const {resolve} = require('node:path');

const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')
).trim();

const registerTemplate = readFileSync(resolve(__dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = readFileSync(resolve(__dirname, 'serviceWorker-template.js'), 'utf8');

const registerResult = registerTemplate.replace(/{{version}}/g, sha);
const swResult = swTemplate.replace(/{{version}}/g, sha);

writeFileSync(resolve(__dirname, '../public', 'registerServiceWorker.js'), registerResult, 'utf8');
writeFileSync(resolve(__dirname, '../public', 'serviceWorker.js'), swResult, 'utf8');
