import { type Metadata } from 'next';

import {
	getAdminAuthInitialDataMessage,
	readAdminAuthInitialData,
} from '@/features/admin/server/initialData/auth';
import { AccessGroupsClient } from '@/features/featureAccess/admin/client/AccessGroupsClient';
import { AccessAuthRequired } from '@/features/featureAccess/admin/server/AccessAuthRequired';
import { listAdminFeatureGroups } from '@/features/featureAccess/admin/server/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '授权组' };

export default async function AdminAccessGroupsPage() {
	const auth = await readAdminAuthInitialData('/admin/access/groups');
	if (auth.admin === null) {
		return (
			<AccessAuthRequired
				message={getAdminAuthInitialDataMessage(auth)}
				title="授权组"
			/>
		);
	}

	return (
		<AccessGroupsClient
			admin={auth.admin}
			initialData={await listAdminFeatureGroups()}
		/>
	);
}
