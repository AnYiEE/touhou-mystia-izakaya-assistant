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
export const metadata: Metadata = { title: 'SSO应用' };

export default async function AdminAccessAppsPage() {
	const auth = await readAdminAuthInitialData('/admin/access/apps');
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="SSO应用"
			/>
		);
	}

	return (
		<AccessModulesClient
			admin={auth.admin}
			initialData={await listAdminFeatureModules()}
			mode="apps"
		/>
	);
}
