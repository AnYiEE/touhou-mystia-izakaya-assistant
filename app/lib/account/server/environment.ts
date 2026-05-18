import { access, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

import { checkEnvFlag, checkVercelEnv } from '@/lib/environment';
import { getSqliteDatabasePath } from '@/lib/db/constant';

export const FEATURE_DISABLED_MESSAGE = 'feature-disabled';
export const SERVER_MISCONFIGURED_MESSAGE = 'server-misconfigured';
export const SESSION_SECRET_MIN_BYTE_LENGTH = 32;

export type TAccountFeatureDisabledReason =
	| typeof FEATURE_DISABLED_MESSAGE
	| typeof SERVER_MISCONFIGURED_MESSAGE;

export type IAccountFeatureStatus =
	| { enabled: true; reason: null }
	| { enabled: false; reason: TAccountFeatureDisabledReason };

export function checkAccountRuntimeEnabled() {
	return (
		checkEnvFlag(process.env.SELF_HOSTED) &&
		!checkVercelEnv(process.env.VERCEL) &&
		!checkEnvFlag(process.env.OFFLINE)
	);
}

export function checkSessionSecret(
	secret: string | undefined
): secret is string {
	return (
		typeof secret === 'string' &&
		Buffer.byteLength(secret, 'utf8') >= SESSION_SECRET_MIN_BYTE_LENGTH
	);
}

export async function checkSqliteDirectoryWritable(
	databasePath = process.env.SQLITE_DATABASE_PATH
) {
	const directory = dirname(resolve(getSqliteDatabasePath(databasePath)));
	const probePath = resolve(directory, `.sqlite-write-probe-${randomUUID()}`);

	await access(directory, constants.R_OK | constants.W_OK);
	await writeFile(probePath, 'ok');
	await rm(probePath, { force: true });
}

let accountFeatureStatusPromise: Promise<IAccountFeatureStatus> | null = null;

async function resolveAccountFeatureStatus(): Promise<IAccountFeatureStatus> {
	if (!checkAccountRuntimeEnabled()) {
		return { enabled: false, reason: FEATURE_DISABLED_MESSAGE };
	}

	if (!checkSessionSecret(process.env.SESSION_SECRET)) {
		return { enabled: false, reason: SERVER_MISCONFIGURED_MESSAGE };
	}

	try {
		await checkSqliteDirectoryWritable();
	} catch {
		return { enabled: false, reason: SERVER_MISCONFIGURED_MESSAGE };
	}

	return { enabled: true, reason: null };
}

export function resetAccountFeatureStatusCache() {
	accountFeatureStatusPromise = null;
}

export async function getAccountFeatureStatus(): Promise<IAccountFeatureStatus> {
	accountFeatureStatusPromise ??= resolveAccountFeatureStatus();

	return accountFeatureStatusPromise;
}
