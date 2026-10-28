import { type Metadata } from 'next';

import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import { AccessModulesClient } from '@/features/featureAccess/admin/client/AccessModulesClient';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import { listAdminFeatureModules } from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '功能模块' };

export default async function AdminAccessModulesPage() {
	const auth = await readAdminAuthInitialData('/admin/access/modules');
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="功能模块"
			/>
		);
	}

	return (
		<AccessModulesClient
			admin={auth.admin}
			initialData={await listAdminFeatureModules()}
			mode="modules"
		/>
	);
}
