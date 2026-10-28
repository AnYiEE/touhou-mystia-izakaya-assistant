import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';
import { createFeatureAccessAdminResultResponse } from '@/features/featureAccess/admin/server/http';
import {
	checkAdminFeatureGroupBody,
	createAdminFeatureGroup,
	listAdminFeatureGroups,
} from '@/features/featureAccess/admin/server/service';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const guard = await checkAdminRequest(request, 'admin-feature-groups');
	if (guard.status === 'error') {
		return guard.response;
	}

	return createNoStoreJsonResponse(await listAdminFeatureGroups());
}

export async function POST(request: NextRequest) {
	const guard = await checkAdminRequest(
		request,
		'admin-feature-group-create',
		{ csrf: true }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	const bodyResult = await readJsonBodyResult<Record<string, unknown>>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (!checkAdminFeatureGroupBody(body)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	return createFeatureAccessAdminResultResponse(
		await createAdminFeatureGroup({
			adminId: guard.auth.actorId,
			body,
			request,
		})
	);
}
