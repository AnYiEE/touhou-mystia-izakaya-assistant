import { type NextRequest } from 'next/server';

import { checkAdminSsoClientRequest } from '@/lib/account/server/adminSsoClientRouteResponses';
import { getRequestAuditContext } from '@/lib/account/server/request';
import { MAX_ACCOUNT_JSON_BODY_BYTES } from '@/lib/account/shared/requestLimits';
import type { TAdminSsoTicketStatus } from '@/lib/account/shared/types';
import { parsePositiveIntegerParam } from '@/lib/api/adminPagination';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
	readJsonBodyResult,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE = 10_000;
const MAX_PAGE_SIZE = 100;

type TTicketMutationMode = 'cleanup-expired' | 'revoke-client' | 'revoke-user';

interface ITicketMutationBody {
	expired_at?: number;
	mode: TTicketMutationMode;
	reason?: string;
}

function getTrimmedSearchParam(request: NextRequest, name: string) {
	const value = request.nextUrl.searchParams.get(name)?.trim();

	return value === undefined || value === '' ? undefined : value;
}

function parseTicketStatus(value: string | undefined) {
	if (value === undefined) {
		return;
	}

	return ['expired', 'pending', 'revoked', 'used'].includes(value)
		? (value as TAdminSsoTicketStatus)
		: null;
}

function parseTicketMutationBody(value: unknown): ITicketMutationBody | null {
	if (value === null || typeof value !== 'object') {
		return null;
	}

	const expiredAt = Object.getOwnPropertyDescriptor(value, 'expired_at')
		?.value as unknown;
	const mode = Object.getOwnPropertyDescriptor(value, 'mode')
		?.value as unknown;
	const reason = Object.getOwnPropertyDescriptor(value, 'reason')
		?.value as unknown;
	if (
		mode !== 'cleanup-expired' &&
		mode !== 'revoke-client' &&
		mode !== 'revoke-user'
	) {
		return null;
	}
	if (
		expiredAt !== undefined &&
		(typeof expiredAt !== 'number' ||
			!Number.isSafeInteger(expiredAt) ||
			expiredAt < 0)
	) {
		return null;
	}
	if (reason !== undefined && typeof reason !== 'string') {
		return null;
	}

	return {
		mode,
		...(expiredAt === undefined ? {} : { expired_at: expiredAt }),
		...(reason === undefined ? {} : { reason }),
	};
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-tickets'
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

	const clientId = getTrimmedSearchParam(request, 'client_id');
	const query = getTrimmedSearchParam(request, 'query');
	const status = parseTicketStatus(getTrimmedSearchParam(request, 'status'));
	const userId = getTrimmedSearchParam(request, 'user_id');
	if (status === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoTicketService');
	const result = await serviceModule.listAdminSsoTicketRecords({
		page,
		pageSize,
		...(clientId === undefined ? {} : { clientId }),
		...(query === undefined ? {} : { query }),
		...(status === undefined ? {} : { status }),
		...(userId === undefined ? {} : { userId }),
	});
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_TICKET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}

export async function DELETE(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-mutate-sso-tickets',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult<ITicketMutationBody>(
		request,
		MAX_ACCOUNT_JSON_BODY_BYTES
	);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseTicketMutationBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const serviceModule =
		await import('@/lib/account/server/adminSsoTicketService');
	const clientId = getTrimmedSearchParam(request, 'client_id');
	const userId = getTrimmedSearchParam(request, 'user_id');
	const auditContext = {
		adminId: check.auth.actorId,
		...getRequestAuditContext(request),
	};
	const result =
		body.mode === 'cleanup-expired'
			? await serviceModule.cleanupAdminExpiredSsoTickets(
					body.expired_at,
					auditContext
				)
			: body.mode === 'revoke-client' && clientId !== undefined
				? await serviceModule.revokeAdminSsoTicketsForClient(clientId, {
						...auditContext,
						...(body.reason === undefined
							? {}
							: { reason: body.reason }),
					})
				: body.mode === 'revoke-user' && userId !== undefined
					? await serviceModule.revokeAdminSsoTicketsForUser(userId, {
							...auditContext,
							...(body.reason === undefined
								? {}
								: { reason: body.reason }),
						})
					: ({
							error: 'invalid-object-structure',
							status: 'error',
						} as const);
	if (result.status === 'error') {
		return createNoStoreErrorResponse(
			result.error,
			serviceModule.ADMIN_SSO_TICKET_SERVICE_ERROR_STATUS_MAP[
				result.error
			]
		);
	}

	return createNoStoreJsonResponse(result.data);
}
