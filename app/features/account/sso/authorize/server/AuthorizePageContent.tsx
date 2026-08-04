import AccountInitialStateHydrator from '@/features/account/client/components/AccountInitialStateHydrator';
import AccountSsoGrantInitialDataHydrator from '@/features/account/client/components/AccountSsoGrantInitialDataHydrator';
import { SSO_AUTHORIZE_MESSAGE_MAP } from '@/features/account/sso/authorize/copy';
import {
	SsoAuthorizeAccountGate,
	SsoAuthorizeAccountGateButton,
	SsoAuthorizeControls,
	SsoAuthorizeDetailList,
	SsoAuthorizeDetailRow,
	SsoAuthorizeNotice,
	SsoAuthorizePanel,
	authorizePanelIcons,
} from '@/features/account/sso/authorize/client';

import { readSsoAuthorizeInitialData } from './initialData';

function SsoAuthorizeMessage({ status }: { status: string | null }) {
	const message =
		status === 'cancelled'
			? SSO_AUTHORIZE_MESSAGE_MAP.authorizationCancelled
			: status === 'expired'
				? SSO_AUTHORIZE_MESSAGE_MAP.authorizationExpired
				: SSO_AUTHORIZE_MESSAGE_MAP.invalidRequest;

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

export default async function SsoAuthorizePageContent({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const resolvedSearchParams = await searchParams;
	const initialData = await readSsoAuthorizeInitialData(
		resolvedSearchParams.status ?? null
	);

	if (initialData.kind === 'message') {
		return <SsoAuthorizeMessage status={initialData.status} />;
	}
	if (initialData.kind === 'login-required') {
		return <SsoAuthorizeLoginRequired />;
	}
	if (initialData.kind === 'password-change-required') {
		return (
			<>
				<AccountInitialStateHydrator data={initialData.account} />
				<SsoAuthorizePasswordChangeRequired />
			</>
		);
	}

	return (
		<div className="min-h-main-content text-foreground">
			<AccountInitialStateHydrator data={initialData.account} />
			<AccountSsoGrantInitialDataHydrator data={initialData.ssoGrants} />
			<SsoAuthorizePanel subtitle="确认后将返回发起登录的外部服务">
				<SsoAuthorizeNotice>
					{initialData.clientName}
					将获取您的小助手账号身份、用户名和昵称。
				</SsoAuthorizeNotice>
				<SsoAuthorizeDetailList>
					<SsoAuthorizeDetailRow
						label="授权服务"
						value={initialData.clientName}
					/>
					<SsoAuthorizeDetailRow
						label="当前账号"
						value={initialData.accountLabel}
					/>
				</SsoAuthorizeDetailList>
				<SsoAuthorizeControls
					transactionId={initialData.transactionId}
				/>
			</SsoAuthorizePanel>
		</div>
	);
}
