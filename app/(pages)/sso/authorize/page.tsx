import { redirect, unstable_rethrow } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { Button, Card } from '@/design/ui/components';

import SsoAuthorizeAccountGate, {
	SsoAuthorizeAccountGateButton,
} from './accountGate';
import Heading from '@/components/heading';
import AccountInitialStateHydrator from '@/lib/account/client/components/accountInitialStateHydrator';
import AccountSsoGrantInitialDataHydrator from '@/lib/account/client/components/accountSsoGrantInitialDataHydrator';

import {
	SSO_CONTEXT_COOKIE_NAME,
	checkSsoClientEnabled,
	checkSsoRedirectUriFormat,
	createSsoRedirectUrl,
	createSsoTicket,
	getSsoClientById,
	getSsoContextCookieOptions,
	getSsoContextCookieValue,
	validateSsoRedirectUri,
} from '@/lib/account/server/sso';
import { authenticateAccountFromRequest } from '@/lib/account/server/auth';
import {
	createAccountMeInitialDataForAuthenticatedRequest,
	createAccountSsoGrantInitialDataForUser,
} from '@/lib/account/server/initialData';
import { USER_STATUS_MAP } from '@/lib/account/shared/constants';
import { getLogSafeErrorCode } from '@/lib/logging';

export const dynamic = 'force-dynamic';

async function createRequestFromHeaders() {
	const requestHeaders = await headers();
	const host = requestHeaders.get('host') ?? 'localhost';
	const defaultProtocol =
		process.env.NODE_ENV === 'production' ? 'https' : 'http';
	const protocol = requestHeaders.get('x-forwarded-proto') ?? defaultProtocol;

	return new NextRequest(`${protocol}://${host}/sso/authorize`, {
		headers: requestHeaders,
	});
}

async function clearSsoCookieForRedirect(request: NextRequest) {
	const cookieStore = await cookies();
	cookieStore.set(SSO_CONTEXT_COOKIE_NAME, '', {
		...getSsoContextCookieOptions(request),
		maxAge: 0,
	});
}

async function agreeSsoAuthorize(formData: FormData) {
	'use server';

	const request = await createRequestFromHeaders();
	const cookieStore = await cookies();
	const context = getSsoContextCookieValue(
		cookieStore.get(SSO_CONTEXT_COOKIE_NAME)?.value
	);
	if (context === null) {
		redirect('/sso/authorize?status=expired');
	}
	if (formData.get('transaction_id') !== context.transaction_id) {
		redirect('/sso/authorize?status=expired');
	}

	try {
		const [auth, client] = await Promise.all([
			authenticateAccountFromRequest(request, true),
			getSsoClientById(context.client_id),
		]);
		if (auth.status === 'error') {
			redirect('/sso/authorize');
		}
		if (auth.data.credential.password_must_change === 1) {
			redirect('/sso/authorize');
		}
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!validateSsoRedirectUri(client, context.redirect_uri)
		) {
			redirect('/sso/authorize?status=invalid');
		}
		if (auth.data.user.status !== USER_STATUS_MAP.active) {
			redirect('/sso/authorize?status=invalid');
		}

		const ticket = await createSsoTicket(
			context.client_id,
			auth.data.user.id,
			context.redirect_uri,
			context.code_challenge
		);
		await clearSsoCookieForRedirect(request);
		redirect(
			createSsoRedirectUrl(context.redirect_uri, ticket, context.state)
		);
	} catch (error) {
		unstable_rethrow(error);
		console.warn('SSO authorize confirmation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
		redirect('/sso/authorize?status=invalid');
	}
}

async function cancelSsoAuthorize() {
	'use server';

	const request = await createRequestFromHeaders();
	const cookieStore = await cookies();
	const context = getSsoContextCookieValue(
		cookieStore.get(SSO_CONTEXT_COOKIE_NAME)?.value
	);
	if (context === null) {
		redirect('/sso/authorize?status=cancelled');
	}

	try {
		await clearSsoCookieForRedirect(request);
		const client = await getSsoClientById(context.client_id);
		if (
			client?.cancel_redirect_uri !== undefined &&
			client.cancel_redirect_uri !== null &&
			checkSsoRedirectUriFormat(client.cancel_redirect_uri)
		) {
			redirect(client.cancel_redirect_uri);
		}
	} catch (error) {
		unstable_rethrow(error);
		console.warn('SSO authorize cancellation failed.', {
			errorCode: getLogSafeErrorCode(error),
		});
	}

	redirect('/sso/authorize?status=cancelled');
}

function SsoAuthorizeMessage({ status }: { status: string | null }) {
	const message =
		status === 'cancelled'
			? '授权已取消。'
			: status === 'expired'
				? '授权上下文已过期，请从外部服务重新发起登录。'
				: '授权请求无效或已失效，请从外部服务重新发起登录。';

	return (
		<div className="min-h-main-content py-6 text-foreground">
			<Card fullWidth shadow="sm" className="space-y-4 p-4">
				<Heading as="h1" isFirst>
					SSO授权
				</Heading>
				<p className="text-small leading-6 text-foreground-600">
					{message}
				</p>
			</Card>
		</div>
	);
}

function SsoAuthorizeLoginRequired() {
	return (
		<div className="min-h-main-content py-6 text-foreground">
			<AccountInitialStateHydrator
				data={{
					csrf_token: null,
					featureEnabled: true,
					isLoggedIn: false,
					password_must_change: false,
					state_epoch: null,
					syncMeta: null,
					user: null,
				}}
			/>
			<SsoAuthorizeAccountGate />
			<Card fullWidth shadow="sm" className="space-y-4 p-4">
				<Heading as="h1" isFirst>
					SSO授权
				</Heading>
				<p className="text-small leading-6 text-foreground-600">
					请先登录小助手账号以继续授权。
				</p>
				<SsoAuthorizeAccountGateButton />
			</Card>
		</div>
	);
}

function SsoAuthorizePasswordChangeRequired() {
	return (
		<div className="min-h-main-content py-6 text-foreground">
			<Card fullWidth shadow="sm" className="space-y-4 p-4">
				<Heading as="h1" isFirst>
					SSO授权
				</Heading>
				<p className="text-small leading-6 text-foreground-600">
					请先在弹窗中更新账号密码，完成后会继续授权。
				</p>
				<SsoAuthorizeAccountGateButton />
			</Card>
		</div>
	);
}

export default async function SsoAuthorizePage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const status = resolvedSearchParams.status ?? null;
	const cookieStore = await cookies();
	const context = getSsoContextCookieValue(
		cookieStore.get(SSO_CONTEXT_COOKIE_NAME)?.value
	);
	if (context === null) {
		return <SsoAuthorizeMessage status={status} />;
	}

	try {
		const request = await createRequestFromHeaders();
		const auth = await authenticateAccountFromRequest(request, true);
		if (auth.status === 'error') {
			if (auth.message === 'unauthorized') {
				return <SsoAuthorizeLoginRequired />;
			}

			return <SsoAuthorizeMessage status="invalid" />;
		}
		if (auth.data.credential.password_must_change === 1) {
			const accountInitialData =
				await createAccountMeInitialDataForAuthenticatedRequest({
					sessionTokenHash: auth.data.sessionTokenHash,
					userId: auth.data.user.id,
				});
			if (accountInitialData === null) {
				return <SsoAuthorizeMessage status="invalid" />;
			}

			return (
				<>
					<AccountInitialStateHydrator
						data={{
							...accountInitialData,
							password_must_change: true,
						}}
					/>
					<SsoAuthorizePasswordChangeRequired />
				</>
			);
		}
		if (auth.data.user.status !== USER_STATUS_MAP.active) {
			return <SsoAuthorizeMessage status="invalid" />;
		}

		const client = await getSsoClientById(context.client_id);
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!validateSsoRedirectUri(client, context.redirect_uri)
		) {
			return <SsoAuthorizeMessage status="invalid" />;
		}

		const accountSsoGrantInitialData =
			await createAccountSsoGrantInitialDataForUser(auth.data.user.id);
		const accountInitialData =
			await createAccountMeInitialDataForAuthenticatedRequest({
				sessionTokenHash: auth.data.sessionTokenHash,
				userId: auth.data.user.id,
			});
		if (accountInitialData === null) {
			return <SsoAuthorizeMessage status="invalid" />;
		}

		return (
			<div className="min-h-main-content py-6 text-foreground">
				<AccountInitialStateHydrator data={accountInitialData} />
				<AccountSsoGrantInitialDataHydrator
					data={accountSsoGrantInitialData}
				/>
				<Card fullWidth shadow="sm" className="space-y-5 p-4">
					<Heading as="h1" isFirst>
						SSO授权
					</Heading>
					<div className="space-y-2 text-small leading-6 text-foreground-600">
						<p className="text-base font-medium text-foreground-800">
							{client.name}将获取您的小助手账号身份
						</p>
						<p>当前账号：{auth.data.user.username}</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<form action={agreeSsoAuthorize}>
							<input
								name="transaction_id"
								type="hidden"
								value={context.transaction_id}
							/>
							<Button
								color="primary"
								type="submit"
								variant="flat"
							>
								同意并继续
							</Button>
						</form>
						<form action={cancelSsoAuthorize}>
							<Button type="submit" variant="flat">
								取消
							</Button>
						</form>
					</div>
				</Card>
			</div>
		);
	} catch (error) {
		unstable_rethrow(error);
		console.warn('SSO authorize page failed.', {
			errorCode: getLogSafeErrorCode(error),
		});

		return <SsoAuthorizeMessage status="invalid" />;
	}
}
