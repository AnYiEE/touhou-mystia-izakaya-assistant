'use client';

import { accountMessages } from '@/features/account/client/messages';

import { useI18n } from '@/shared/i18n/useI18n';

import SsoAuthorizePanel, {
	SsoAuthorizeNotice,
	authorizePanelIcons,
} from './AuthorizePanel';

export default function OfflineSsoAuthorizePageContent() {
	const { t } = useI18n(accountMessages);

	return (
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.error}
				subtitle={t('account.sso.offlineSubtitle')}
				tone="warning"
			>
				<SsoAuthorizeNotice
					icon={authorizePanelIcons.error}
					tone="warning"
				>
					{t('account.sso.offlineNotice')}
				</SsoAuthorizeNotice>
			</SsoAuthorizePanel>
		</div>
	);
}
