import { checkSqliteDirectoryWritable } from '@/infrastructure/database/sqlite/checkWritable';
import { checkEnvironmentFlag } from '@/infrastructure/environment/flags';
import {
	SERVER_MISCONFIGURED_MESSAGE,
	checkAppSecret,
} from '@/infrastructure/environment/serverValidation';
import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export const FEATURE_DISABLED_MESSAGE = 'feature-disabled';

export type TAccountFeatureDisabledReason =
	| typeof FEATURE_DISABLED_MESSAGE
	| typeof SERVER_MISCONFIGURED_MESSAGE;

export type IAccountFeatureStatus =
	| { enabled: true; reason: null }
	| { enabled: false; reason: TAccountFeatureDisabledReason };

export function checkAccountRuntimeEnabled() {
	return (
		checkEnvironmentFlag(process.env.SELF_HOSTED) &&
		!checkEnvironmentFlag(process.env.VERCEL) &&
		!checkEnvironmentFlag(process.env.OFFLINE)
	);
}

let accountFeatureStatusPromise: Promise<IAccountFeatureStatus> | null = null;

async function resolveAccountFeatureStatus(): Promise<IAccountFeatureStatus> {
	if (!checkAccountRuntimeEnabled()) {
		return { enabled: false, reason: FEATURE_DISABLED_MESSAGE };
	}

	if (!checkAppSecret(process.env.APP_SECRET)) {
		return { enabled: false, reason: SERVER_MISCONFIGURED_MESSAGE };
	}

	try {
		await checkSqliteDirectoryWritable();
	} catch (error) {
		console.warn('SQLite directory writability check failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
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
