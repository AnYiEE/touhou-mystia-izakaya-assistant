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

interface ICreateSecretBody {
	label?: string;
}

function parseCreateSecretBody(value: unknown): ICreateSecretBody | null {
	if (value === null || value === undefined) {
		return {};
	}
	if (typeof value !== 'object') {
		return null;
	}

	const label = Object.getOwnPropertyDescriptor(value, 'label')
		?.value as unknown;
	if (label !== undefined && typeof label !== 'string') {
		return null;
	}

	return label === undefined ? {} : { label };
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-client-secrets',
		{ parts: [{ name: 'client', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientSecretService');
	const result = await serviceModule.listAdminSsoClientSecrets(id);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SECRET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-create-sso-client-secret',
		{ csrf: true, parts: [{ name: 'client', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<ICreateSecretBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseCreateSecretBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientSecretService');
	const result = await serviceModule.createAdminSsoClientSecret(id, {
		adminId: check.auth.actorId,
		...getRequestAuditContext(request),
		...(body.label === undefined ? {} : { label: body.label }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CLIENT_SECRET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data, 201);
}
