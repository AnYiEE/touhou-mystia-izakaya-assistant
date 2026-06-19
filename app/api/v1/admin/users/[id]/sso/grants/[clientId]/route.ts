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

interface IRevokeGrantBody {
	reason?: string;
}

function parseRevokeGrantBody(value: unknown): IRevokeGrantBody | null {
	if (value === null || value === undefined) {
		return {};
	}
	if (typeof value !== 'object') {
		return null;
	}

	const reason = Object.getOwnPropertyDescriptor(value, 'reason')
		?.value as unknown;
	if (reason !== undefined && typeof reason !== 'string') {
		return null;
	}

	return reason === undefined ? {} : { reason };
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ clientId: string; id: string }> }
) {
	const { clientId, id } = await params;
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-revoke-user-sso-grant',
		{
			csrf: true,
			parts: [
				{ name: 'target-user', value: id },
				{ name: 'client', value: clientId },
			],
		}
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<IRevokeGrantBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseRevokeGrantBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoGrantService');
	const result = await serviceModule.revokeAdminSsoGrant(clientId, id, {
		adminId: check.auth.payload.username,
		...(body.reason === undefined ? {} : { reason: body.reason }),
		...getRequestAuditContext(request),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_GRANT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
