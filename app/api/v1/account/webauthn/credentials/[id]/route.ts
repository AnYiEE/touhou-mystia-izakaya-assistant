import { type NextRequest } from 'next/server';

import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
	createAccountAuthErrorRouteResponse,
	readJsonBodyResult,
} from '@/lib/account/server/routeResponses';
import {
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/lib/account/shared/constants';
import { type IWebauthnCredentialListData } from '@/lib/account/shared/types';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/lib/api/routeResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SCOPE = 'webauthn-credential-delete';
const RENAME_SCOPE = 'webauthn-credential-rename';

interface IWebauthnCredentialRenameBody {
	name?: unknown;
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		SCOPE
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		SCOPE,
		'',
		{ parts: [{ name: 'credential', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const [credentialsModule, accountAuditModule] = await Promise.all([
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/accountAuditService'),
	]);
	const didDelete = await credentialsModule.deleteCredentialByIdForUser(
		id,
		auth.data.user.id
	);
	if (!didDelete) {
		return createNoStoreErrorResponse('passkey-not-found', 404);
	}

	await accountAuditModule.writeAccountAuditLogBestEffort(
		accountAuditModule.createAccountUserAuditLogInput({
			action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP.passkeyDeleted,
			metadata: {
				nickname: auth.data.user.nickname,
				target_record_digest:
					accountAuditModule.createAccountAuditValueDigest(id),
				username: auth.data.user.username,
			},
			request,
			userId: auth.data.user.id,
		})
	);

	return createNoStoreJsonResponse({ message: 'passkey-deleted' });
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const featureResponse = await checkAccountFeatureRouteResponse();
	if (featureResponse !== null) {
		return featureResponse;
	}

	const sameOriginResponse = checkSameOriginRouteResponse(request);
	if (sameOriginResponse !== null) {
		return sameOriginResponse;
	}

	const cookieSecurityResponse =
		checkAccountCookieSecurityRouteResponse(request);
	if (cookieSecurityResponse !== null) {
		return cookieSecurityResponse;
	}

	const preAuthRateLimitResponse = checkAccountPreAuthRateLimitRouteResponse(
		request,
		RENAME_SCOPE
	);
	if (preAuthRateLimitResponse !== null) {
		return preAuthRateLimitResponse;
	}

	const authModule = await import('@/lib/account/server/auth');
	const auth = await authModule.authenticateAccountFromRequest(request);
	if (auth.status === 'error') {
		return createAccountAuthErrorRouteResponse(auth, request);
	}

	const rateLimitResponse = checkAccountRateLimitRouteResponse(
		request,
		RENAME_SCOPE,
		'',
		{ parts: [{ name: 'credential', value: id }] }
	);
	if (rateLimitResponse !== null) {
		return rateLimitResponse;
	}

	if (!authModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse('forbidden', 403);
	}

	const bodyResult =
		await readJsonBodyResult<IWebauthnCredentialRenameBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse('payload-too-large', 413);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const name = normalizeWebauthnCredentialName(
		typeof body?.name === 'string' ? body.name : ''
	);
	if (!checkWebauthnCredentialNamePolicy(name)) {
		return createNoStoreErrorResponse('invalid-passkey-name', 400);
	}

	const [credentialsModule, presentationModule] = await Promise.all([
		import('@/lib/account/server/repositories/webauthnCredentials'),
		import('@/lib/account/server/webauthnPresentation'),
	]);
	const didRename = await credentialsModule.renameCredentialForUser(
		id,
		auth.data.user.id,
		name
	);
	if (!didRename) {
		return createNoStoreErrorResponse('passkey-not-found', 404);
	}

	const credentials = await credentialsModule.listCredentialsByUserId(
		auth.data.user.id
	);

	return createNoStoreJsonResponse({
		credentials: credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
	} satisfies IWebauthnCredentialListData);
}
