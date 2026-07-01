import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parsePositiveIntegerId(value: string) {
	if (!/^\d+$/u.test(value)) {
		return null;
	}

	const parsedValue = Number.parseInt(value, 10);

	return Number.isSafeInteger(parsedValue) && parsedValue >= 1
		? parsedValue
		: null;
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const callbackId = parsePositiveIntegerId(id);
	if (callbackId === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const check = await checkAdminSsoClientRequest(
		request,
		'admin-discard-sso-callback-queue-item',
		{ csrf: true, parts: [{ name: 'callback', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoCallbackService');
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
