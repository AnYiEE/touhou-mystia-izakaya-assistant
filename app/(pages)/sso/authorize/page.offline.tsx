import { Card } from '@/design/ui/components';

import Heading from '@/components/heading';

export default function OfflineSsoAuthorizePage() {
	return (
		<div className="min-h-main-content py-6 text-foreground">
			<Card fullWidth shadow="sm" className="space-y-4 p-4">
				<Heading as="h1" isFirst>
					SSO授权
				</Heading>
				<p className="text-small leading-6 text-foreground-600">
					离线版本不支持账号授权。请使用在线服务从外部客户端重新发起登录。
				</p>
			</Card>
		</div>
	);
}
