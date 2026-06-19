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

interface IUpdateSecretBody {
	disabled?: boolean;
	label?: string | null;
}

function parseUpdateSecretBody(value: unknown): IUpdateSecretBody | null {
	if (value === null || value === undefined) {
		return {};
	}
	if (typeof value !== 'object') {
		return null;
	}

	const disabled = Object.getOwnPropertyDescriptor(value, 'disabled')
		?.value as unknown;
	const label = Object.getOwnPropertyDescriptor(value, 'label')
		?.value as unknown;
	if (disabled !== undefined && typeof disabled !== 'boolean') {
		return null;
	}
	if (label !== undefined && label !== null && typeof label !== 'string') {
		return null;
	}

	return {
		...(disabled === undefined ? {} : { disabled }),
		...(label === undefined ? {} : { label }),
	};
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; secretId: string }> }
) {
	const { id, secretId } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-update-sso-client-secret',
		{
			csrf: true,
			parts: [
				{ name: 'client', value: id },
				{ name: 'secret', value: secretId },
			],
		}
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<IUpdateSecretBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseUpdateSecretBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientSecretService');
	const result = await serviceModule.updateAdminSsoClientSecret(
		id,
		secretId,
		{
			adminId: check.auth.payload.username,
			...body,
			...getRequestAuditContext(request),
		}
	);
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

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; secretId: string }> }
) {
	const { id, secretId } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-revoke-sso-client-secret',
		{
			csrf: true,
			parts: [
				{ name: 'client', value: id },
				{ name: 'secret', value: secretId },
			],
		}
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoClientSecretService');
	const result = await serviceModule.revokeAdminSsoClientSecret(
		id,
		secretId,
		{
			adminId: check.auth.payload.username,
			...getRequestAuditContext(request),
		}
	);
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
