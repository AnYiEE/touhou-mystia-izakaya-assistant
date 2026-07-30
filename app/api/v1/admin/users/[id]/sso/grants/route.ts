import { type NextRequest } from 'next/server';

import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/features/account/requestLimits';
import {
	type IAdminSsoRevokeBody,
	parseAdminSsoRevokeBody,
} from '@/features/account/sso/admin/server/http/revokePayload';
import { checkAdminRequest } from '@/features/admin/server/http/requestGuard';

import {
	getTrimmedSearchParam,
	parsePositiveIntegerParam,
} from '@/infrastructure/http/queryParameters';
import { getRequestAuditContext } from '@/infrastructure/http/server/requestContext';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/infrastructure/http/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminRequest(
		request,
		'admin-list-user-sso-grants',
		{ parts: [{ name: 'target-user', value: id }] }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const page = parsePositiveIntegerParam(
		request.nextUrl.searchParams.get('page'),
		1,
		MAX_PAGE
	);
	const pageSize = parsePositiveIntegerParam(
		request.nextUrl.searchParams.get('page_size'),
		DEFAULT_PAGE_SIZE,
		MAX_PAGE_SIZE
	);
	if (page === null || pageSize === null) {
		return createNoStoreErrorResponse('invalid-pagination', 400);
	}

	const query = getTrimmedSearchParam(request.nextUrl.searchParams, 'query');
	const serviceModule =
		await import('@/features/account/sso/admin/server/services/grantService');
	const result = await serviceModule.listAdminSsoUserGrants(id, {
		page,
		pageSize,
		...(query === undefined ? {} : { query }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_GRANT_SERVICE_ERROR_STATUS_MAP[result.error]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const check = await checkAdminRequest(
		request,
		'admin-revoke-user-sso-grants',
		{ csrf: true, parts: [{ name: 'target-user', value: id }] }
	);
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
	const result = await serviceModule.revokeAdminSsoGrantsForUser(id, {
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
