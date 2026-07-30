import { type NextRequest } from 'next/server';

import { USER_STATUS_MAP } from '@/domain/account/contracts';

import { type TAccountAuthResult } from '@/features/account/server/auth/requestAuthentication';
import {
	type ISsoContext,
	createSsoContextTransactionId,
	createSsoRedirectUrl,
	getSsoContextCookie,
} from '@/features/account/sso/server/context';
import {
	checkSsoClientEnabled,
	checkSsoRedirectUriFormat,
} from '@/features/account/sso/server/validation';

import { getLogSafeErrorCode } from '@/infrastructure/logging/errorCode';

export interface ISsoAuthorizationInput {
	clientId: string;
	codeChallenge: string;
	redirectUri: string;
	state: string;
}

export type TSsoAuthorizationPrepareResult =
	| { context: ISsoContext; status: 'prepared' }
	| {
			auth: Extract<TAccountAuthResult, { status: 'error' }>;
			status: 'account-auth-error';
	  }
	| {
			error:
				| 'client-disabled'
				| 'feature-disabled'
				| 'invalid-redirect-uri';
			status: 'error';
	  };

export type TSsoAuthorizationSubmitIntent = 'agree' | 'cancel';

export type TSsoAuthorizationSubmitResult =
	| { clearContext: false; status: 'expired' | 'invalid' | 'resume' }
	| { clearContext: true; status: 'cancelled' }
	| { clearContext: true; redirectUrl: string; status: 'redirect' };

function readSsoAuthorizationContext(
	request: NextRequest,
	transactionId: unknown
) {
	const context = getSsoContextCookie(request);
	if (context === null || transactionId !== context.transaction_id) {
		return null;
	}

	return context;
}

export async function prepareSsoAuthorization(
	request: NextRequest,
	{ clientId, codeChallenge, redirectUri, state }: ISsoAuthorizationInput
): Promise<TSsoAuthorizationPrepareResult> {
	const ssoClientModule =
		await import('@/features/account/sso/server/clients');
	if (!(await ssoClientModule.hasAnySsoClient())) {
		return { error: 'feature-disabled', status: 'error' };
	}

	const client = await ssoClientModule.getSsoClientById(clientId);
	if (client === null) {
		return { error: 'feature-disabled', status: 'error' };
	}
	if (!checkSsoClientEnabled(client)) {
		return { error: 'client-disabled', status: 'error' };
	}
	if (!ssoClientModule.validateSsoRedirectUri(client, redirectUri)) {
		return { error: 'invalid-redirect-uri', status: 'error' };
	}

	const authModule =
		await import('@/features/account/server/auth/requestAuthentication');
	const auth = await authModule.authenticateAccountFromRequest(request, true);
	if (auth.status === 'error' && auth.message !== 'unauthorized') {
		return { auth, status: 'account-auth-error' };
	}

	return {
		context: {
			client_id: clientId,
			code_challenge: codeChallenge,
			redirect_uri: redirectUri,
			state,
			transaction_id: createSsoContextTransactionId(),
		},
		status: 'prepared',
	};
}

async function submitSsoAuthorizationAgree(
	request: NextRequest,
	transactionId: unknown
): Promise<TSsoAuthorizationSubmitResult> {
	const context = readSsoAuthorizationContext(request, transactionId);
	if (context === null) {
		return { clearContext: false, status: 'expired' };
	}

	try {
		const [
			authModule,
			ssoClientModule,
			ssoTicketModule,
			accountAuditModule,
		] = await Promise.all([
			import('@/features/account/server/auth/requestAuthentication'),
			import('@/features/account/sso/server/clients'),
			import('@/features/account/sso/server/tickets'),
			import('@/features/account/server/audit/service'),
		]);
		const [auth, client] = await Promise.all([
			authModule.authenticateAccountFromRequest(request, true),
			ssoClientModule.getSsoClientById(context.client_id),
		]);
		if (auth.status === 'error') {
			return { clearContext: false, status: 'resume' };
		}
		if (auth.data.credential.password_must_change === 1) {
			return { clearContext: false, status: 'resume' };
		}
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!ssoClientModule.validateSsoRedirectUri(
				client,
				context.redirect_uri
			) ||
			auth.data.user.status !== USER_STATUS_MAP.active
		) {
			return { clearContext: false, status: 'invalid' };
		}

		const ticketResult = await ssoTicketModule.createSsoTicket(
			context.client_id,
			auth.data.user.id,
			context.redirect_uri,
			context.code_challenge,
			{
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			},
			(trx, auditNow) =>
				accountAuditModule.writeAccountAuditLogInTransaction(
					trx,
					accountAuditModule.createAccountUserAuditLogInput({
						action: accountAuditModule.ACCOUNT_AUDIT_ACTION_MAP
							.authorizeSsoClient,
						metadata: {
							client_id: context.client_id,
							nickname: auth.data.user.nickname,
							redirect_uri_digest:
								accountAuditModule.createAccountAuditValueDigest(
									context.redirect_uri
								),
							username: auth.data.user.username,
						},
						request,
						userId: auth.data.user.id,
					}),
					auditNow
				)
		);
		if (ticketResult.status === 'unauthorized') {
			return { clearContext: false, status: 'resume' };
		}

		return {
			clearContext: true,
			redirectUrl: createSsoRedirectUrl(
				context.redirect_uri,
				ticketResult.ticket,
				context.state
			),
			status: 'redirect',
		};
	} catch (error) {
		console.warn('SSO authorize confirmation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return { clearContext: false, status: 'invalid' };
	}
}

async function submitSsoAuthorizationCancel(
	request: NextRequest,
	transactionId: unknown
): Promise<TSsoAuthorizationSubmitResult> {
	const context = readSsoAuthorizationContext(request, transactionId);
	if (context === null) {
		return { clearContext: false, status: 'expired' };
	}

	try {
		const ssoClientModule =
			await import('@/features/account/sso/server/clients');
		const client = await ssoClientModule.getSsoClientById(
			context.client_id
		);
		if (
			client?.cancel_redirect_uri !== undefined &&
			client.cancel_redirect_uri !== null &&
			checkSsoRedirectUriFormat(client.cancel_redirect_uri)
		) {
			return {
				clearContext: true,
				redirectUrl: client.cancel_redirect_uri,
				status: 'redirect',
			};
		}
	} catch (error) {
		console.warn('SSO authorize cancellation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}

	return { clearContext: true, status: 'cancelled' };
}

export async function submitSsoAuthorization(
	request: NextRequest,
	{
		intent,
		transactionId,
	}: { intent: TSsoAuthorizationSubmitIntent; transactionId: unknown }
): Promise<TSsoAuthorizationSubmitResult> {
	return intent === 'agree'
		? submitSsoAuthorizationAgree(request, transactionId)
		: submitSsoAuthorizationCancel(request, transactionId);
}
