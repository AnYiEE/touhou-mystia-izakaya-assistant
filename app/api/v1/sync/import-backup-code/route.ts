import { type NextRequest } from 'next/server';
import { validate } from 'uuid';

import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';
import { type TImportLegacyBackupUseCaseResult } from '@/features/account/sync/server/importLegacyBackupUseCase';

import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody {
	code: string;
}

function createImportBackupResponse(result: TImportLegacyBackupUseCaseResult) {
	if (result.status === 'ok') {
		return createNoStoreJsonResponse({ results: result.results });
	}
	if (result.error === 'sync-account-capacity-exceeded') {
		return createNoStoreErrorResponse(
			'sync-account-capacity-exceeded',
			409,
			{
				candidate_bytes: result.details.candidateBytes,
				current_bytes: result.details.currentBytes,
				limit_bytes: result.details.limitBytes,
				namespaces: result.details.namespaces,
			}
		);
	}
	switch (result.error) {
		case 'state-epoch-mismatch':
		case 'sync-generation-mismatch':
		case 'sync-paused':
			return createNoStoreErrorResponse(result.error, 409, {
				state_epoch: result.state.stateEpoch,
				sync_generation: result.state.syncGeneration,
				sync_status: result.state.syncStatus,
			});
		case 'unauthorized':
			return createNoStoreErrorResponse('unauthorized', 401);
		case 'backup-code-not-found':
			return createNoStoreErrorResponse('backup-code-not-found', 404);
		case 'invalid-backup-file':
			return createNoStoreErrorResponse('invalid-backup-file', 400);
		case 'server-misconfigured':
			return createNoStoreErrorResponse('server-misconfigured', 500);
		case 'sync-conflict':
			return createNoStoreErrorResponse('sync-conflict', 409);
		case 'backup-code-lock-lost':
			return createNoStoreErrorResponse('backup-code-lock-lost', 409);
		case 'backup-code-lock-timeout':
			return createNoStoreErrorResponse('backup-code-lock-timeout', 409);
	}
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

	const [authModule, csrfModule, importModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
		import('@/features/account/sync/server/importLegacyBackupUseCase'),
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

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const result = await importModule.importLegacyBackupUseCase({
		code,
		request,
		session: auth.data.session,
		user: auth.data.user,
	});

	return createImportBackupResponse(result);
}
