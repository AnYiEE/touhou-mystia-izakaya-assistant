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
import { ACCOUNT_SYNC_API_RESPONSE_CODE_MAP } from '@/features/account/sync/apiResponseCodes';
import { checkSyncProtocolRequestBody } from '@/features/account/sync/protocol';
import { type TImportLegacyBackupUseCaseResult } from '@/features/account/sync/server/importLegacyBackupUseCase';
import { createSyncClientUpdateRequiredResponse } from '@/features/account/sync/server/protocolResponse';
import type { ISyncProtocolRequest } from '@/features/account/sync/types';

import { SERVER_MISCONFIGURED_MESSAGE } from '@/infrastructure/environment/serverValidation';
import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IImportBackupCodeBody extends ISyncProtocolRequest {
	code: string;
}

function createImportBackupResponse(result: TImportLegacyBackupUseCaseResult) {
	if (result.status === 'ok') {
		return createNoStoreJsonResponse({ results: result.results });
	}
	if (result.error === 'sync-account-capacity-exceeded') {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.accountCapacityExceeded,
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
			return createNoStoreErrorResponse(
				HTTP_API_RESPONSE_CODE_MAP.unauthorized,
				401
			);
		case 'backup-code-not-found':
			return createNoStoreErrorResponse(
				ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.backupCodeNotFound,
				404
			);
		case 'invalid-backup-file':
			return createNoStoreErrorResponse(
				ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.invalidBackupFile,
				400
			);
		case 'server-misconfigured':
			return createNoStoreErrorResponse(
				SERVER_MISCONFIGURED_MESSAGE,
				500
			);
		case 'sync-conflict':
			return createNoStoreErrorResponse(
				ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.conflict,
				409
			);
		case 'backup-code-lock-lost':
			return createNoStoreErrorResponse(
				ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.backupCodeLockLost,
				409
			);
		case 'backup-code-lock-timeout':
			return createNoStoreErrorResponse(
				ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.backupCodeLockTimeout,
				409
			);
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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const rawCode = typeof body?.code === 'string' ? body.code.trim() : '';
	if (rawCode === '' || !validate(rawCode)) {
		return createNoStoreErrorResponse(
			ACCOUNT_SYNC_API_RESPONSE_CODE_MAP.invalidBackupCode,
			400
		);
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
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}
	if (!checkSyncProtocolRequestBody(body)) {
		return createSyncClientUpdateRequiredResponse();
	}

	const result = await importModule.importLegacyBackupUseCase({
		code,
		request,
		session: auth.data.session,
		user: auth.data.user,
	});

	return createImportBackupResponse(result);
}
