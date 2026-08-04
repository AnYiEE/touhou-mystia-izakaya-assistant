import { type NextRequest } from 'next/server';

import { ACCOUNT_API_RESPONSE_CODE_MAP } from '@/features/account/apiResponseCodes';
import {
	checkWebauthnCredentialNamePolicy,
	normalizeWebauthnCredentialName,
} from '@/features/account/constants';
import type { IWebauthnCredentialListData } from '@/features/account/contracts';
import { readJsonBodyResult } from '@/features/account/server/http/jsonBody';
import {
	checkAccountCookieSecurityRouteResponse,
	checkAccountFeatureRouteResponse,
	checkAccountPreAuthRateLimitRouteResponse,
	checkAccountRateLimitRouteResponse,
	checkSameOriginRouteResponse,
} from '@/features/account/server/http/routeGuards';
import { createAccountAuthErrorRouteResponse } from '@/features/account/server/http/routeResponses';

import { HTTP_API_RESPONSE_CODE_MAP } from '@/infrastructure/http/apiResponseCodes';
import {
	createNoStoreErrorResponse,
	createNoStoreJsonResponse,
} from '@/infrastructure/http/server/responses';

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

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
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

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const [credentialsModule, accountAuditModule] = await Promise.all([
		import('@/features/account/webauthn/server/persistence/credentials'),
		import('@/features/account/server/audit/service'),
	]);
	const deleteResult =
		await credentialsModule.deleteCredentialForActiveSession(
			id,
			auth.data.user.id,
			{
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
			(trx, auditNow) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.passkeyDeleted,
						metadata: {
							nickname: auth.data.user.nickname,
							target_record_digest:
								accountAuditModule.createAccountAuditValueDigest(
									id
								),
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				)
		);
	if (deleteResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}
	if (deleteResult.status === 'not-found') {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.passkeyNotFound,
			404
		);
	}

	return createNoStoreJsonResponse({
		message: ACCOUNT_API_RESPONSE_CODE_MAP.passkeyDeleted,
	});
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

	const [authModule, csrfModule] = await Promise.all([
		import('@/features/account/server/auth/requestAuthentication'),
		import('@/features/account/server/auth/accountCsrf'),
	]);
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

	if (!csrfModule.verifyAccountCsrf(request, auth.data.sessionTokenHash)) {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.forbidden,
			403
		);
	}

	const bodyResult =
		await readJsonBodyResult<IWebauthnCredentialRenameBody>(request);
	if (bodyResult.status === 'payload-too-large') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.payloadTooLarge,
			413
		);
	}

	const body = bodyResult.status === 'ok' ? bodyResult.data : null;
	const name = normalizeWebauthnCredentialName(
		typeof body?.name === 'string' ? body.name : ''
	);
	if (!checkWebauthnCredentialNamePolicy(name)) {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.invalidPasskeyName,
			400
		);
	}

	const [credentialsModule, presentationModule, webauthnModule] =
		await Promise.all([
			import('@/features/account/webauthn/server/persistence/credentials'),
			import('@/features/account/webauthn/server/presentation'),
			import('@/features/account/webauthn/server/service'),
		]);
	const renameResult =
		await credentialsModule.renameCredentialForActiveSession(
			id,
			auth.data.user.id,
			name,
			{ id: auth.data.session.id, token_hash: auth.data.sessionTokenHash }
		);
	if (renameResult.status === 'unauthorized') {
		return createNoStoreErrorResponse(
			HTTP_API_RESPONSE_CODE_MAP.unauthorized,
			401
		);
	}
	if (renameResult.status === 'not-found') {
		return createNoStoreErrorResponse(
			ACCOUNT_API_RESPONSE_CODE_MAP.passkeyNotFound,
			404
		);
	}
	const { rpID } = webauthnModule.getWebAuthnRelyingParty();

	return createNoStoreJsonResponse({
		credentials: renameResult.credentials.map((credential) =>
			presentationModule.createWebauthnCredentialSummary(credential)
		),
		rp_id: rpID,
	} satisfies IWebauthnCredentialListData);
}
