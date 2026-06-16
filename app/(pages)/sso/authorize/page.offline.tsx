import SsoAuthorizePanel, {
	SsoAuthorizeNotice,
	authorizePanelIcons,
} from './authorizePanel';

export default function OfflineSsoAuthorizePage() {
	return (
		<div className="min-h-main-content text-foreground">
			<SsoAuthorizePanel
				icon={authorizePanelIcons.error}
				subtitle="离线版本无法完成账号授权"
				tone="warning"
			>
				<SsoAuthorizeNotice
					icon={authorizePanelIcons.error}
					tone="warning"
				>
					离线版本不支持账号授权。请使用在线服务从外部客户端重新发起登录。
				</SsoAuthorizeNotice>
			</SsoAuthorizePanel>
		</div>
	);
}
