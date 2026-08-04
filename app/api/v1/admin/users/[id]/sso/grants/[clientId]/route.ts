import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import {
	type IAdminSsoRevokeBody,
	parseAdminSsoRevokeBody,
} from '@/features/account/sso/admin/server/http/revokePayload';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
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
	{ params }: { params: Promise<{ clientId: string; id: string }> }
) {
	const { clientId, id } = await params;
	const check = await checkAdminRequest(
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

	const bodyResult = await readJsonBodyResult<IAdminSsoRevokeBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = parseAdminSsoRevokeBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantService');
	const result = await serviceModule.revokeAdminSsoGrant(clientId, id, {
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
