import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';
import { createFeatureAccessAdminResultResponse } from '@/features/featureAccess/admin/server/http';
import {
	checkAdminFeatureGroupBody,
	deleteAdminFeatureGroup,
	getAdminFeatureGroup,
	updateAdminFeatureGroup,
} from '@/features/featureAccess/admin/server/service';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IGroupRouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(
	request: NextRequest,
	{ params }: IGroupRouteContext
) {
	const { id } = await params;
	const guard = await checkAdminRequest(
		request,
		'admin-feature-group-detail',
		{ parts: [{ name: 'group', value: id }] }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	return createFeatureAccessAdminResultResponse(
		await getAdminFeatureGroup(id)
	);
}

export async function PATCH(
	request: NextRequest,
	{ params }: IGroupRouteContext
) {
	const { id } = await params;
	const guard = await checkAdminRequest(
		request,
		'admin-feature-group-update',
		{ csrf: true, parts: [{ name: 'group', value: id }] }
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
		await updateAdminFeatureGroup({
			adminId: guard.auth.actorId,
			body,
			id,
			request,
		})
	);
}

export async function DELETE(
	request: NextRequest,
	{ params }: IGroupRouteContext
) {
	const { id } = await params;
	const guard = await checkAdminRequest(
		request,
		'admin-feature-group-delete',
		{ csrf: true, parts: [{ name: 'group', value: id }] }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	return createFeatureAccessAdminResultResponse(
		await deleteAdminFeatureGroup({
			adminId: guard.auth.actorId,
			id,
			request,
		})
	);
}
