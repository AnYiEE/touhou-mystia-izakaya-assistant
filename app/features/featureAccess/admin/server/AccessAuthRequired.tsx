import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import { AdminMessage } from '@/features/admin/client/components/feedback';
import { AdminPanel } from '@/features/admin/client/components/panels';
import {
	AdminHeader,
	AdminHeaderActionLink,
	AdminShell,
} from '@/features/admin/client/components/shell';

export function AccessAuthRequired({
	message,
	title,
}: {
	message: string | null;
	title: string;
}) {
	return (
		<AdminShell>
			<AdminHeader
				icon={faShieldHalved}
				subtitle="请先登录具有管理员权限的账号"
				title={title}
			/>
			<AdminPanel className="space-y-3">
				<div className="text-base font-semibold">需要管理员权限</div>
				<p className="text-small text-foreground-500">
					请返回管理员入口登录，或确认当前账号具有管理员权限。
				</p>
				{message !== null && <AdminMessage message={message} />}
				<AdminHeaderActionLink href="/admin" icon={faShieldHalved}>
					返回管理员入口
				</AdminHeaderActionLink>
			</AdminPanel>
		</AdminShell>
	);
}
