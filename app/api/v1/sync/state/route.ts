import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	createAccountAuthErrorResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	checkSyncNamespace,
	parseSyncStatePutBody,
} from '@/lib/account/sync/validation';
import {
	parseUserStateRecord,
	putSyncStateChanges,
} from '@/lib/account/server/syncState';
import { type ISyncStatePutBody } from '@/lib/account/sync';
import { MAX_SYNC_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';
import { getLogSafeErrorCode } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createCorruptUserStateResponse() {
	return createNoStoreErrorResponse('corrupt-user-state', 500);
}

export async function GET(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const [authModule, userStateModule] = await Promise.all([
		import('@/lib/account/server/auth'),
		import('@/lib/account/server/repositories/userState'),
	]);
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const namespaceParams = request.nextUrl.searchParams.getAll('namespace');
	const namespaces = namespaceParams.filter(checkSyncNamespace);
	if (namespaces.length !== namespaceParams.length) {
		return createNoStoreErrorResponse('unknown-namespace', 400);
	}

	const records =
		namespaces.length === 0
			? await userStateModule.listUserState(auth.data.user.id)
			: await userStateModule.listUserStateByNamespaces(
					auth.data.user.id,
					namespaces
				);

	try {
		return createNoStoreJsonResponse({
			records: records.map(parseUserStateRecord),
			state_epoch: auth.data.user.state_epoch,
		});
	} catch (error) {
		console.warn('Failed to parse stored sync state.', {
			errorCode: getLogSafeErrorCode(error),
		});
		return createCorruptUserStateResponse();
	}
}

export async function PUT(request: NextRequest) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitResponse(
		request,
		'sync-state-put'
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const bodyResult = await readJsonBodyResult<ISyncStatePutBody>(
		request,
		MAX_SYNC_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = parseSyncStatePutBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}
	if (body.state_epoch !== auth.data.user.state_epoch) {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: auth.data.user.state_epoch,
		});
	}

	const writeResult = await putSyncStateChanges({
		body,
		conflictParseMode: 'fail',
		session: auth.data.session,
		userId: auth.data.user.id,
	});
	if (writeResult.status === 'unauthorized') {
		return createNoStoreErrorResponse('unauthorized', 401);
	}
	if (writeResult.status === 'state-epoch-mismatch') {
		return createNoStoreErrorResponse('state-epoch-mismatch', 409, {
			state_epoch: writeResult.state_epoch,
		});
	}
	if (writeResult.status === 'corrupt-user-state') {
		return createCorruptUserStateResponse();
	}

	return createNoStoreJsonResponse({
		results: writeResult.results,
		state_epoch: auth.data.user.state_epoch,
	});
}
