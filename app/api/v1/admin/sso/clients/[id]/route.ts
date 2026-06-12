import { type NextRequest } from 'next/server';

import { readJsonBodyResult } from '@/api/v1/accountRouteUtils';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/api/v1/utils';
import {
	checkAdminSsoClientRequest,
	parseAdminSsoClientUpdateBody,
} from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkStringArrayEqual(left: string[], right: string[]) {
	return (
		left.length === right.length &&
		left.every((value, index) => value === right[index])
	);
}

function mergeStringArrays(...arrays: string[][]) {
	return [...new Set(arrays.flat())];
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
		import('@/lib/account/server/repositories/sso'),
		import('@/lib/account/server/sso'),
	]);
	const currentClient = await ssoModule.getSsoClientById(id);
	if (currentClient === null) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	const isSecretMutation =
		body.generate_secret ||
		!checkStringArrayEqual(body.secret_hashes, currentClient.secret_hashes);
	if (
		(currentClient.disabled_at !== null || body.disabled) &&
		isSecretMutation
	) {
		return createNoStoreErrorResponse('client-disabled', 403);
	}
	const nextDisabledAt = body.disabled
		? (currentClient.disabled_at ?? Date.now())
		: null;

	const secret = body.generate_secret
		? actionsModule.createSsoClientSecret()
		: null;
	const secretHashes =
		secret === null
			? body.secret_hashes
			: mergeStringArrays(
					currentClient.secret_hashes,
					body.secret_hashes,
					[secret.secret_hash]
				);
	const updated = await actionsModule.updateSsoClient({
		cancel_redirect_uri: body.cancel_redirect_uri,
		custom_scheme_redirect_uris: body.custom_scheme_redirect_uris,
		disabled_at: nextDisabledAt,
		https_redirect_uris: body.https_redirect_uris,
		id: body.id,
		loopback_redirect_paths: body.loopback_redirect_paths,
		name: body.name,
		secret_hashes: secretHashes,
		status_callback_url: body.status_callback_url,
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
	const actionsModule = await import('@/lib/account/server/repositories/sso');
	const isDeleted = await actionsModule.deleteSsoClient(id);
	if (!isDeleted) {
		return createNoStoreErrorResponse('sso-client-not-found', 404);
	}

	return createNoStoreJsonResponse({ message: 'sso-client-deleted' });
}
