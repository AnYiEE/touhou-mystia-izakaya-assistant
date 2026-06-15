import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-sso-client-detail'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);
	if (client === null) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	return createNoStoreJsonResponse({
		client: ssoModule.createSsoClientPublicProfile(client),
	});
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-update-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const bodyResult = await readJsonBodyResult(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const payloadModule =
		await import('@/lib/account/server/adminSsoClientPayload');
	const body = payloadModule.parseAdminSsoClientUpdateBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body?.id !== id) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.updateAdminSsoClient(id, body);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-delete-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.deleteAdminSsoClient(id);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
