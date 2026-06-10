import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityResponse,
	checkAccountFeatureResponse,
	checkAccountRateLimitResponse,
	checkSameOriginResponse,
	readJsonBodyResult,
} from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	authenticateAdminRequest,
	checkAdminCsrfResponse,
	checkAdminFeatureResponse,
	createAdminAuthErrorResponse,
} from '@/api/v1/admin/utils';
import { parseAdminSsoClientUpdateBody } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAdminSsoClientRequest(
	request: NextRequest,
	scope: string,
	options: { csrf?: boolean } = {}
) {
	const featureResponse = await checkAccountFeatureResponse();
	if (featureResponse !== null) {
		return { response: featureResponse, status: 'error' as const };
	}

	const adminFeatureResponse = checkAdminFeatureResponse();
	if (adminFeatureResponse !== null) {
		return { response: adminFeatureResponse, status: 'error' as const };
	}

	const sameOriginResponse = checkSameOriginResponse(request);
	if (sameOriginResponse !== null) {
		return { response: sameOriginResponse, status: 'error' as const };
	}

	const cookieSecurityResponse = checkAccountCookieSecurityResponse(request);
	if (cookieSecurityResponse !== null) {
		return { response: cookieSecurityResponse, status: 'error' as const };
	}

	const rateLimitResponse = checkAccountRateLimitResponse(request, scope);
	if (rateLimitResponse !== null) {
		return { response: rateLimitResponse, status: 'error' as const };
	}

	const auth = authenticateAdminRequest(request);
	if (auth.status === 'error') {
		return {
			response: createAdminAuthErrorResponse(
				request,
				auth.message,
				auth.httpStatus
			),
			status: 'error' as const,
		};
	}

	if (options.csrf === true) {
		const csrfResponse = checkAdminCsrfResponse(request, auth.token);
		if (csrfResponse !== null) {
			return { response: csrfResponse, status: 'error' as const };
		}
	}

	return { status: 'ok' as const };
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-sso-client-detail'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const ssoModule = await import('@/lib/account/server/sso');
	const client = await ssoModule.getSsoClientById(id);
	if (client === null) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	return createNoStoreJsonResponse({
		client: ssoModule.createSsoClientPublicProfile(client),
	});
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-update-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const bodyResult = await readJsonBodyResult(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}
	const body = parseAdminSsoClientUpdateBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body?.id !== id) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [actionsModule, ssoModule] = await Promise.all([
		import('@/actions/account/sso'),
		import('@/lib/account/server/sso'),
	]);
	const secret = body.generate_secret
		? actionsModule.createSsoClientSecret()
		: null;
	const secretHashes =
		secret === null
			? body.secret_hashes
			: [...body.secret_hashes, secret.secret_hash];
	const updated = await actionsModule.updateSsoClient({
		...body,
		secret_hashes: secretHashes,
	});
	if (updated === null) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}
	const client = await ssoModule.getSsoClientById(id);
	if (client === null) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	return createNoStoreJsonResponse({
		client: ssoModule.createSsoClientPublicProfile(client),
		...(secret === null ? {} : { client_secret: secret.client_secret }),
	});
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-delete-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const { id } = await params;
	const actionsModule = await import('@/actions/account/sso');
	const isDeleted = await actionsModule.deleteSsoClient(id);
	if (!isDeleted) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	return createNoStoreJsonResponse({ message: 'sso-client-deleted' });
}
