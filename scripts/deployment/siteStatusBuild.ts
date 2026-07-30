import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { getLogSafeErrorCode } from '../../app/infrastructure/logging/errorCode';
import { DEPLOYMENT_OPERATION_ID_PATTERN } from './constants.mjs';

export const DEPLOYMENT_MAINTENANCE_TTL_MS = 90 * 60 * 1000;

const SITE_STATUS_BUILD_IDENTITY_FILE_NAME = '.site-status-build-operation-id';

function validateOperationId(operationId: string) {
	if (!DEPLOYMENT_OPERATION_ID_PATTERN.test(operationId)) {
		throw new Error('invalid-site-status-build-operation-id');
	}
	return operationId;
}

function getBuildIdentityPath(projectDirectory: string) {
	return resolve(projectDirectory, SITE_STATUS_BUILD_IDENTITY_FILE_NAME);
}

export function readSiteStatusBuildIdentity(projectDirectory: string) {
	try {
		return validateOperationId(
			readFileSync(getBuildIdentityPath(projectDirectory), 'utf8').trim()
		);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			return null;
		}
		throw error;
	}
}

export function writeSiteStatusBuildIdentity(
	projectDirectory: string,
	operationId: string
) {
	const path = getBuildIdentityPath(projectDirectory);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, validateOperationId(operationId), {
		encoding: 'utf8',
		mode: 0o600,
	});
}

export function clearSiteStatusBuildIdentity(projectDirectory: string) {
	try {
		rmSync(getBuildIdentityPath(projectDirectory), { force: true });
	} catch (error) {
		console.warn('Site status build identity cleanup failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}
}
