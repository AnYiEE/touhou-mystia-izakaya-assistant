import { type NextRequest } from 'next/server';

import { readJsonBodyResult } from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	checkAdminSsoClientRequest,
	parseAdminSsoClientCreateBody,
} from './utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkSsoClientConflictError(error: unknown) {
	if (error === null || typeof error !== 'object') {
		return false;
	}

	const code = Object.getOwnPropertyDescriptor(error, 'code')
		?.value as unknown;
	return (
		code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
		code === 'SQLITE_CONSTRAINT_UNIQUE'
	);
}

export async function GET(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-list-sso-clients'
	);
	if (check.status === 'error') {
		return check.response;
	}

	const ssoModule = await import('@/lib/account/server/sso');
	const clients = await ssoModule.listSsoClients();

	return createNoStoreJsonResponse({
		clients: clients.map(ssoModule.createSsoClientPublicProfile),
	});
}

export async function POST(request: NextRequest) {
	const check = await checkAdminSsoClientRequest(
		request,
		'admin-create-sso-client',
		{ csrf: true }
	);
	if (check.status === 'error') {
		return check.response;
	}

	const bodyResult = await readJsonBodyResult(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = parseAdminSsoClientCreateBody(
		bodyResult.status === 'ok' ? bodyResult.data : null
	);
	if (body === null) {
		return createNoStoreErrorResponse('invalid-object-structure', 400);
	}

	const [actionsModule, ssoModule] = await Promise.all([
		import('@/lib/account/server/repositories/sso'),
		import('@/lib/account/server/sso'),
	]);
	try {
		const result = await actionsModule.createSsoClient(body);
		const client = ssoModule.createSsoClientPublicProfile(
			await ssoModule
				.getSsoClientById(result.client.id)
				.then((record) => {
					if (record === null) {
						throw new Error('client-not-found-after-create');
					}
					return record;
				})
		);

		return createNoStoreJsonResponse(
			{ client, client_secret: result.client_secret },
			201
		);
	} catch (error) {
		if (checkSsoClientConflictError(error)) {
			return createNoStoreErrorResponse('sso-client-conflict', 409);
		}
		throw error;
	}
}
