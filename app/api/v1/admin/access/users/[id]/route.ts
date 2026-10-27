import { type NextRequest } from 'next/server';

import type { IAdminFeatureAccessUserUpdateBody } from '@/features/featureAccess/contracts';
import {
	checkAdminFeatureUserUpdateBody,
	getAdminFeatureAccessUser,
	updateAdminFeatureAccessUser,
} from '@/features/featureAccess/admin/server/service';
import { createFeatureAccessAdminResultResponse } from '@/features/featureAccess/admin/server/http';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IUserAccessRouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(
	request: NextRequest,
	{ params }: IUserAccessRouteContext
) {
	const { id } = await params;
	const guard = await checkAdminRequest(
		request,
		'admin-feature-user-detail',
		{ parts: [{ name: 'user', value: id }] }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	return createFeatureAccessAdminResultResponse(
		await getAdminFeatureAccessUser(id)
	);
}

export async function PUT(
	request: NextRequest,
	{ params }: IUserAccessRouteContext
) {
	const { id } = await params;
	const guard = await checkAdminRequest(
		request,
		'admin-feature-user-update',
		{ csrf: true, parts: [{ name: 'user', value: id }] }
	);
	if (guard.status === 'error') {
		return guard.response;
	}

	const bodyResult = await readJsonBodyResult<
		Partial<IAdminFeatureAccessUserUpdateBody>
	>(request, MAX_ACCOUNT_JSON_BODY_BYTES);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}
	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	if (!checkAdminFeatureUserUpdateBody(body)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.invalidObjectStructure,
			400
		);
	}

	return createFeatureAccessAdminResultResponse(
		await updateAdminFeatureAccessUser({
			adminId: guard.auth.actorId,
			body,
			request,
			userId: id,
		})
	);
}
