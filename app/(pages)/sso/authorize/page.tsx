import { unstable_rethrow } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import { Card } from '@/design/ui/components';

import SsoAuthorizeAccountGate, {
	SsoAuthorizeAccountGateButton,
} from './accountGate';
import SsoAuthorizeControls from './authorizeControls';
import Heading from '@/components/heading';
import AccountInitialStateHydrator from '@/lib/account/client/components/accountInitialStateHydrator';
import AccountSsoGrantInitialDataHydrator from '@/lib/account/client/components/accountSsoGrantInitialDataHydrator';

import {
	SSO_CONTEXT_COOKIE_NAME,
	getSsoContextCookieValue,
} from '@/lib/account/server/ssoContext';
import { authenticateAccountFromRequest } from '@/lib/account/server/auth';
import {
	createAccountMeInitialDataForAuthenticatedRequest,
	createAccountSsoGrantInitialDataForUser,
} from '@/lib/account/server/initialData';
import { checkSsoClientEnabled } from '@/lib/account/server/ssoValidation';
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

		const ssoModule = await import('@/lib/account/server/sso');
		const client = await ssoModule.getSsoClientById(context.client_id);
		if (
			client === null ||
			!checkSsoClientEnabled(client) ||
			!ssoModule.validateSsoRedirectUri(client, context.redirect_uri)
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
					<SsoAuthorizeControls
						transactionId={context.transaction_id}
					/>
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
