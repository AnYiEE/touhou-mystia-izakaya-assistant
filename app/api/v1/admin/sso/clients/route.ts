import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { parseAdminSsoClientCreateBody } from '@/lib/account/server/adminSsoClientPayload';
import {
	ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP,
	createAdminSsoClient,
} from '@/lib/account/server/adminSsoClientService';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-clients'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const clients = await ssoModule.listSsoClients();

	return createNoStoreJsonResponse({
		clients: clients.map(ssoModule.createSsoClientPublicProfile),
	});
}

export async function POST(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-create-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = parseAdminSsoClientCreateBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const result = await createAdminSsoClient(body);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data, 201);
}
