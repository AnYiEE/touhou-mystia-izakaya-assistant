import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
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
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-sso-client-detail',
		{ parts: [{ name: 'client', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.getAdminSsoClient(id);
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

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-update-sso-client',
		{ csrf: true, parts: [{ name: 'client', value: id }] }
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
	const result = await serviceModule.updateAdminSsoClient(id, body, {
		adminId: check.auth.payload.username,
		...getRequestAuditContext(request),
	});
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
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-delete-sso-client',
		{ csrf: true, parts: [{ name: 'client', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientService');
	const result = await serviceModule.deleteAdminSsoClient(id, {
		adminId: check.auth.payload.username,
		...getRequestAuditContext(request),
	});
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
