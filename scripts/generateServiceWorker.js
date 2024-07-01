/* eslint-disable require-unicode-regexp, @typescript-eslint/no-var-requires, unicorn/prefer-module, unicorn/prefer-string-replace-all */
const execSync = require('node:child_process').execSync;
const fs = require('node:fs');
const path = require('node:path');

const sha = (
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? execSync('git rev-parse --short HEAD').toString('utf8')
).trim();

const registerTemplate = fs.readFileSync(path.resolve(__dirname, 'registerServiceWorker-template.js'), 'utf8');
const swTemplate = fs.readFileSync(path.resolve(__dirname, 'serviceWorker-template.js'), 'utf8');

const registerResult = registerTemplate.replace(/{{version}}/g, sha);
const swResult = swTemplate.replace(/{{version}}/g, sha);

fs.writeFileSync(path.resolve(__dirname, '../public', 'registerServiceWorker.js'), registerResult, 'utf8');
fs.writeFileSync(path.resolve(__dirname, '../public', 'serviceWorker.js'), swResult, 'utf8');
