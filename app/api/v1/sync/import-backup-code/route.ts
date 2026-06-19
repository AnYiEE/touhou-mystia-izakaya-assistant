import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody {
	code: string;
}

function createImportBackupErrorResponse(error: unknown) {
	if (!(error instanceof Error)) {
		return null;
	}

	if (error.message === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (error.message === 'backup-code-not-found') {
		return createNoStoreErrorResponse('backup-code-not-found', 404);
	}
	if (error.message === 'invalid-backup-file') {
		return createNoStoreErrorResponse('invalid-backup-file', 400);
	}
	if (error.message === 'server-misconfigured') {
		return createNoStoreErrorResponse('server-misconfigured', 500);
	}
	if (error.message === 'sync-conflict') {
		return createNoStoreErrorResponse('sync-conflict', 409);
	}
	if (error.message === 'backup-code-lock-lost') {
		return createNoStoreErrorResponse('backup-code-lock-lost', 409);
	}

	return null;
}

export async function POST(request: NextRequest) {
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		'import-backup-code'
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const bodyResult = await readJsonBodyResult<IImportBackupCodeBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const rawCode = typeof body?.code === 'string' ? body.code.trim() : '';
	if (rawCode === '' || !validate(rawCode)) {
		return createNoStoreErrorResponse('invalid-backup-code', 400);
	}
	const code = rawCode.toLowerCase();

	const [authModule, lockModule, backupImportModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/actions/backup/lock'),
		import('@/lib/account/server/backupImport'),
	]);
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		'import-backup-code',
		'',
		{ parts: [{ name: 'backup-code', value: code }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	try {
		let importedBackupFileName: string | null | undefined;
		const response = await lockModule.withBackupCodeLock(
			code,
			async (signal) => {
				let importResult;
				try {
					importResult = await backupImportModule.importBackupData({
						code,
						expectedStateEpoch: auth.data.user.state_epoch,
						lockModule,
						session: auth.data.session,
						signal,
						userId: auth.data.user.id,
					});
				} catch (error) {
					const errorResponse =
						createImportBackupErrorResponse(error);
					if (errorResponse !== null) {
						return errorResponse;
					}
					throw error;
				}
				if (importResult.status === 'not-found') {
					return createNoStoreErrorResponse(
						'backup-code-not-found',
						404
					);
				}
				if (importResult.status === 'state-epoch-mismatch') {
					return createNoStoreErrorResponse(
						'state-epoch-mismatch',
						409,
						{ state_epoch: importResult.state_epoch }
					);
				}
				if (importResult.status === 'already-imported') {
					return createNoStoreJsonResponse({
						results: importResult.results,
					});
				}

				lockModule.markBackupCodeLockCommitted(signal);
				importedBackupFileName = importResult.fileName;

				return createNoStoreJsonResponse({
					results: importResult.results,
				});
			}
		);
		if (importedBackupFileName !== undefined) {
			void backupImportModule.cleanupImportedBackupFile(
				code,
				importedBackupFileName
			);
		}

		return response;
	} catch (error) {
		if (lockModule.checkBackupCodeLockLostError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		}
		if (lockModule.checkBackupCodeLockTimeoutError(error)) {
			return createNoStoreErrorResponse('backup-code-lock-timeout', 409);
		}

		throw error;
	}
}
