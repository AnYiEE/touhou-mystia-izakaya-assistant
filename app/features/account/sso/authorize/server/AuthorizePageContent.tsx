import AccountInitialStateHydrator from '@/features/account/client/components/AccountInitialStateHydrator';
import AccountSsoGrantInitialDataHydrator from '@/features/account/client/components/AccountSsoGrantInitialDataHydrator';
import {
	type TAccountMessageKey,
	accountMessages,
} from '@/features/account/client/messages';
import type { TAccountMeResponse } from '@/features/account/contracts';
import {
	SsoAuthorizeAccountContextRefresh,
	SsoAuthorizeAccountGate,
	SsoAuthorizeAccountGateButton,
	SsoAuthorizeControls,
	SsoAuthorizeDetailList,
	SsoAuthorizeDetailRow,
	SsoAuthorizeNotice,
	SsoAuthorizePanel,
	authorizePanelIcons,
} from '@/features/account/sso/authorize/client';
import { readRequestLocale } from '@/features/preferences/server/requestLocale';

import { type TLocale } from '@/shared/i18n/locale';
import { translate } from '@/shared/i18n/messages';

import { readSsoAuthorizeInitialData } from './initialData';

function t(locale: TLocale, key: TAccountMessageKey) {
	return translate(accountMessages, locale, key);
}

const SSO_AUTHORIZE_LOGGED_OUT_ACCOUNT_STATE = {
	csrf_token: null,
	featureEnabled: true,
	has_password: false,
	isLoggedIn: false,
	password_must_change: false,
	state_epoch: null,
	syncMeta: null,
	user: null,
} as const satisfies TAccountMeResponse;

function SsoAuthorizeMessage({
	locale,
	status,
}: {
	locale: TLocale;
	status: string | null;
}) {
	const message =
		status === 'cancelled'
			? t(locale, 'account.sso.status.authorizationCancelled')
			: status === 'expired'
				? t(locale, 'account.sso.status.authorizationExpired')
				: t(locale, 'account.sso.status.invalidRequest');

	return (
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.error}
				subtitle={t(locale, 'account.sso.errorFlowSubtitle')}
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

function SsoAuthorizeLoginRequired({ locale }: { locale: TLocale }) {
	return (
		<div className="min-h-main-content text-foreground">
			<AccountInitialStateHydrator
				data={SSO_AUTHORIZE_LOGGED_OUT_ACCOUNT_STATE}
			/>
			<SsoAuthorizeAccountGate />
			<SsoAuthorizePanel
				icon={authorizePanelIcons.login}
				subtitle={t(locale, 'account.sso.loginRequiredSubtitle')}
			>
				<SsoAuthorizeNotice>
					{t(locale, 'account.sso.loginRequiredNotice')}
				</SsoAuthorizeNotice>
				<SsoAuthorizeAccountGateButton />
			</SsoAuthorizePanel>
		</div>
	);
}

function SsoAuthorizePasswordChangeRequired({ locale }: { locale: TLocale }) {
	return (
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.password}
				subtitle={t(locale, 'account.sso.passwordChangeSubtitle')}
				tone="warning"
			>
				<SsoAuthorizeNotice tone="warning">
					{t(locale, 'account.sso.passwordChangeNotice')}
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
	const locale = await readRequestLocale();
	const initialData = await readSsoAuthorizeInitialData(
		resolvedSearchParams.status ?? null,
		locale
	);

	if (initialData.kind === 'login-required') {
		return <SsoAuthorizeLoginRequired locale={locale} />;
	}
	if (initialData.kind === 'message') {
		return (
			<SsoAuthorizeMessage locale={locale} status={initialData.status} />
		);
	}
	if (initialData.kind === 'password-change-required') {
		return (
			<>
				<AccountInitialStateHydrator data={initialData.account} />
				<SsoAuthorizePasswordChangeRequired locale={locale} />
			</>
		);
	}

	return (
		<div className="min-h-main-content text-foreground">
			<AccountInitialStateHydrator data={initialData.account} />
			<AccountSsoGrantInitialDataHydrator data={initialData.ssoGrants} />
			<SsoAuthorizeAccountContextRefresh
				initialUser={initialData.account.user}
			/>
			<SsoAuthorizePanel
				subtitle={t(locale, 'account.sso.confirmSubtitle')}
			>
				<SsoAuthorizeNotice>
					{translate(
						accountMessages,
						locale,
						'account.sso.confirmNotice',
						{ client: initialData.clientName }
					)}
				</SsoAuthorizeNotice>
				<SsoAuthorizeDetailList>
					<SsoAuthorizeDetailRow
						label={t(locale, 'account.sso.detail.client')}
						value={initialData.clientName}
					/>
					<SsoAuthorizeDetailRow
						label={t(locale, 'account.sso.detail.account')}
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
