import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import {
	type IAdminSsoRevokeBody,
	parseAdminSsoRevokeBody,
} from '@/features/account/sso/admin/server/http/revokePayload';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ clientId: string; userId: string }> }
) {
	const { clientId, userId } = await params;
	const check = await checkAdminRequest(request, 'admin-revoke-sso-grant', {
		csrf: true,
		parts: [
			{ name: 'client', value: clientId },
			{ name: 'target-user', value: userId },
		],
	});
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<IAdminSsoRevokeBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseAdminSsoRevokeBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantService');
	const result = await serviceModule.revokeAdminSsoGrant(clientId, userId, {
		adminId: check.auth.actorId,
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
