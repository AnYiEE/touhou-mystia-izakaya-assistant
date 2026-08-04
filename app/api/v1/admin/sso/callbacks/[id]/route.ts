import { type NextRequest } from 'next/server';

import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import { parsePositiveIntegerPathParam } from '@/infrastructure/http/pathParameters';
import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const callbackId = parsePositiveIntegerPathParam(id);
	if (callbackId === null) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	const check = await checkAdminRequest(
		request,
		'admin-discard-sso-callback-queue-item',
		{ csrf: true, parts: [{ name: 'callback', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/features/account/sso/admin/server/services/callbackService');
	const result = await serviceModule.discardAdminSsoCallbackQueueItem(
		callbackId,
		{ adminId: check.auth.actorId, ...getRequestAuditContext(request) }
	);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_CALLBACK_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
