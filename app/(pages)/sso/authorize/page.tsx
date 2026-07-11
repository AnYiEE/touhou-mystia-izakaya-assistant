import { unstable_rethrow } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

import SsoAuthorizeAccountGate, {
	SsoAuthorizeAccountGateButton,
} from './accountGate';
import SsoAuthorizeControls from './authorizeControls';
import SsoAuthorizePanel, {
	SsoAuthorizeDetailList,
	SsoAuthorizeDetailRow,
	SsoAuthorizeNotice,
	authorizePanelIcons,
} from './authorizePanel';
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
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.error}
				subtitle="无法继续当前授权流程"
				tone="warning"
			>
				<SsoAuthorizeNotice
					icon={authorizePanelIcons.error}
					tone="warning"
				>
					{message}
				</SsoAuthorizeNotice>
			</SsoAuthorizePanel>
		</div>
	);
}

function SsoAuthorizeLoginRequired() {
	return (
		<div className="min-h-main-content text-foreground">
			<AccountInitialStateHydrator
				data={{
					csrf_token: null,
					featureEnabled: true,
					has_password: false,
					isLoggedIn: false,
					password_must_change: false,
					state_epoch: null,
					syncMeta: null,
					user: null,
				}}
			/>
			<SsoAuthorizeAccountGate />
			<SsoAuthorizePanel
				icon={authorizePanelIcons.login}
				subtitle="需要确认您的小助手账号身份"
			>
				<SsoAuthorizeNotice>
					请先登录小助手账号，登录完成后会回到当前授权流程。
				</SsoAuthorizeNotice>
				<SsoAuthorizeAccountGateButton />
			</SsoAuthorizePanel>
		</div>
	);
}

function SsoAuthorizePasswordChangeRequired() {
	return (
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.password}
				subtitle="账号需要先完成安全更新"
				tone="warning"
			>
				<SsoAuthorizeNotice tone="warning">
					请先在弹窗中更新账号密码，完成后会继续授权。
				</SsoAuthorizeNotice>
				<SsoAuthorizeAccountGateButton />
			</SsoAuthorizePanel>
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
		const accountInitialData =
			await createAccountMeInitialDataForAuthenticatedRequest({
				sessionId: auth.data.session.id,
				sessionTokenHash: auth.data.sessionTokenHash,
				userId: auth.data.user.id,
			});
		if (accountInitialData === null) {
			return <SsoAuthorizeMessage status="invalid" />;
		}
		if (accountInitialData.password_must_change) {
			return (
				<>
					<AccountInitialStateHydrator data={accountInitialData} />
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
			await createAccountSsoGrantInitialDataForUser(auth.data.user.id, {
				id: auth.data.session.id,
				token_hash: auth.data.sessionTokenHash,
			});
		if (accountSsoGrantInitialData === null) {
			return <SsoAuthorizeMessage status="invalid" />;
		}

		return (
			<div className="min-h-main-content text-foreground">
				<AccountInitialStateHydrator data={accountInitialData} />
				<AccountSsoGrantInitialDataHydrator
					data={accountSsoGrantInitialData}
				/>
				<SsoAuthorizePanel subtitle="确认后将返回发起登录的外部服务">
					<SsoAuthorizeNotice>
						{client.name}
						将获取您的小助手账号身份、用户名和昵称。
					</SsoAuthorizeNotice>
					<SsoAuthorizeDetailList>
						<SsoAuthorizeDetailRow
							label="授权服务"
							value={client.name}
						/>
						<SsoAuthorizeDetailRow
							label="当前账号"
							value={
								auth.data.user.nickname === null
									? `用户名：${auth.data.user.username}`
									: `用户名：${auth.data.user.username}，昵称：${auth.data.user.nickname}`
							}
						/>
					</SsoAuthorizeDetailList>
					<SsoAuthorizeControls
						transactionId={context.transaction_id}
					/>
				</SsoAuthorizePanel>
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
