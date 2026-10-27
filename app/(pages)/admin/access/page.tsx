import { faCubes, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { type Metadata } from 'next';

import { AdminHeader } from '@/features/admin/client/components/shell';
import {
	AdminMetric,
	AdminMetricPanel,
	AdminPanel,
	AdminPanelTitle,
} from '@/features/admin/client/components/panels';
import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import { AccessAdminNavigation } from '@/features/featureAccess/admin/client/AccessAdminNavigation';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import {
	listAdminFeatureGroups,
	listAdminFeatureModules,
} from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '功能访问' };

export default async function AdminAccessPage() {
	const auth = await readAdminAuthInitialData('/admin/access');
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="功能访问"
			/>
		);
	}
	const [modules, groups] = await Promise.all([
		listAdminFeatureModules(),
		listAdminFeatureGroups(),
	]);
	const restrictedCount = modules.modules.filter(
		(module) => module.access_level !== 'public'
	).length;

	return (
		<>
			<AdminHeader
				icon={faShieldHalved}
				subtitle="统一管理模块策略、授权组和用户覆盖"
				title="功能访问"
			/>
			<AccessAdminNavigation />
			<AdminMetricPanel className="sm:grid-cols-3">
				<AdminMetric label="功能模块" value={modules.modules.length} />
				<AdminMetric label="受限模块" value={restrictedCount} />
				<AdminMetric label="授权组" value={groups.groups.length} />
			</AdminMetricPanel>
			<AdminPanel>
				<AdminPanelTitle icon={faCubes}>管理范围</AdminPanelTitle>
				<div className="grid gap-3 md:grid-cols-2">
					<p className="rounded-medium border border-default-200 p-3 text-small">
						功能模块与SSO应用决定默认访问级别。
					</p>
					<p className="rounded-medium border border-default-200 p-3 text-small">
						授权组和用户覆盖只对需要逐用户控制的模块生效。
					</p>
				</div>
			</AdminPanel>
		</>
	);
}
